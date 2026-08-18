-- Migration 0009: Pluggable VIN Decoding Engine & Persistent Specs Cache

CREATE TABLE IF NOT EXISTS vin_cache (
  vin VARCHAR(17) PRIMARY KEY,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  trim VARCHAR(100),
  body_class VARCHAR(100),
  engine_cylinders VARCHAR(50),
  engine_displacement_l NUMERIC(5, 2),
  fuel_type VARCHAR(100),
  horse_power VARCHAR(50),
  transmission_style VARCHAR(100),
  plant_country VARCHAR(100),
  raw_data JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vin_cache_make_model ON vin_cache (make, model);
