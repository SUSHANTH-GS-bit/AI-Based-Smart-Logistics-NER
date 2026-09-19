#!/usr/bin/env python3
"""
SetuNER - hazard dataset generator (landslides, susceptibility, disruptions).

Runs AFTER generate.py. Reads the districts/segments it produced and emits three
new, cross-referenced datasets:

  1. landslide_inventory   - GSI-style historical landslide events (2015-2024).
                             Annual totals are calibrated to the published NER
                             trend: 276 -> 395 -> 523 -> 712 -> 928 (~236% rise).
  2. susceptibility_zones  - per-segment NLSM-style susceptibility classification.
  3. disruption_events     - road closures with duration, impact and restoration.
                             Gives a REGRESSION target (duration_hours) alongside
                             the existing classification target.
"""
import json, csv, os, math, random
from datetime import date, timedelta, datetime

random.seed(2026)
OUT = os.path.dirname(os.path.abspath(__file__))
F = lambda p: os.path.join(OUT, p)

districts = [f["properties"] | {"lon": f["geometry"]["coordinates"][0],
                                "lat": f["geometry"]["coordinates"][1]}
             for f in json.load(open(F("frontend/districts.geojson"), encoding="utf-8"))["features"]]
segments = [f["properties"] | {"geometry": f["geometry"]["coordinates"]}
            for f in json.load(open(F("frontend/road_segments.geojson"), encoding="utf-8"))["features"]]

DIST_BY_ID = {d["district_id"]: d for d in districts}
SEG_BY_ID = {s["segment_id"]: s for s in segments}

# ==================================================================== 1. LANDSLIDES
# Published NER trend (compiled from IMD / NDMA / State Disaster Management
# reports, 2015-16 to 2023-24). Each bucket spans two fiscal years.
TREND = [
    ("2015-16", 2015, 276),
    ("2017-18", 2017, 395),
    ("2019-20", 2019, 523),
    ("2021-22", 2021, 712),
    ("2023-24", 2023, 928),
]

LS_TYPES = ["debris_flow", "rockfall", "translational_slide",
            "rotational_slide", "mudslide", "earth_flow"]
LS_TYPE_W = {"mountain": [34, 24, 18, 12, 8, 4],
             "hilly":    [26, 12, 22, 18, 14, 8],
             "plain":    [10,  2, 14, 20, 30, 24]}
TRIGGERS = ["rainfall", "anthropogenic_cut", "toe_erosion", "seismic"]
# NER landslide inventories are dominated by monsoon rainfall; road-cutting is
# the main secondary cause. Seismic triggering is real but rare year-to-year.
TRIGGER_W = [80, 11, 6, 3]
MATERIAL = {"debris_flow": "debris", "rockfall": "rock",
            "translational_slide": "rock", "rotational_slide": "earth",
            "mudslide": "earth", "earth_flow": "earth"}
LITHOLOGY = {
    "mountain": ["phyllite", "schist", "gneiss", "sandstone_shale", "quartzite"],
    "hilly":    ["sandstone_shale", "siltstone", "laterite", "phyllite"],
    "plain":    ["alluvium", "laterite", "siltstone"],
}
LAND_USE = ["forest", "road_cut", "agriculture", "settlement", "barren", "jhum_cultivation"]
AGENCIES = ["BRO (Border Roads Organisation)", "State PWD", "NHIDCL", "NDRF", "SDRF"]

# monsoon concentration - the vast majority of NER landslides are rain-triggered
MONTH_W = {1: 1, 2: 1, 3: 3, 4: 7, 5: 13, 6: 21,
           7: 22, 8: 16, 9: 10, 10: 4, 11: 1, 12: 1}


def pick_month():
    ms, ws = zip(*MONTH_W.items())
    return random.choices(ms, weights=ws)[0]


RAIN_F = {"ML": 2.30, "AR": 1.30, "AS": 1.15, "SK": 1.05, "MZ": 0.95,
          "NL": 0.85, "MN": 0.80, "TR": 0.90, "WB": 1.20}


