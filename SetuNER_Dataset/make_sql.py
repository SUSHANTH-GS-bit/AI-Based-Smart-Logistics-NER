#!/usr/bin/env python3
"""Emit schema.sql + seed.sql (PostgreSQL 14+ / PostGIS 3) from the generated JSON/CSV."""
import json, csv, os

OUT = os.path.dirname(os.path.abspath(__file__))
F = lambda p: os.path.join(OUT, p)


def L(p):
    with open(F(p), encoding="utf-8") as f:
        return json.load(f)


def C(p):
    with open(F(p), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def q(v):
    """SQL-quote a python value."""
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(lst):
    return "ARRAY[" + ",".join(q(x) for x in lst) + "]::text[]"


states = L("frontend/states.json")
districts = [f["properties"] | {"lon": f["geometry"]["coordinates"][0],
                                "lat": f["geometry"]["coordinates"][1]}
             for f in L("frontend/districts.geojson")["features"]]
roads = L("frontend/road_segments.geojson")["features"]
incidents = [f["properties"] | {"lon": f["geometry"]["coordinates"][0],
                                "lat": f["geometry"]["coordinates"][1]}
             for f in L("frontend/incidents.geojson")["features"]]
vehicles = L("frontend/vehicles.json")
gps = L("frontend/gps_tracks.json")
alerts = L("frontend/alerts.json")
status = L("frontend/route_status.json")
weather = C("ml/weather_history.csv")

# ------------------------------------------------------------------ schema
SCHEMA = """-- =====================================================================
-- SetuNER (SIH26002) - PostgreSQL 14+ / PostGIS 3 schema
-- Run:  psql -U postgres -d setuner -f schema.sql
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS gps_pings, alerts, incidents, vehicles,
    segment_status, weather_observations, road_segments,
    districts, states, users CASCADE;

-- ---------------------------------------------------------------- states
CREATE TABLE states (
    code        CHAR(2)      PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL UNIQUE,
    capital     VARCHAR(80)  NOT NULL
);

-- ------------------------------------------------------------- districts
CREATE TABLE districts (
    district_id   VARCHAR(12) PRIMARY KEY,
    name          VARCHAR(80) NOT NULL,
    state_code    CHAR(2)     NOT NULL REFERENCES states(code),
    elevation_m   INTEGER     NOT NULL CHECK (elevation_m >= 0),
    terrain       VARCHAR(12) NOT NULL CHECK (terrain IN ('plain','hilly','mountain')),
    population    INTEGER     NOT NULL CHECK (population > 0),
    centroid      GEOGRAPHY(POINT, 4326) NOT NULL
);
CREATE INDEX idx_districts_state    ON districts(state_code);
CREATE INDEX idx_districts_centroid ON districts USING GIST(centroid);

-- ---------------------------------------------------------- road_segments
CREATE TABLE road_segments (
    segment_id        VARCHAR(12) PRIMARY KEY,
    highway_code      VARCHAR(16) NOT NULL,
    corridor_name     VARCHAR(160) NOT NULL,
    from_name         VARCHAR(80) NOT NULL,
    to_name           VARCHAR(80) NOT NULL,
    from_district_id  VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    to_district_id    VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    importance        VARCHAR(12) NOT NULL CHECK (importance IN ('national','state')),
    lanes             SMALLINT    NOT NULL CHECK (lanes BETWEEN 1 AND 8),
    length_km         NUMERIC(7,2) NOT NULL CHECK (length_km > 0),
    terrain           VARCHAR(12) NOT NULL CHECK (terrain IN ('plain','hilly','mountain')),
    avg_slope_deg     NUMERIC(5,2) NOT NULL CHECK (avg_slope_deg >= 0),
    elevation_m       INTEGER     NOT NULL,
    soil_type         VARCHAR(24) NOT NULL,
    bridge_count      SMALLINT    NOT NULL DEFAULT 0,
    surface_quality   VARCHAR(8)  NOT NULL CHECK (surface_quality IN ('good','fair','poor')),
    dist_to_river_km  NUMERIC(6,2) NOT NULL,
    geom              GEOGRAPHY(LINESTRING, 4326) NOT NULL
);
CREATE INDEX idx_segments_geom     ON road_segments USING GIST(geom);
CREATE INDEX idx_segments_from     ON road_segments(from_district_id);
CREATE INDEX idx_segments_to       ON road_segments(to_district_id);
CREATE INDEX idx_segments_highway  ON road_segments(highway_code);

-- --------------------------------------------------- weather_observations
CREATE TABLE weather_observations (
    id             BIGSERIAL PRIMARY KEY,
    district_id    VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    obs_date       DATE        NOT NULL,
    rainfall_mm    NUMERIC(6,1) NOT NULL CHECK (rainfall_mm >= 0),
    temp_max_c     NUMERIC(4,1) NOT NULL,
    temp_min_c     NUMERIC(4,1) NOT NULL,
    humidity_pct   SMALLINT     NOT NULL CHECK (humidity_pct BETWEEN 0 AND 100),
    wind_kmph      NUMERIC(5,1) NOT NULL CHECK (wind_kmph >= 0),
    source         VARCHAR(32)  NOT NULL DEFAULT 'IMD',
    UNIQUE (district_id, obs_date)
);
CREATE INDEX idx_weather_district_date ON weather_observations(district_id, obs_date DESC);

-- ------------------------------------------------------- segment_status
-- Current AI-predicted risk + operational status per segment.
CREATE TABLE segment_status (
    segment_id           VARCHAR(12) PRIMARY KEY REFERENCES road_segments(segment_id),
    as_of                DATE        NOT NULL,
    risk_score           NUMERIC(6,3) NOT NULL,
    risk_level           VARCHAR(8)  NOT NULL CHECK (risk_level IN ('low','medium','high')),
    status               VARCHAR(12) NOT NULL CHECK (status IN ('open','restricted','blocked')),
    estimated_delay_min  INTEGER     NOT NULL DEFAULT 0 CHECK (estimated_delay_min >= 0),
    rainfall_24h_mm      NUMERIC(6,1) NOT NULL,
    rainfall_72h_mm      NUMERIC(7,1) NOT NULL,
    confidence           NUMERIC(4,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_risk ON segment_status(risk_level, status);

-- ----------------------------------------------------------------- users
CREATE TABLE users (
    user_id     VARCHAR(12) PRIMARY KEY,
    full_name   VARCHAR(80) NOT NULL,
    role        VARCHAR(48) NOT NULL,
    state_name  VARCHAR(48) NOT NULL,
    phone       VARCHAR(20),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------- incidents
CREATE TABLE incidents (
    incident_id      VARCHAR(12) PRIMARY KEY,
    segment_id       VARCHAR(12) NOT NULL REFERENCES road_segments(segment_id),
    district_id      VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    incident_type    VARCHAR(20) NOT NULL CHECK (incident_type IN
                      ('landslide','flood','road_damage','bridge_damage',
                       'tree_fall','congestion','accident')),
    severity         VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    location         GEOGRAPHY(POINT, 4326) NOT NULL,
    reported_at      TIMESTAMPTZ NOT NULL,
    reported_by_id   VARCHAR(12) REFERENCES users(user_id),
    description      TEXT,
    photo_url        VARCHAR(200),
    status           VARCHAR(12) NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','in_progress','resolved')),
    synced_offline   BOOLEAN NOT NULL DEFAULT FALSE,
    verified         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_incidents_segment  ON incidents(segment_id);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_status   ON incidents(status, reported_at DESC);

-- -------------------------------------------------------------- vehicles
CREATE TABLE vehicles (
    vehicle_id              VARCHAR(12) PRIMARY KEY,
    registration_no         VARCHAR(24) NOT NULL UNIQUE,
    vehicle_type            VARCHAR(16) NOT NULL,
    operator                VARCHAR(80) NOT NULL,
    cargo_type              VARCHAR(32) NOT NULL,
    capacity_tonnes         NUMERIC(5,1) NOT NULL CHECK (capacity_tonnes > 0),
    driver_name             VARCHAR(80) NOT NULL,
    driver_phone            VARCHAR(20),
    origin_district_id      VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    destination_district_id VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    current_segment_id      VARCHAR(12) REFERENCES road_segments(segment_id),
    status                  VARCHAR(12) NOT NULL
                            CHECK (status IN ('in_transit','delayed','halted','delivered'))
);
CREATE INDEX idx_vehicles_status  ON vehicles(status);
CREATE INDEX idx_vehicles_segment ON vehicles(current_segment_id);

-- ------------------------------------------------------------- gps_pings
CREATE TABLE gps_pings (
    ping_id      VARCHAR(16) PRIMARY KEY,
    vehicle_id   VARCHAR(12) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    segment_id   VARCHAR(12) REFERENCES road_segments(segment_id),
    location     GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmph   NUMERIC(5,1) NOT NULL CHECK (speed_kmph >= 0),
    heading_deg  SMALLINT     NOT NULL CHECK (heading_deg BETWEEN 0 AND 359),
    recorded_at  TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_gps_vehicle_time ON gps_pings(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_location     ON gps_pings USING GIST(location);

-- ---------------------------------------------------------------- alerts
CREATE TABLE alerts (
    alert_id      VARCHAR(12) PRIMARY KEY,
    segment_id    VARCHAR(12) NOT NULL REFERENCES road_segments(segment_id),
    district_id   VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    alert_type    VARCHAR(24) NOT NULL,
    severity      VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    issued_at     TIMESTAMPTZ NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    channels      TEXT[]      NOT NULL,
    languages     TEXT[]      NOT NULL,
    messages      JSONB       NOT NULL,
    acknowledged  BOOLEAN     NOT NULL DEFAULT FALSE,
    CHECK (expires_at > issued_at)
);
CREATE INDEX idx_alerts_issued   ON alerts(issued_at DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_messages ON alerts USING GIN(messages);

-- ============================== VIEWS ================================
-- District-level accessibility rollup used by the dashboard.
CREATE OR REPLACE VIEW v_district_status AS
SELECT d.district_id,
       d.name                           AS district_name,
       d.state_code,
       ST_Y(d.centroid::geometry)       AS latitude,
       ST_X(d.centroid::geometry)       AS longitude,
       d.terrain,
       d.population,
       COUNT(s.segment_id)                                          AS segments_total,
       COUNT(*) FILTER (WHERE ss.status = 'open')                   AS segments_open,
       COUNT(*) FILTER (WHERE ss.status = 'restricted')             AS segments_restricted,
       COUNT(*) FILTER (WHERE ss.status = 'blocked')                AS segments_blocked,
       ROUND(100.0 * COUNT(*) FILTER (WHERE ss.status='open')
             / NULLIF(COUNT(s.segment_id),0), 1)                    AS accessibility_pct,
       MAX(ss.risk_score)                                           AS worst_risk_score
FROM districts d
LEFT JOIN road_segments s
       ON s.from_district_id = d.district_id OR s.to_district_id = d.district_id
LEFT JOIN segment_status ss ON ss.segment_id = s.segment_id
GROUP BY d.district_id, d.name, d.state_code, d.centroid, d.terrain, d.population;

-- Latest known position of every vehicle.
CREATE OR REPLACE VIEW v_vehicle_latest AS
SELECT DISTINCT ON (v.vehicle_id)
       v.vehicle_id, v.registration_no, v.vehicle_type, v.cargo_type,
       v.operator, v.driver_name, v.status,
       g.latitude_calc AS latitude, g.longitude_calc AS longitude,
       g.speed_kmph, g.recorded_at, v.current_segment_id,
       ss.risk_level, ss.status AS segment_status
FROM vehicles v
LEFT JOIN (
    SELECT vehicle_id, segment_id, speed_kmph, recorded_at,
           ST_Y(location::geometry) AS latitude_calc,
           ST_X(location::geometry) AS longitude_calc
    FROM gps_pings
) g ON g.vehicle_id = v.vehicle_id
LEFT JOIN segment_status ss ON ss.segment_id = v.current_segment_id
ORDER BY v.vehicle_id, g.recorded_at DESC;

-- Rolling rainfall per district - the exact features the ML model consumes.
CREATE OR REPLACE VIEW v_rainfall_features AS
SELECT district_id, obs_date, rainfall_mm AS rainfall_24h_mm,
       ROUND(SUM(rainfall_mm) OVER w3, 1) AS rainfall_72h_mm,
       ROUND(SUM(rainfall_mm) OVER w7, 1) AS rainfall_7d_mm
FROM weather_observations
WINDOW w3 AS (PARTITION BY district_id ORDER BY obs_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
       w7 AS (PARTITION BY district_id ORDER BY obs_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW);
"""

with open(F("backend/schema.sql"), "w", encoding="utf-8") as f:
    f.write(SCHEMA)

# -------------------------------------------------------------------- seed
lines = ["-- SetuNER seed data. Run AFTER schema.sql:",
         "--   psql -U postgres -d setuner -f seed.sql",
         "BEGIN;", ""]

lines.append("-- states")
for s in states:
    lines.append(f"INSERT INTO states (code,name,capital) VALUES "
                 f"({q(s['code'])},{q(s['name'])},{q(s['capital'])});")

lines += ["", "-- districts"]
for d in districts:
    lines.append(
        "INSERT INTO districts (district_id,name,state_code,elevation_m,terrain,population,centroid) "
        f"VALUES ({q(d['district_id'])},{q(d['name'])},{q(d['state_code'])},{d['elevation_m']},"
        f"{q(d['terrain'])},{d['population']},"
        f"ST_GeogFromText('SRID=4326;POINT({d['lon']} {d['lat']})'));")

lines += ["", "-- road_segments"]
for f_ in roads:
    p = f_["properties"]
    coords = ", ".join(f"{c[0]} {c[1]}" for c in f_["geometry"]["coordinates"])
    lines.append(
        "INSERT INTO road_segments (segment_id,highway_code,corridor_name,from_name,to_name,"
        "from_district_id,to_district_id,importance,lanes,length_km,terrain,avg_slope_deg,"
        "elevation_m,soil_type,bridge_count,surface_quality,dist_to_river_km,geom) VALUES ("
        f"{q(p['segment_id'])},{q(p['highway_code'])},{q(p['corridor_name'])},{q(p['from_name'])},"
        f"{q(p['to_name'])},{q(p['from_district_id'])},{q(p['to_district_id'])},{q(p['importance'])},"
        f"{p['lanes']},{p['length_km']},{q(p['terrain'])},{p['avg_slope_deg']},{p['elevation_m']},"
        f"{q(p['soil_type'])},{p['bridge_count']},{q(p['surface_quality'])},{p['dist_to_river_km']},"
        f"ST_GeogFromText('SRID=4326;LINESTRING({coords})'));")

lines += ["", "-- users"]
seen_users = {}
for i in incidents:
    seen_users[i["reported_by_id"]] = (i["reported_by_name"], i["reporter_role"])
state_of = {"USR-001": "Assam", "USR-002": "Meghalaya", "USR-003": "Nagaland",
            "USR-004": "Mizoram", "USR-005": "Arunachal Pradesh", "USR-006": "Tripura",
            "USR-007": "Sikkim", "USR-008": "Manipur"}
for uid in sorted(seen_users):
    nm, role = seen_users[uid]
    lines.append(f"INSERT INTO users (user_id,full_name,role,state_name) VALUES "
                 f"({q(uid)},{q(nm)},{q(role)},{q(state_of.get(uid,'Assam'))});")

lines += ["", "-- weather_observations"]
for w in weather:
    lines.append(
        "INSERT INTO weather_observations (district_id,obs_date,rainfall_mm,temp_max_c,"
        "temp_min_c,humidity_pct,wind_kmph,source) VALUES ("
        f"{q(w['district_id'])},{q(w['obs_date'])},{w['rainfall_mm']},{w['temp_max_c']},"
        f"{w['temp_min_c']},{w['humidity_pct']},{w['wind_kmph']},{q(w['source'])});")

lines += ["", "-- segment_status"]
for s in status:
    lines.append(
        "INSERT INTO segment_status (segment_id,as_of,risk_score,risk_level,status,"
        "estimated_delay_min,rainfall_24h_mm,rainfall_72h_mm,confidence) VALUES ("
        f"{q(s['segment_id'])},{q(s['as_of'])},{s['risk_score']},{q(s['risk_level'])},"
        f"{q(s['status'])},{s['estimated_delay_min']},{s['rainfall_24h_mm']},"
        f"{s['rainfall_72h_mm']},{s['confidence']});")

lines += ["", "-- incidents"]
for i in incidents:
    lines.append(
        "INSERT INTO incidents (incident_id,segment_id,district_id,incident_type,severity,"
        "location,reported_at,reported_by_id,description,photo_url,status,synced_offline,verified) "
        f"VALUES ({q(i['incident_id'])},{q(i['segment_id'])},{q(i['district_id'])},"
        f"{q(i['incident_type'])},{q(i['severity'])},"
        f"ST_GeogFromText('SRID=4326;POINT({i['lon']} {i['lat']})'),{q(i['reported_at'])},"
        f"{q(i['reported_by_id'])},{q(i['description'])},{q(i['photo_url'])},{q(i['status'])},"
        f"{q(i['synced_offline'])},{q(i['verified'])});")

lines += ["", "-- vehicles"]
for v in vehicles:
    lines.append(
        "INSERT INTO vehicles (vehicle_id,registration_no,vehicle_type,operator,cargo_type,"
        "capacity_tonnes,driver_name,driver_phone,origin_district_id,destination_district_id,"
        f"current_segment_id,status) VALUES ({q(v['vehicle_id'])},{q(v['registration_no'])},"
        f"{q(v['vehicle_type'])},{q(v['operator'])},{q(v['cargo_type'])},{v['capacity_tonnes']},"
        f"{q(v['driver_name'])},{q(v['driver_phone'])},{q(v['origin_district_id'])},"
        f"{q(v['destination_district_id'])},{q(v['current_segment_id'])},{q(v['status'])});")

lines += ["", "-- gps_pings"]
for g in gps:
    lines.append(
        "INSERT INTO gps_pings (ping_id,vehicle_id,segment_id,location,speed_kmph,heading_deg,"
        f"recorded_at) VALUES ({q(g['ping_id'])},{q(g['vehicle_id'])},{q(g['segment_id'])},"
        f"ST_GeogFromText('SRID=4326;POINT({g['longitude']} {g['latitude']})'),"
        f"{g['speed_kmph']},{g['heading_deg']},{q(g['recorded_at'])});")

lines += ["", "-- alerts"]
for a in alerts:
    msgs = json.dumps(a["messages"], ensure_ascii=False).replace("'", "''")
    lines.append(
        "INSERT INTO alerts (alert_id,segment_id,district_id,alert_type,severity,issued_at,"
        f"expires_at,channels,languages,messages,acknowledged) VALUES ({q(a['alert_id'])},"
        f"{q(a['segment_id'])},{q(a['district_id'])},{q(a['alert_type'])},{q(a['severity'])},"
        f"{q(a['issued_at'])},{q(a['expires_at'])},{arr(a['channels'])},{arr(a['languages'])},"
        f"'{msgs}'::jsonb,{q(a['acknowledged'])});")

lines += ["", "COMMIT;", ""]

with open(F("backend/seed.sql"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("schema.sql + seed.sql written")
print("seed statements:", sum(1 for l in lines if l.startswith("INSERT")))
