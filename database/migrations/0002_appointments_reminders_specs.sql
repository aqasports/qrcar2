-- database/migrations/0002_appointments_reminders_specs.sql

-- 1. Add enhanced specifications and maintenance scheduling columns to vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel',
ADD COLUMN IF NOT EXISTS transmission VARCHAR(50) DEFAULT 'Manuelle',
ADD COLUMN IF NOT EXISTS engine_spec VARCHAR(100),
ADD COLUMN IF NOT EXISTS oil_type VARCHAR(50) DEFAULT '5W-30 ACEA C3',
ADD COLUMN IF NOT EXISTS tire_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS next_service_mileage INT,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS next_inspection_date DATE;

-- 2. Create Appointments (Rendez-Vous) Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(50) NOT NULL DEFAULT 'morning',
  current_mileage INT,
  notes TEXT,
  client_phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  garage_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Reminders (Rappels d'Entretien) Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('oil_change', 'inspection', 'timing_belt', 'brakes', 'tires', 'custom')),
  title VARCHAR(255) NOT NULL,
  due_date DATE,
  due_mileage INT,
  notification_channel VARCHAR(50) DEFAULT 'calendar',
  contact_target VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast vehicle lookup on appointments & reminders
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle ON appointments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON reminders(vehicle_id);