def seg_weight(s):
    """Mountain, steep, poorly-surfaced, high-rainfall segments carry most events."""
    w = {"mountain": 100, "hilly": 45, "plain": 6}[s["terrain"]]
    w *= 1 + (s["avg_slope_deg"] / 45.0)
    w *= 1 + (s["elevation_m"] / 3000.0)
    w *= {"good": 0.8, "fair": 1.0, "poor": 1.35}[s["surface_quality"]]
    # rainfall is the dominant trigger, so wet states must dominate the inventory
    w *= RAIN_F[DIST_BY_ID[s["from_district_id"]]["state_code"]]
    return w


SEG_W = [seg_weight(s) for s in segments]


def gen_landslides():
    rows, n = [], 0
    for bucket, start_year, total in TREND:
        for _ in range(total):
            n += 1
            seg = random.choices(segments, weights=SEG_W)[0]
            d = DIST_BY_ID[seg["from_district_id"]]
            yr = start_year + random.randint(0, 1)
            mo = pick_month()
            day = random.randint(1, 28)
            ev = date(yr, mo, day)

            terr = seg["terrain"]
            ltype = random.choices(LS_TYPES, weights=LS_TYPE_W[terr])[0]
            trig = random.choices(TRIGGERS, weights=TRIGGER_W)[0]
            # slope at the failure point, not the segment average
            slope = round(min(72, max(8, seg["avg_slope_deg"] + random.uniform(-4, 16))), 1)

            # volume is heavy-tailed: many small failures, rare huge ones
            vol = int(math.exp(random.gauss(7.4, 1.6)))
            vol = max(25, min(vol, 900_000))
            runout = int(min(2500, max(5, vol ** 0.42 * random.uniform(0.8, 2.6))))

            # rain-triggered events carry high antecedent rainfall by definition
            if trig == "rainfall":
                r72 = round(random.uniform(120, 620) * (1.5 if d["state_code"] == "ML" else 1.0), 1)
            else:
                r72 = round(random.uniform(0, 140), 1)

            big = vol > 25_000
            fatalities = 0
            if random.random() < (0.16 if big else 0.05):
                fatalities = random.choices([1, 2, 3, 5, 9, 18],
                                            weights=[42, 24, 16, 10, 6, 2])[0]
            injuries = fatalities * random.randint(0, 3) + (random.randint(0, 4) if big else 0)
            houses = random.randint(0, 40) if big else random.randint(0, 6)

            road_blocked = random.random() < (0.88 if big else 0.55)
            if road_blocked:
                # Clearance time is driven by how much material must be moved,
                # how reachable the site is, and who responds - not by chance.
                # Base: ~1 hour per 900 m3 of debris.
                hrs = (vol / 900.0)
                hrs *= {"rock": 1.9, "debris": 1.0, "earth": 0.8}[MATERIAL[ltype]]
                hrs *= {"mountain": 1.6, "hilly": 1.15, "plain": 0.85}[terr]
                # national corridors get BRO/NHIDCL machinery fastest
                hrs *= 0.55 if seg["importance"] == "national" else 1.35
                hrs *= {1: 1.5, 2: 1.15, 4: 0.85}.get(seg["lanes"], 1.0)
                # clearing during peak monsoon is far slower (re-slides, no access)
                hrs *= 1.7 if mo in (6, 7, 8) else 1.25 if mo in (5, 9) else 1.0
                if fatalities > 0:      # search-and-rescue precedes clearance
                    hrs *= 1.6
                hrs *= math.exp(random.gauss(0, 0.45))   # genuine operational variance
                hrs = round(min(max(hrs, 1.0), 1440.0), 1)
            else:
                hrs = 0.0

            sev = ("catastrophic" if (fatalities >= 5 or vol > 200_000) else
                   "major" if (fatalities >= 1 or vol > 25_000 or hrs > 72) else
                   "moderate" if (vol > 2_000 or hrs > 6) else "minor")

            a, b = seg["geometry"][0], seg["geometry"][-1]
            t = random.uniform(0.08, 0.92)
            lon = round(a[0] + (b[0] - a[0]) * t + random.uniform(-0.01, 0.01), 5)
            lat = round(a[1] + (b[1] - a[1]) * t + random.uniform(-0.01, 0.01), 5)

            rows.append({
                "landslide_id": f"LS-{n:05d}",
                "event_date": ev.isoformat(),
                "fiscal_period": bucket,
                "state_code": d["state_code"],
                "district_id": d["district_id"],
                "district_name": d["name"],
                "segment_id": seg["segment_id"],
                "highway_code": seg["highway_code"],
                "latitude": lat,
                "longitude": lon,
                "landslide_type": ltype,
                "trigger": trig,
                "material": MATERIAL[ltype],
                "lithology": random.choice(LITHOLOGY[terr]),
                "land_use": random.choice(LAND_USE),
                "volume_m3": vol,
                "runout_distance_m": runout,
                "slope_angle_deg": slope,
                "elevation_m": seg["elevation_m"],
                "rainfall_72h_mm": r72,
                "fatalities": fatalities,
                "injuries": injuries,
                "houses_damaged": houses,
                "road_blocked": road_blocked,
                "blockage_duration_hours": hrs,
                "severity": sev,
                "source": random.choice(["GSI-NLSM", "GSI-NLSM", "SDMA", "NDMA", "PWD-field"]),
            })
    return rows


