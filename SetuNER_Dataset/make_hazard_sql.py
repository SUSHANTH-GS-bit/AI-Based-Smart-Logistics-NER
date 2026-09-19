#!/usr/bin/env python3
"""Append landslide / susceptibility / disruption tables to schema.sql + seed.sql."""
import csv, os

OUT = os.path.dirname(os.path.abspath(__file__))
F = lambda p: os.path.join(OUT, p)


def C(p):
    with open(F(p), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def q(v):
    if v is None or v == "" or v == "None":
        return "NULL"
    s = str(v)
    if s in ("True", "False"):
        return "TRUE" if s == "True" else "FALSE"
    try:
        float(s)
        return s
    except ValueError:
        pass
    return "'" + s.replace("'", "''") + "'"


landslides = C("ml/landslide_inventory.csv")
zones = C("ml/susceptibility_zones.csv")
disruptions = C("ml/disruption_events.csv")

SCHEMA = """

-- =====================================================================
-- HAZARD MODULE - landslide inventory, susceptibility zonation, disruptions
-- =====================================================================
DROP TABLE IF EXISTS disruption_events, susceptibility_zones, landslides CASCADE;

-- ------------------------------------------------------------ landslides
-- GSI/NLSM-style historical inventory. Annual totals are calibrated to the
-- published NER trend (276 events in 2015-16 rising to 928 in 2023-24).
CREATE TABLE landslides (
    landslide_id            VARCHAR(12) PRIMARY KEY,
    event_date              DATE        NOT NULL,
    fiscal_period           VARCHAR(10) NOT NULL,
    state_code              CHAR(2)     NOT NULL REFERENCES states(code),
    district_id             VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    segment_id              VARCHAR(12) REFERENCES road_segments(segment_id),
    highway_code            VARCHAR(16),
    location                GEOGRAPHY(POINT, 4326) NOT NULL,
    landslide_type          VARCHAR(24) NOT NULL CHECK (landslide_type IN
                            ('debris_flow','rockfall','translational_slide',
                             'rotational_slide','mudslide','earth_flow')),
    trigger                 VARCHAR(20) NOT NULL CHECK (trigger IN
                            ('rainfall','anthropogenic_cut','toe_erosion','seismic')),
    material                VARCHAR(10) NOT NULL CHECK (material IN ('rock','debris','earth')),
    lithology               VARCHAR(32),
    land_use                VARCHAR(24),
    volume_m3               INTEGER     NOT NULL CHECK (volume_m3 > 0),
    runout_distance_m       INTEGER     NOT NULL CHECK (runout_distance_m >= 0),
    slope_angle_deg         NUMERIC(5,1) NOT NULL CHECK (slope_angle_deg BETWEEN 0 AND 90),
    elevation_m             INTEGER     NOT NULL,
    rainfall_72h_mm         NUMERIC(7,1) NOT NULL CHECK (rainfall_72h_mm >= 0),
    fatalities              SMALLINT    NOT NULL DEFAULT 0 CHECK (fatalities >= 0),
    injuries                SMALLINT    NOT NULL DEFAULT 0 CHECK (injuries >= 0),
    houses_damaged          SMALLINT    NOT NULL DEFAULT 0,
    road_blocked            BOOLEAN     NOT NULL,
    blockage_duration_hours NUMERIC(8,1) NOT NULL CHECK (blockage_duration_hours >= 0),
    severity                VARCHAR(14) NOT NULL CHECK (severity IN
                            ('minor','moderate','major','catastrophic')),
    source                  VARCHAR(20) NOT NULL
);
CREATE INDEX idx_ls_location ON landslides USING GIST(location);
CREATE INDEX idx_ls_segment  ON landslides(segment_id);
CREATE INDEX idx_ls_date     ON landslides(event_date DESC);
CREATE INDEX idx_ls_severity ON landslides(severity, road_blocked);

-- ------------------------------------------------- susceptibility_zones
-- Weighted-overlay zonation per road segment (NLSM methodology).
CREATE TABLE susceptibility_zones (
    zone_id                 VARCHAR(12) PRIMARY KEY,
    segment_id              VARCHAR(12) NOT NULL UNIQUE REFERENCES road_segments(segment_id),
    district_id             VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    highway_code            VARCHAR(16),
    susceptibility_class    VARCHAR(12) NOT NULL CHECK (susceptibility_class IN
                            ('very_low','low','moderate','high','very_high')),
    lsi_score               NUMERIC(6,4) NOT NULL CHECK (lsi_score BETWEEN 0 AND 1),
    slope_factor            NUMERIC(5,3) NOT NULL,
    relief_factor           NUMERIC(5,3) NOT NULL,
    lithology_factor        NUMERIC(5,3) NOT NULL,
    drainage_factor         NUMERIC(5,3) NOT NULL,
    road_cut_factor         NUMERIC(5,3) NOT NULL,
    rainfall_factor         NUMERIC(5,3) NOT NULL,
    historic_density_per_km NUMERIC(8,4) NOT NULL,
    historic_event_count    INTEGER     NOT NULL,
    assessment_method       VARCHAR(32) NOT NULL,
    assessed_on             DATE        NOT NULL
);
CREATE INDEX idx_sz_class ON susceptibility_zones(susceptibility_class);

-- ----------------------------------------------------- disruption_events
-- Operational consequence of a hazard: how long the road was actually shut,
-- what it stranded, and what it cost. duration_hours is the regression target.
CREATE TABLE disruption_events (
    disruption_id               VARCHAR(12) PRIMARY KEY,
    segment_id                  VARCHAR(12) NOT NULL REFERENCES road_segments(segment_id),
    district_id                 VARCHAR(12) NOT NULL REFERENCES districts(district_id),
    state_code                  CHAR(2)     NOT NULL REFERENCES states(code),
    highway_code                VARCHAR(16),
    cause                       VARCHAR(24) NOT NULL CHECK (cause IN
                                ('landslide','flood','bridge_damage','road_subsidence',
                                 'fallen_tree','accident_blockage','protest_blockade','maintenance')),
    linked_landslide_id         VARCHAR(12) REFERENCES landslides(landslide_id),
    start_time                  TIMESTAMP   NOT NULL,
    end_time                    TIMESTAMP   NOT NULL,
    duration_hours              NUMERIC(8,1) NOT NULL CHECK (duration_hours > 0),
    closure_type                VARCHAR(8)  NOT NULL CHECK (closure_type IN ('full','partial')),
    severity                    VARCHAR(14) NOT NULL,
    vehicles_stranded           INTEGER     NOT NULL DEFAULT 0 CHECK (vehicles_stranded >= 0),
    cargo_tonnes_affected       NUMERIC(10,1) NOT NULL DEFAULT 0,
    essential_cargo_affected    BOOLEAN     NOT NULL DEFAULT FALSE,
    cargo_type                  VARCHAR(32),
    alternate_route_available   BOOLEAN     NOT NULL,
    alternate_segment_id        VARCHAR(12) REFERENCES road_segments(segment_id),
    detour_extra_km             NUMERIC(8,1),
    restoration_agency          VARCHAR(48),
    restoration_cost_inr        BIGINT      NOT NULL DEFAULT 0,
    estimated_economic_loss_inr BIGINT      NOT NULL DEFAULT 0,
    rainfall_72h_mm             NUMERIC(7,1),
    susceptibility_class        VARCHAR(12),
    fiscal_period               VARCHAR(10),
    CHECK (end_time > start_time)
);
CREATE INDEX idx_dsr_segment ON disruption_events(segment_id);
CREATE INDEX idx_dsr_start   ON disruption_events(start_time DESC);
CREATE INDEX idx_dsr_cause   ON disruption_events(cause, closure_type);

-- ========================== HAZARD VIEWS ============================
-- The rising-trend chart: landslide frequency and impact by period.
CREATE OR REPLACE VIEW v_hazard_trend AS
SELECT l.fiscal_period,
       COUNT(*)                                        AS landslide_events,
       COUNT(*) FILTER (WHERE l.road_blocked)          AS road_blocking_events,
       SUM(l.fatalities)                               AS fatalities,
       ROUND(AVG(l.volume_m3))                         AS avg_volume_m3,
       COUNT(DISTINCT d.disruption_id)                 AS disruptions,
       ROUND(SUM(d.duration_hours), 1)                 AS total_closure_hours,
       SUM(d.estimated_economic_loss_inr)              AS economic_loss_inr
FROM landslides l
LEFT JOIN disruption_events d ON d.linked_landslide_id = l.landslide_id
GROUP BY l.fiscal_period
ORDER BY l.fiscal_period;

-- Segments ranked by real historical burden - where to invest first.
CREATE OR REPLACE VIEW v_segment_hazard_profile AS
SELECT s.segment_id, s.highway_code, s.from_name, s.to_name, s.terrain,
       z.susceptibility_class, z.lsi_score,
       COUNT(DISTINCT l.landslide_id)                            AS landslide_count,
       COALESCE(SUM(l.fatalities), 0)                            AS total_fatalities,
       COUNT(DISTINCT d.disruption_id)                           AS disruption_count,
       ROUND(COALESCE(SUM(d.duration_hours), 0), 1)              AS total_closure_hours,
       ROUND(COALESCE(AVG(d.duration_hours), 0), 1)              AS avg_closure_hours,
       COALESCE(SUM(d.vehicles_stranded), 0)                     AS vehicles_stranded,
       COALESCE(SUM(d.estimated_economic_loss_inr), 0)           AS economic_loss_inr
FROM road_segments s
LEFT JOIN susceptibility_zones z ON z.segment_id = s.segment_id
LEFT JOIN landslides l           ON l.segment_id = s.segment_id
LEFT JOIN disruption_events d    ON d.segment_id = s.segment_id
GROUP BY s.segment_id, s.highway_code, s.from_name, s.to_name, s.terrain,
         z.susceptibility_class, z.lsi_score
ORDER BY total_closure_hours DESC;
"""

with open(F("backend/schema.sql"), "a", encoding="utf-8") as f:
    f.write(SCHEMA)

lines = ["", "-- ============ HAZARD MODULE SEED ============", "BEGIN;", ""]

lines.append("-- landslides")
for l in landslides:
    lines.append(
        "INSERT INTO landslides (landslide_id,event_date,fiscal_period,state_code,district_id,"
        "segment_id,highway_code,location,landslide_type,trigger,material,lithology,land_use,"
        "volume_m3,runout_distance_m,slope_angle_deg,elevation_m,rainfall_72h_mm,fatalities,"
        "injuries,houses_damaged,road_blocked,blockage_duration_hours,severity,source) VALUES ("
        f"{q(l['landslide_id'])},{q(l['event_date'])},{q(l['fiscal_period'])},{q(l['state_code'])},"
        f"{q(l['district_id'])},{q(l['segment_id'])},{q(l['highway_code'])},"
        f"ST_GeogFromText('SRID=4326;POINT({l['longitude']} {l['latitude']})'),"
        f"{q(l['landslide_type'])},{q(l['trigger'])},{q(l['material'])},{q(l['lithology'])},"
        f"{q(l['land_use'])},{q(l['volume_m3'])},{q(l['runout_distance_m'])},"
        f"{q(l['slope_angle_deg'])},{q(l['elevation_m'])},{q(l['rainfall_72h_mm'])},"
        f"{q(l['fatalities'])},{q(l['injuries'])},{q(l['houses_damaged'])},"
        f"{q(l['road_blocked'])},{q(l['blockage_duration_hours'])},{q(l['severity'])},"
        f"{q(l['source'])});")

lines += ["", "-- susceptibility_zones"]
for z in zones:
    lines.append(
        "INSERT INTO susceptibility_zones (zone_id,segment_id,district_id,highway_code,"
        "susceptibility_class,lsi_score,slope_factor,relief_factor,lithology_factor,"
        "drainage_factor,road_cut_factor,rainfall_factor,historic_density_per_km,"
        f"historic_event_count,assessment_method,assessed_on) VALUES ({q(z['zone_id'])},"
        f"{q(z['segment_id'])},{q(z['district_id'])},{q(z['highway_code'])},"
        f"{q(z['susceptibility_class'])},{q(z['lsi_score'])},{q(z['slope_factor'])},"
        f"{q(z['relief_factor'])},{q(z['lithology_factor'])},{q(z['drainage_factor'])},"
        f"{q(z['road_cut_factor'])},{q(z['rainfall_factor'])},{q(z['historic_density_per_km'])},"
        f"{q(z['historic_event_count'])},{q(z['assessment_method'])},{q(z['assessed_on'])});")

lines += ["", "-- disruption_events"]
for d in disruptions:
    lines.append(
        "INSERT INTO disruption_events (disruption_id,segment_id,district_id,state_code,"
        "highway_code,cause,linked_landslide_id,start_time,end_time,duration_hours,closure_type,"
        "severity,vehicles_stranded,cargo_tonnes_affected,essential_cargo_affected,cargo_type,"
        "alternate_route_available,alternate_segment_id,detour_extra_km,restoration_agency,"
        "restoration_cost_inr,estimated_economic_loss_inr,rainfall_72h_mm,susceptibility_class,"
        f"fiscal_period) VALUES ({q(d['disruption_id'])},{q(d['segment_id'])},{q(d['district_id'])},"
        f"{q(d['state_code'])},{q(d['highway_code'])},{q(d['cause'])},{q(d['linked_landslide_id'])},"
        f"{q(d['start_time'])},{q(d['end_time'])},{q(d['duration_hours'])},{q(d['closure_type'])},"
        f"{q(d['severity'])},{q(d['vehicles_stranded'])},{q(d['cargo_tonnes_affected'])},"
        f"{q(d['essential_cargo_affected'])},{q(d['cargo_type'])},"
        f"{q(d['alternate_route_available'])},{q(d['alternate_segment_id'])},"
        f"{q(d['detour_extra_km'])},{q(d['restoration_agency'])},{q(d['restoration_cost_inr'])},"
        f"{q(d['estimated_economic_loss_inr'])},{q(d['rainfall_72h_mm'])},"
        f"{q(d['susceptibility_class'])},{q(d['fiscal_period'])});")

lines += ["", "COMMIT;", ""]

with open(F("backend/seed.sql"), "a", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"appended hazard module: {len(landslides)} landslides, "
      f"{len(zones)} zones, {len(disruptions)} disruptions")
