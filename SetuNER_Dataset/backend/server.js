/**
 * SetuNER (SIH26002) - reference backend API.
 *
 *   npm init -y && npm install express cors
 *   node server.js          ->  http://localhost:4000
 *
 * Reads the generated JSON directly, so it runs with zero database setup —
 * useful for the hackathon demo. Swap the `load()` calls for SQL queries
 * against schema.sql when the DB is up; the response shapes stay identical.
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DATA = path.join(__dirname, "..", "frontend");
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf-8"));

const districtsGeo = load("districts.geojson");
const roadsGeo = load("road_segments.geojson");
const incidentsGeo = load("incidents.geojson");
const states = load("states.json");
const vehicles = load("vehicles.json");
const gps = load("gps_tracks.json");
const alerts = load("alerts.json");
const status = load("route_status.json");
const districtStatus = load("district_status.json");
const landslidesGeo = load("landslides.geojson");
const susceptibilityGeo = load("susceptibility.geojson");
const disruptions = load("disruptions.json");
const hazardTrend = load("hazard_trend.json");

const statusById = Object.fromEntries(status.map((s) => [s.segment_id, s]));
const segById = Object.fromEntries(
  roadsGeo.features.map((f) => [f.properties.segment_id, f])
);

const ok = (res, data, extra = {}) =>
  res.json({ success: true, count: Array.isArray(data) ? data.length : undefined, data, ...extra });

// ------------------------------------------------------------ meta
app.get("/api/health", (_, res) =>
  res.json({ success: true, service: "setuner-api", time: new Date().toISOString() })
);
app.get("/api/states", (_, res) => ok(res, states));

// ------------------------------------------------------- districts
app.get("/api/districts", (req, res) => {
  let f = districtsGeo.features;
  if (req.query.state) f = f.filter((x) => x.properties.state_code === req.query.state);
  ok(res, { type: "FeatureCollection", features: f }, { count: f.length });
});

app.get("/api/districts/status", (req, res) => {
  let d = districtStatus;
  if (req.query.state) d = d.filter((x) => x.state_code === req.query.state);
  if (req.query.risk) d = d.filter((x) => x.worst_risk_level === req.query.risk);
  ok(res, d);
});

app.get("/api/districts/:id", (req, res) => {
  const d = districtStatus.find((x) => x.district_id === req.params.id);
  if (!d) return res.status(404).json({ success: false, error: "District not found" });
  const segs = roadsGeo.features
    .filter(
      (f) =>
        f.properties.from_district_id === d.district_id ||
        f.properties.to_district_id === d.district_id
    )
    .map((f) => f.properties);
  const inc = incidentsGeo.features
    .filter((f) => f.properties.district_id === d.district_id)
    .map((f) => f.properties);
  ok(res, { ...d, segments: segs, incidents: inc });
});

// ---------------------------------------------------------- roads
app.get("/api/segments", (req, res) => {
  let f = roadsGeo.features;
  const { risk, status: st, highway, district } = req.query;
  if (risk) f = f.filter((x) => x.properties.risk_level === risk);
  if (st) f = f.filter((x) => x.properties.status === st);
  if (highway) f = f.filter((x) => x.properties.highway_code === highway);
  if (district)
    f = f.filter(
      (x) =>
        x.properties.from_district_id === district ||
        x.properties.to_district_id === district
    );
  ok(res, { type: "FeatureCollection", features: f }, { count: f.length });
});

app.get("/api/segments/:id", (req, res) => {
  const f = segById[req.params.id];
  if (!f) return res.status(404).json({ success: false, error: "Segment not found" });
  ok(res, f);
});

// --------------------------------------------------- risk prediction
// Mirrors the formula the ML model was trained on, so the API and the
// model agree. Replace with a call to the FastAPI model service in prod.
function scoreRisk(p, r24, r72, r7) {
  let s = 0;
  s += (r72 / 100) * 2.6;
  s += (r24 / 100) * 1.7;
  s += (r7 / 400) * 1.1;
  s += (p.avg_slope_deg / 10) * 1.5;
  s += (p.elevation_m / 1000) * 0.45;
  s += { good: 0, fair: 0.5, poor: 1.2 }[p.surface_quality];
  s += p.bridge_count * 0.1;
  if (p.terrain === "plain") {
    s += Math.max(0, (r72 - 120) / 100) * 1.8;
    s -= 0.8;
  }
  if (p.dist_to_river_km < 1.5) s += 0.7;
  return Math.round(s * 1000) / 1000;
}
const levelOf = (s) => (s >= 9.8 ? "high" : s >= 6.5 ? "medium" : "low");

app.post("/api/predict-risk", (req, res) => {
  const { segment_id, rainfall_24h_mm = 0, rainfall_72h_mm = 0, rainfall_7d_mm = 0 } = req.body || {};
  const f = segById[segment_id];
  if (!f) return res.status(400).json({ success: false, error: "Unknown segment_id" });
  const score = scoreRisk(f.properties, rainfall_24h_mm, rainfall_72h_mm, rainfall_7d_mm);
  ok(res, {
    segment_id,
    risk_score: score,
    risk_level: levelOf(score),
    inputs: { rainfall_24h_mm, rainfall_72h_mm, rainfall_7d_mm },
  });
});

// --------------------------------------------------------- routing
// Greedy corridor walk that avoids blocked segments and reports the
// delay penalty picked up along the way.
// Graph nodes are town junctions (not districts) — two towns can share a
// district, and a district-level graph silently drops those legs.
function resolveJunctions(key) {
  const names = new Set();
  roadsGeo.features.forEach((f) => {
    const p = f.properties;
    if (p.from_name === key) names.add(p.from_name);
    if (p.to_name === key) names.add(p.to_name);
    if (p.from_district_id === key) names.add(p.from_name);
    if (p.to_district_id === key) names.add(p.to_name);
  });
  return [...names];
}

app.get("/api/route", (req, res) => {
  const { from, to, avoid_risk = "high" } = req.query;
  if (!from || !to)
    return res
      .status(400)
      .json({ success: false, error: "from and to are required (district id or town name)" });

  const starts = resolveJunctions(from);
  const goals = new Set(resolveJunctions(to));
  if (!starts.length) return res.status(404).json({ success: false, error: `Unknown origin: ${from}` });
  if (!goals.size) return res.status(404).json({ success: false, error: `Unknown destination: ${to}` });

  const nodes = new Set();
  const edges = [];
  roadsGeo.features.forEach((f) => {
    const p = f.properties;
    nodes.add(p.from_name);
    nodes.add(p.to_name);
    const blocked = p.status === "blocked" || (avoid_risk === "high" && p.risk_level === "high");
    const cost = p.length_km + p.estimated_delay_min * 0.5 + (blocked ? 1e6 : 0);
    edges.push({ a: p.from_name, b: p.to_name, cost, p, blocked });
    edges.push({ a: p.to_name, b: p.from_name, cost, p, blocked });
  });

  // Dijkstra from every candidate origin junction at once
  const dist = {}, prev = {};
  nodes.forEach((n) => (dist[n] = Infinity));
  starts.forEach((s) => (dist[s] = 0));
  const unvisited = new Set(nodes);
  while (unvisited.size) {
    let u = null;
    for (const n of unvisited) if (u === null || dist[n] < dist[u]) u = n;
    if (u === null || dist[u] === Infinity) break;
    if (goals.has(u) && dist[u] > 0) break;
    unvisited.delete(u);
    edges.filter((e) => e.a === u).forEach((e) => {
      const alt = dist[u] + e.cost;
      if (alt < dist[e.b]) { dist[e.b] = alt; prev[e.b] = { node: u, edge: e }; }
    });
  }

  // pick the cheapest reachable goal junction
  let target = null;
  for (const g of goals)
    if (dist[g] < Infinity && dist[g] > 0 && (target === null || dist[g] < dist[target])) target = g;
  if (target === null)
    return res.status(404).json({ success: false, error: "No route found" });

  const legs = [];
  let cur = target;
  while (prev[cur]) { legs.unshift(prev[cur].edge); cur = prev[cur].node; }

  ok(res, {
    from, to,
    origin_junction: cur,
    destination_junction: target,
    total_distance_km: Math.round(legs.reduce((a, e) => a + e.p.length_km, 0) * 100) / 100,
    total_delay_min: legs.reduce((a, e) => a + e.p.estimated_delay_min, 0),
    uses_blocked_segment: legs.some((e) => e.blocked),
    legs: legs.map((e) => ({
      segment_id: e.p.segment_id, highway_code: e.p.highway_code,
      from_name: e.p.from_name, to_name: e.p.to_name,
      length_km: e.p.length_km, risk_level: e.p.risk_level,
      status: e.p.status, estimated_delay_min: e.p.estimated_delay_min,
    })),
    geometry: {
      type: "MultiLineString",
      coordinates: legs.map((e) => segById[e.p.segment_id].geometry.coordinates),
    },
  });
});

// ------------------------------------------------------- incidents
app.get("/api/incidents", (req, res) => {
  let f = incidentsGeo.features;
  const { status: st, type, severity, district } = req.query;
  if (st) f = f.filter((x) => x.properties.status === st);
  if (type) f = f.filter((x) => x.properties.incident_type === type);
  if (severity) f = f.filter((x) => x.properties.severity === severity);
  if (district) f = f.filter((x) => x.properties.district_id === district);
  ok(res, { type: "FeatureCollection", features: f }, { count: f.length });
});

// Field-app submission. Mirrors what the offline queue POSTs on reconnect.
app.post("/api/incidents", (req, res) => {
  const b = req.body || {};
  const required = ["segment_id", "incident_type", "severity", "latitude", "longitude"];
  const missing = required.filter((k) => b[k] === undefined);
  if (missing.length)
    return res.status(400).json({ success: false, error: `Missing: ${missing.join(", ")}` });
  if (!segById[b.segment_id])
    return res.status(400).json({ success: false, error: "Unknown segment_id" });

  const id = `INC-${String(incidentsGeo.features.length + 1).padStart(4, "0")}`;
  const feature = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
    properties: {
      incident_id: id,
      segment_id: b.segment_id,
      district_id: segById[b.segment_id].properties.from_district_id,
      incident_type: b.incident_type,
      severity: b.severity,
      reported_at: b.reported_at || new Date().toISOString(),
      reported_by_id: b.reported_by_id || "USR-001",
      description: b.description || "",
      photo_url: b.photo_url || null,
      status: "open",
      synced_offline: Boolean(b.synced_offline),
      verified: false,
    },
  };
  incidentsGeo.features.push(feature);
  res.status(201).json({ success: true, data: feature });
});

// -------------------------------------------------------- vehicles
app.get("/api/vehicles", (req, res) => {
  let v = vehicles;
  if (req.query.status) v = v.filter((x) => x.status === req.query.status);
  if (req.query.cargo) v = v.filter((x) => x.cargo_type === req.query.cargo);
  const latest = {};
  gps.forEach((g) => {
    if (!latest[g.vehicle_id] || g.recorded_at > latest[g.vehicle_id].recorded_at)
      latest[g.vehicle_id] = g;
  });
  ok(res, v.map((x) => ({
    ...x,
    last_position: latest[x.vehicle_id] || null,
    segment_risk: statusById[x.current_segment_id]?.risk_level || null,
  })));
});

app.get("/api/vehicles/:id/track", (req, res) => {
  const t = gps.filter((g) => g.vehicle_id === req.params.id)
               .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  if (!t.length) return res.status(404).json({ success: false, error: "No track found" });
  ok(res, {
    vehicle_id: req.params.id,
    pings: t,
    geometry: { type: "LineString", coordinates: t.map((g) => [g.longitude, g.latitude]) },
  });
});

// ---------------------------------------------------------- alerts
app.get("/api/alerts", (req, res) => {
  let a = alerts;
  if (req.query.severity) a = a.filter((x) => x.severity === req.query.severity);
  if (req.query.lang) a = a.filter((x) => x.languages.includes(req.query.lang));
  const lang = req.query.lang;
  ok(res, a.map((x) => (lang ? { ...x, message: x.messages[lang] } : x)));
});

// ------------------------------------------------------ dashboard
app.get("/api/dashboard/summary", (_, res) => {
  const seg = roadsGeo.features.map((f) => f.properties);
  const inc = incidentsGeo.features.map((f) => f.properties);
  ok(res, {
    as_of: status[0]?.as_of,
    segments: {
      total: seg.length,
      open: seg.filter((s) => s.status === "open").length,
      restricted: seg.filter((s) => s.status === "restricted").length,
      blocked: seg.filter((s) => s.status === "blocked").length,
      high_risk: seg.filter((s) => s.risk_level === "high").length,
    },
    incidents: {
      total: inc.length,
      open: inc.filter((i) => i.status === "open").length,
      in_progress: inc.filter((i) => i.status === "in_progress").length,
      critical: inc.filter((i) => i.severity === "critical").length,
    },
    vehicles: {
      total: vehicles.length,
      in_transit: vehicles.filter((v) => v.status === "in_transit").length,
      delayed: vehicles.filter((v) => v.status === "delayed").length,
      halted: vehicles.filter((v) => v.status === "halted").length,
    },
    alerts: { active: alerts.length, critical: alerts.filter((a) => a.severity === "critical").length },
    districts: {
      total: districtStatus.length,
      fully_accessible: districtStatus.filter((d) => d.accessibility_pct === 100).length,
      worst: [...districtStatus].sort((a, b) => a.accessibility_pct - b.accessibility_pct)
        .slice(0, 5)
        .map((d) => ({ district_id: d.district_id, name: d.district_name, pct: d.accessibility_pct })),
    },
  });
});

// ========================================================= HAZARD MODULE

// Historical landslide inventory (recent years, as GeoJSON for the map).
app.get("/api/landslides", (req, res) => {
  let f = landslidesGeo.features;
  const { severity, type, trigger, state, district, segment, blocked, from, to } = req.query;
  if (severity) f = f.filter((x) => x.properties.severity === severity);
  if (type) f = f.filter((x) => x.properties.landslide_type === type);
  if (trigger) f = f.filter((x) => x.properties.trigger === trigger);
  if (state) f = f.filter((x) => x.properties.state_code === state);
  if (district) f = f.filter((x) => x.properties.district_id === district);
  if (segment) f = f.filter((x) => x.properties.segment_id === segment);
  if (blocked !== undefined)
    f = f.filter((x) => String(x.properties.road_blocked) === String(blocked));
  if (from) f = f.filter((x) => x.properties.event_date >= from);
  if (to) f = f.filter((x) => x.properties.event_date <= to);
  ok(res, { type: "FeatureCollection", features: f }, { count: f.length });
});

// Landslide susceptibility zonation, joined onto road geometry.
app.get("/api/susceptibility", (req, res) => {
  let f = susceptibilityGeo.features;
  if (req.query.class) f = f.filter((x) => x.properties.susceptibility_class === req.query.class);
  if (req.query.district) f = f.filter((x) => x.properties.district_id === req.query.district);
  ok(res, { type: "FeatureCollection", features: f }, { count: f.length });
});

// Road closure events with duration, impact and restoration detail.
app.get("/api/disruptions", (req, res) => {
  let d = disruptions;
  const { cause, segment, state, closure, essential, min_hours } = req.query;
  if (cause) d = d.filter((x) => x.cause === cause);
  if (segment) d = d.filter((x) => x.segment_id === segment);
  if (state) d = d.filter((x) => x.state_code === state);
  if (closure) d = d.filter((x) => x.closure_type === closure);
  if (essential !== undefined)
    d = d.filter((x) => String(x.essential_cargo_affected) === String(essential));
  if (min_hours) d = d.filter((x) => x.duration_hours >= Number(min_hours));
  ok(res, d);
});

// The rising-threat trend — what the pitch-deck chart plots.
app.get("/api/hazard/trend", (_, res) => ok(res, hazardTrend));

// Per-segment historical hazard burden: where to invest first.
app.get("/api/hazard/segments", (req, res) => {
  const byId = {};
  susceptibilityGeo.features.forEach((f) => {
    const p = f.properties;
    byId[p.segment_id] = {
      segment_id: p.segment_id,
      highway_code: p.highway_code,
      from_name: p.from_name,
      to_name: p.to_name,
      susceptibility_class: p.susceptibility_class,
      lsi_score: p.lsi_score,
      landslide_count: p.historic_event_count,
      disruption_count: 0,
      total_closure_hours: 0,
      vehicles_stranded: 0,
      economic_loss_inr: 0,
    };
  });
  disruptions.forEach((d) => {
    const r = byId[d.segment_id];
    if (!r) return;
    r.disruption_count += 1;
    r.total_closure_hours += d.duration_hours;
    r.vehicles_stranded += d.vehicles_stranded;
    r.economic_loss_inr += d.estimated_economic_loss_inr;
  });
  let rows = Object.values(byId).map((r) => ({
    ...r,
    total_closure_hours: Math.round(r.total_closure_hours * 10) / 10,
  }));
  rows.sort((a, b) => b.total_closure_hours - a.total_closure_hours);
  if (req.query.limit) rows = rows.slice(0, Number(req.query.limit));
  ok(res, rows);
});

// Predict how long a closure will last. Mirrors the regression model's inputs.
app.post("/api/predict-duration", (req, res) => {
  const b = req.body || {};
  const f = segById[b.segment_id];
  if (!f) return res.status(400).json({ success: false, error: "Unknown segment_id" });
  const p = f.properties;
  const zone = susceptibilityGeo.features.find(
    (z) => z.properties.segment_id === b.segment_id
  );
  const cause = b.cause || "landslide";
  const vol = Number(b.volume_m3) || 0;
  const month = Number(b.month) || new Date().getMonth() + 1;

  let hrs;
  if (cause === "landslide" && vol > 0) {
    hrs = vol / 900;
    hrs *= { rock: 1.9, debris: 1.0, earth: 0.8 }[b.material || "debris"];
    hrs *= { mountain: 1.6, hilly: 1.15, plain: 0.85 }[p.terrain];
    hrs *= p.importance === "national" ? 0.55 : 1.35;
    hrs *= { 1: 1.5, 2: 1.15, 4: 0.85 }[p.lanes] || 1.0;
  } else {
    hrs = { flood: 90, bridge_damage: 520, road_subsidence: 140,
            maintenance: 38, fallen_tree: 12, accident_blockage: 14,
            protest_blockade: 18 }[cause] || 24;
    hrs *= p.importance === "national" ? 0.6 : 1.3;
  }
  hrs *= [6, 7, 8].includes(month) ? 1.7 : [5, 9].includes(month) ? 1.25 : 1.0;
  hrs = Math.round(Math.min(Math.max(hrs, 1), 2000) * 10) / 10;

  ok(res, {
    segment_id: b.segment_id,
    cause,
    predicted_duration_hours: hrs,
    predicted_bucket: hrs < 6 ? "under_6h" : hrs < 24 ? "6_24h"
                      : hrs < 72 ? "1_3days" : "over_3days",
    susceptibility_class: zone ? zone.properties.susceptibility_class : null,
    basis: { terrain: p.terrain, importance: p.importance, lanes: p.lanes, month },
  });
});

app.use((req, res) => res.status(404).json({ success: false, error: `No route ${req.path}` }));

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`SetuNER API listening on http://localhost:${PORT}`));
}
module.exports = app;
