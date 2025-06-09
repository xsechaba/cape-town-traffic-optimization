-- Cape Town Traffic Optimization Database Initialization

-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Traffic data table
CREATE TABLE IF NOT EXISTS traffic_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    road_segment VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(5, 2),
    volume INTEGER,
    congestion_level VARCHAR(20),
    weather_condition VARCHAR(50)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('traffic_data', 'timestamp', if_not_exists => TRUE);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(100),
    start_location VARCHAR(100),
    end_location VARCHAR(100),
    total_distance DECIMAL(10, 2),
    estimated_time INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample Cape Town routes
INSERT INTO routes (route_name, start_location, end_location, total_distance, estimated_time) VALUES
('Airport to Waterfront', 'Cape Town International Airport', 'V&A Waterfront', 21.4, 1560),
('CBD to Southern Suburbs', 'Cape Town CBD', 'Constantia', 18.7, 1320),
('Northern Suburbs to City', 'Bellville', 'Cape Town CBD', 22.1, 1680)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traffic_data_timestamp ON traffic_data (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_data_road_segment ON traffic_data (road_segment);
CREATE INDEX IF NOT EXISTS idx_routes_start_end ON routes (start_location, end_location); 