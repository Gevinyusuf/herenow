-- Add category column to events table if not exists
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