LANDSLIDES = gen_landslides()

# ============================================================ 2. SUSCEPTIBILITY
# NLSM-style zonation. Weighted-overlay of the standard causative factors.
def susceptibility():
    rows = []
    for s in segments:
        d = DIST_BY_ID[s["from_district_id"]]
        hist = [l for l in LANDSLIDES if l["segment_id"] == s["segment_id"]]

        slope_f = min(1.0, s["avg_slope_deg"] / 45.0)
        relief_f = min(1.0, s["elevation_m"] / 3000.0)
        lith_f = {"weathered_rock": 0.85, "lateritic": 0.55, "alluvial": 0.2}[s["soil_type"]]
        drain_f = round(min(1.0, 1.4 / max(0.4, s["dist_to_river_km"])), 3)
        road_f = {"poor": 0.9, "fair": 0.55, "good": 0.25}[s["surface_quality"]]
        rain_f = {"ML": 1.0, "AR": 0.85, "AS": 0.62, "SK": 0.72, "MZ": 0.60,
                  "NL": 0.55, "MN": 0.50, "TR": 0.45, "WB": 0.60}[d["state_code"]]
        density = round(len(hist) / max(1.0, s["length_km"]), 4)
        dens_f = min(1.0, density / 1.5)

        lsi = round(
            slope_f * 0.26 + relief_f * 0.12 + lith_f * 0.16 +
            drain_f * 0.08 + road_f * 0.12 + rain_f * 0.16 + dens_f * 0.10, 4)

        cls = ("very_high" if lsi >= 0.70 else "high" if lsi >= 0.55 else
               "moderate" if lsi >= 0.38 else "low" if lsi >= 0.22 else "very_low")

        rows.append({
            "zone_id": f"SZ-{s['segment_id'].split('-')[1]}",
            "segment_id": s["segment_id"],
            "district_id": s["from_district_id"],
            "highway_code": s["highway_code"],
            "susceptibility_class": cls,
            "lsi_score": lsi,
            "slope_factor": round(slope_f, 3),
            "relief_factor": round(relief_f, 3),
            "lithology_factor": lith_f,
            "drainage_factor": drain_f,
            "road_cut_factor": road_f,
            "rainfall_factor": rain_f,
            "historic_density_per_km": density,
            "historic_event_count": len(hist),
            "assessment_method": "weighted_overlay_NLSM",
            "assessed_on": "2026-06-30",
        })
    return rows


SUSCEPTIBILITY = susceptibility()
SUSC_BY_SEG = {z["segment_id"]: z for z in SUSCEPTIBILITY}

