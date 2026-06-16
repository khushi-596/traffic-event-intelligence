-- Drop tables if they exist
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS zones CASCADE;

-- Create zones table to store Bengaluru zone boundaries
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(50) UNIQUE NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- Create events table to store traffic incident records
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
    requires_road_closure BOOLEAN NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
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
    
    -- Spatial point representing the event location
    geom GEOMETRY(Point, 4326)
);

-- Create spatial indexes to speed up spatial queries (e.g., ST_Within, ST_Distance)
CREATE INDEX idx_zones_geom ON zones USING GIST(geom);
CREATE INDEX idx_events_geom ON events USING GIST(geom);

-- Regular indexes for frequent queries
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_event_cause ON events(event_cause);
CREATE INDEX idx_events_corridor ON events(corridor);
CREATE INDEX idx_events_zone ON events(zone);
