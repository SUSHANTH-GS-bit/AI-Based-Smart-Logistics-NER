-- =====================================================================
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