# ============================================================== 3. DISRUPTIONS
CAUSES = ["landslide", "flood", "bridge_damage", "road_subsidence",
          "fallen_tree", "accident_blockage", "protest_blockade", "maintenance"]
CARGO = ["medicines", "food_grains", "fuel", "lpg_cylinders",
         "construction_material", "agri_produce", "relief_supplies", "vaccines"]


def alternate_for(seg):
    """Any other segment sharing a junction can serve as a detour."""
    alts = [s for s in segments
            if s["segment_id"] != seg["segment_id"] and
            (s["from_name"] in (seg["from_name"], seg["to_name"]) or
             s["to_name"] in (seg["from_name"], seg["to_name"]))]
    return random.choice(alts) if alts else None


def gen_disruptions():
    rows, n = [], 0
    # every road-blocking landslide produces a disruption record
    for ls in LANDSLIDES:
        if not ls["road_blocked"]:
            continue
        n += 1
        seg = SEG_BY_ID[ls["segment_id"]]
        hrs = ls["blockage_duration_hours"]
        start = datetime.fromisoformat(ls["event_date"]).replace(
            hour=random.randint(0, 23), minute=random.choice([0, 15, 30, 45]))
        end = start + timedelta(hours=hrs)
        full = hrs > 12 or ls["severity"] in ("major", "catastrophic")
        alt = alternate_for(seg)
        stranded = int(max(0, random.gauss(70 if full else 20, 45)))
        stranded = min(stranded, 900)
        tonnes = round(stranded * random.uniform(2.5, 9.0), 1)
        ess = random.random() < 0.42
        cost = int(hrs * random.uniform(9_000, 65_000) *
                   (2.2 if seg["importance"] == "national" else 1.0))
        loss = int(tonnes * random.uniform(700, 4_200) + stranded * random.uniform(900, 5_000))

        rows.append({
            "disruption_id": f"DSR-{n:05d}",
            "segment_id": seg["segment_id"],
            "district_id": ls["district_id"],
            "state_code": ls["state_code"],
            "highway_code": seg["highway_code"],
            "cause": "landslide",
            "linked_landslide_id": ls["landslide_id"],
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration_hours": hrs,
            "closure_type": "full" if full else "partial",
            "severity": ls["severity"],
            "vehicles_stranded": stranded,
            "cargo_tonnes_affected": tonnes,
            "essential_cargo_affected": ess,
            "cargo_type": random.choice(CARGO),
            "alternate_route_available": alt is not None,
            "alternate_segment_id": alt["segment_id"] if alt else None,
            "detour_extra_km": round(alt["length_km"] * random.uniform(1.1, 2.6), 1) if alt else None,
            "restoration_agency": random.choice(AGENCIES),
            "restoration_cost_inr": cost,
            "estimated_economic_loss_inr": loss,
            "rainfall_72h_mm": ls["rainfall_72h_mm"],
            "susceptibility_class": SUSC_BY_SEG[seg["segment_id"]]["susceptibility_class"],
            "fiscal_period": ls["fiscal_period"],
        })

    # non-landslide disruptions: floods, bridges, blockades, maintenance
    extra = int(len(rows) * 0.42)
    for _ in range(extra):
        n += 1
        seg = random.choice(segments)
        d = DIST_BY_ID[seg["from_district_id"]]
        cause = random.choices(
            [c for c in CAUSES if c != "landslide"],
            weights=[26, 12, 10, 14, 12, 14, 12])[0]
        mo = random.choice([11, 12, 1, 2, 3]) if cause == "maintenance" else pick_month()
        # non-landslide durations also scale with corridor capacity and season
        resp = (0.6 if seg["importance"] == "national" else 1.3)
        season = 1.6 if mo in (6, 7, 8) else 1.0
        if cause == "flood":
            hrs = round(random.uniform(6, 260) * resp * season, 1)
            r72 = round(random.uniform(180, 700), 1)
        elif cause == "bridge_damage":
            hrs = round(random.uniform(60, 1400) * resp *
                        (1 + seg["bridge_count"] * 0.08), 1)
            r72 = round(random.uniform(40, 400), 1)
        elif cause == "road_subsidence":
            hrs = round(random.uniform(12, 400) * resp *
                        {"poor": 1.6, "fair": 1.1, "good": 0.7}[seg["surface_quality"]], 1)
            r72 = round(random.uniform(60, 400), 1)
        elif cause == "maintenance":
            hrs = round(random.uniform(4, 120) * resp, 1)
            r72 = round(random.uniform(0, 60), 1)
        else:   # fallen_tree, accident_blockage, protest_blockade
            hrs = round(random.uniform(1, 48) * resp, 1)
            r72 = round(random.uniform(0, 200), 1)
        hrs = round(min(max(hrs, 1.0), 2000.0), 1)

        bucket, sy, _ = random.choice(TREND)
        start = datetime(sy + random.randint(0, 1), mo, random.randint(1, 28),
                         random.randint(0, 23), random.choice([0, 15, 30, 45]))
        full = hrs > 12
        alt = alternate_for(seg)
        stranded = min(900, int(max(0, random.gauss(55 if full else 15, 40))))
        tonnes = round(stranded * random.uniform(2.5, 9.0), 1)
        sev = ("catastrophic" if hrs > 720 else "major" if hrs > 72
               else "moderate" if hrs > 6 else "minor")

        rows.append({
            "disruption_id": f"DSR-{n:05d}",
            "segment_id": seg["segment_id"],
            "district_id": seg["from_district_id"],
            "state_code": d["state_code"],
            "highway_code": seg["highway_code"],
            "cause": cause,
            "linked_landslide_id": None,
            "start_time": start.isoformat(),
            "end_time": (start + timedelta(hours=hrs)).isoformat(),
            "duration_hours": hrs,
            "closure_type": "full" if full else "partial",
            "severity": sev,
            "vehicles_stranded": stranded,
            "cargo_tonnes_affected": tonnes,
            "essential_cargo_affected": random.random() < 0.42,
            "cargo_type": random.choice(CARGO),
            "alternate_route_available": alt is not None,
            "alternate_segment_id": alt["segment_id"] if alt else None,
            "detour_extra_km": round(alt["length_km"] * random.uniform(1.1, 2.6), 1) if alt else None,
            "restoration_agency": random.choice(AGENCIES),
            "restoration_cost_inr": int(hrs * random.uniform(7_000, 50_000)),
            "estimated_economic_loss_inr": int(tonnes * random.uniform(700, 4_200)
                                               + stranded * random.uniform(900, 5_000)),
            "rainfall_72h_mm": r72,
            "susceptibility_class": SUSC_BY_SEG[seg["segment_id"]]["susceptibility_class"],
            "fiscal_period": bucket,
        })

    rows.sort(key=lambda r: r["start_time"])
    return rows


