-- Add category column to events_v1 table for Discover page filtering
ALTER TABLE events_v1 ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_events_v1_category ON events_v1(category);
