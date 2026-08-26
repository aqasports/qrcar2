-- Migration 0014: PVC Card Design Image Protocol & Factory Demand Transmission

ALTER TABLE card_designs
  ADD COLUMN IF NOT EXISTS front_image_url TEXT,
  ADD COLUMN IF NOT EXISTS back_image_url TEXT,
  ADD COLUMN IF NOT EXISTS front_image_position VARCHAR(50) DEFAULT 'header_logo',
  ADD COLUMN IF NOT EXISTS front_image_opacity NUMERIC(3, 2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS front_image_scale INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS back_image_position VARCHAR(50) DEFAULT 'background_watermark',
  ADD COLUMN IF NOT EXISTS back_image_opacity NUMERIC(3, 2) DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS back_image_scale INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS front_rendered_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS back_rendered_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS print_specs JSONB,
  ADD COLUMN IF NOT EXISTS demand_package JSONB,
  ADD COLUMN IF NOT EXISTS submission_notes TEXT,
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS requested_batch_quantity INTEGER DEFAULT 100;