DISRUPTIONS = gen_disruptions()

# ================================================ 4. duration regression training set
def gen_duration_training():
    """Features knowable the MOMENT a closure is first reported -> duration_hours.

    Deliberately excludes closure_type and severity: both are derived from the
    duration itself in the source records, so including them would leak the
    target and inflate scores. Everything here is observable at report time.
    """
    rows = []
    for dr in DISRUPTIONS:
        seg = SEG_BY_ID[dr["segment_id"]]
        z = SUSC_BY_SEG[dr["segment_id"]]
        ls = next((l for l in LANDSLIDES if l["landslide_id"] == dr["linked_landslide_id"]), None)
        rows.append({
            "disruption_id": dr["disruption_id"],
            "segment_id": dr["segment_id"],
            "cause": dr["cause"],
            "rainfall_72h_mm": dr["rainfall_72h_mm"],
            "avg_slope_deg": seg["avg_slope_deg"],
            "elevation_m": seg["elevation_m"],
            "terrain": seg["terrain"],
            "soil_type": seg["soil_type"],
            "surface_quality": seg["surface_quality"],
            "lanes": seg["lanes"],
            "importance": seg["importance"],
            "bridge_count": seg["bridge_count"],
            "length_km": seg["length_km"],
            "susceptibility_class": z["susceptibility_class"],
            "lsi_score": z["lsi_score"],
            "historic_density_per_km": z["historic_density_per_km"],
            "landslide_volume_m3": ls["volume_m3"] if ls else 0,
            "runout_distance_m": ls["runout_distance_m"] if ls else 0,
            "material": ls["material"] if ls else "none",
            "alternate_route_available": dr["alternate_route_available"],
            "month": int(dr["start_time"][5:7]),
            "duration_hours": dr["duration_hours"],          # regression target
            "duration_bucket": ("under_6h" if dr["duration_hours"] < 6 else
                                "6_24h" if dr["duration_hours"] < 24 else
                                "1_3days" if dr["duration_hours"] < 72 else
                                "over_3days"),               # classification target
        })
    return rows


