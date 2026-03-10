-- Migration 001: Workflow Redesign
-- Adds photos table, invoice-claim linking, warranty_db linking, financial tracking

-- Photos table (polymorphic: inspections, claims, invoices)
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('inspection', 'claim', 'invoice', 'roof')),
  entity_id TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_entity ON photos(entity_type, entity_id);

-- Link claims to invoices
ALTER TABLE claims ADD COLUMN IF NOT EXISTS invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL;

-- Link roof warranties to the master warranty_db
ALTER TABLE roof_warranties ADD COLUMN IF NOT EXISTS warranty_db_id TEXT REFERENCES warranty_db(id) ON DELETE SET NULL;

-- Maintenance plan flag
ALTER TABLE roof_warranties ADD COLUMN IF NOT EXISTS maintenance_plan BOOLEAN DEFAULT false;

-- Year installed (simpler than full DATE for wizard)
ALTER TABLE roofs ADD COLUMN IF NOT EXISTS year_installed INTEGER;

-- Financial tracking on warranties
ALTER TABLE roof_warranties ADD COLUMN IF NOT EXISTS repair_spend_last_year NUMERIC(12,2);
ALTER TABLE roof_warranties ADD COLUMN IF NOT EXISTS covered_amount NUMERIC(12,2);
