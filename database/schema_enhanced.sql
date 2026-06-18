-- ============================================================
-- Astram Traffic Event Intelligence — Enhanced Schema (Member B)
-- Includes: PostGIS, prediction_log, risk_calendar_cache,
--           evaluation_metrics, and spatial indexes
-- ============================================================

-- 0. Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Drop existing tables for clean setup
DROP TABLE IF EXISTS evaluation_metrics CASCADE;
DROP TABLE IF EXISTS prediction_log CASCADE;
DROP TABLE IF EXISTS risk_calendar_cache CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS zones CASCADE;

-- 2. Zone boundary table with PostGIS geometry
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(50) UNIQUE NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- 3. Events table — full Astram CSV schema + spatial column
CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    endlatitude DOUBLE PRECISION,
    endlongitude DOUBLE PRECISION,
    address TEXT,
    end_address TEXT,
    event_cause VARCHAR(100) NOT NULL,
    requires_road_closure BOOLEAN NOT NULL DEFAULT FALSE,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    authenticated VARCHAR(20),
    modified_datetime TIMESTAMP WITH TIME ZONE,
    direction VARCHAR(100),
    description TEXT,
    veh_type VARCHAR(100),
    veh_no VARCHAR(100),
    corridor VARCHAR(150),
    priority VARCHAR(20),
    created_date TIMESTAMP WITH TIME ZONE,
    route_path TEXT,
    client_id INT,
    created_by_id VARCHAR(50),
    last_modified_by_id VARCHAR(50),
    assigned_to_police_id INT,
    police_station VARCHAR(150),
    resolved_at_address TEXT,
    resolved_at_latitude DOUBLE PRECISION,
    resolved_at_longitude DOUBLE PRECISION,
    closed_by_id VARCHAR(50),
    closed_datetime TIMESTAMP WITH TIME ZONE,
    resolved_by_id VARCHAR(50),
    resolved_datetime TIMESTAMP WITH TIME ZONE,
    gba_identifier VARCHAR(150),
    zone VARCHAR(50),
    junction VARCHAR(150),
    -- Derived feature columns (filled by ML pipeline)
    duration_minutes DOUBLE PRECISION,
    hour_of_day INT,
    day_of_week INT,
    is_weekend BOOLEAN,
    time_bucket VARCHAR(20),
    planned_flag BOOLEAN,
    lead_time_hours DOUBLE PRECISION,
    -- Spatial point for the event location
    geom GEOMETRY(Point, 4326)
);

-- 4. Prediction log — tracks predicted vs actual for post-event learning
CREATE TABLE prediction_log (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    predicted_priority VARCHAR(20),
    actual_priority VARCHAR(20),
    priority_correct BOOLEAN,
    predicted_duration DOUBLE PRECISION,
    actual_duration DOUBLE PRECISION,
    duration_error DOUBLE PRECISION,
    rolling_mae DOUBLE PRECISION,
    rolling_accuracy DOUBLE PRECISION
);

-- 5. Risk calendar cache — pre-aggregated corridor × hour × cause pivot
CREATE TABLE risk_calendar_cache (
    id SERIAL PRIMARY KEY,
    corridor VARCHAR(150),
    hour_of_day INT,
    event_cause VARCHAR(100),
    event_count INT DEFAULT 0,
    avg_duration_minutes DOUBLE PRECISION,
    high_priority_pct DOUBLE PRECISION,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Evaluation metrics — stores top-K hit rate and model performance
CREATE TABLE evaluation_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    model_name VARCHAR(50),
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Spatial indexes (GiST)
CREATE INDEX idx_zones_geom ON zones USING GIST(geom);
CREATE INDEX idx_events_geom ON events USING GIST(geom);

-- Regular indexes for frequent query patterns
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_event_cause ON events(event_cause);
CREATE INDEX idx_events_corridor ON events(corridor);
CREATE INDEX idx_events_zone ON events(zone);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_priority ON events(priority);
CREATE INDEX idx_events_hour ON events(hour_of_day);

-- Prediction log indexes
CREATE INDEX idx_prediction_log_event ON prediction_log(event_id);
CREATE INDEX idx_prediction_log_ts ON prediction_log(timestamp);

-- Risk calendar cache indexes
CREATE INDEX idx_risk_cal_corridor ON risk_calendar_cache(corridor);
CREATE INDEX idx_risk_cal_hour ON risk_calendar_cache(hour_of_day);
CREATE INDEX idx_risk_cal_cause ON risk_calendar_cache(event_cause);

-- Evaluation metrics
CREATE INDEX idx_eval_metric ON evaluation_metrics(metric_name);