DURATION_ROWS = gen_duration_training()

# ==================================================================== write
def w_csv(rel, rows):
    p = F(rel)
    with open(p, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def w_json(rel, obj):
    with open(F(rel), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


w_csv("ml/landslide_inventory.csv", LANDSLIDES)
w_csv("ml/susceptibility_zones.csv", SUSCEPTIBILITY)
w_csv("ml/disruption_events.csv", DISRUPTIONS)
w_csv("ml/disruption_duration_training.csv", DURATION_ROWS)

# frontend: landslides as GeoJSON (recent 3 years keeps the map usable)
recent = [l for l in LANDSLIDES if l["event_date"] >= "2021-01-01"]
w_json("frontend/landslides.geojson", {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [l["longitude"], l["latitude"]]},
        "properties": {k: v for k, v in l.items() if k not in ("latitude", "longitude")},
    } for l in recent],
})

# frontend: susceptibility joined onto road geometry
w_json("frontend/susceptibility.geojson", {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": SEG_BY_ID[z["segment_id"]]["geometry"]},
        "properties": z | {
            "from_name": SEG_BY_ID[z["segment_id"]]["from_name"],
            "to_name": SEG_BY_ID[z["segment_id"]]["to_name"],
            "color": {"very_high": "#7d1a12", "high": "#c0392b", "moderate": "#e8a22a",
                      "low": "#5aa469", "very_low": "#2c8c5e"}[z["susceptibility_class"]],
        },
    } for z in SUSCEPTIBILITY],
})

w_json("frontend/disruptions.json", DISRUPTIONS[-400:])  # most recent 400 for the UI

# yearly trend rollup - this is what the infographic chart plots
trend = []
for bucket, sy, total in TREND:
    b = [l for l in LANDSLIDES if l["fiscal_period"] == bucket]
    dz = [d for d in DISRUPTIONS if d["fiscal_period"] == bucket]
    trend.append({
        "fiscal_period": bucket,
        "landslide_events": len(b),
        "fatalities": sum(x["fatalities"] for x in b),
        "road_blocking_events": sum(1 for x in b if x["road_blocked"]),
        "disruptions": len(dz),
        "total_closure_hours": round(sum(x["duration_hours"] for x in dz), 1),
        "economic_loss_inr": sum(x["estimated_economic_loss_inr"] for x in dz),
    })
w_json("frontend/hazard_trend.json", trend)

print(json.dumps({
    "landslide_events": len(LANDSLIDES),
    "susceptibility_zones": len(SUSCEPTIBILITY),
    "disruption_events": len(DISRUPTIONS),
    "duration_training_rows": len(DURATION_ROWS),
    "landslides_on_map": len(recent),
}, indent=2))
print("\nTrend check (must match 276/395/523/712/928):")
for t in trend:
    print(f"  {t['fiscal_period']}: {t['landslide_events']:4} events, "
          f"{t['road_blocking_events']:4} blocking, {t['fatalities']:4} fatalities, "
          f"{t['total_closure_hours']:>10,.0f} closure-hrs")
