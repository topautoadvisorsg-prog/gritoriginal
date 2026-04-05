-- Migration: Promote fight_history location JSONB into flat queryable columns
-- The location JSONB column is retained as a raw snapshot for backward compatibility.

-- 1. Add flat location columns (idempotent via IF NOT EXISTS)
ALTER TABLE fight_history
  ADD COLUMN IF NOT EXISTS event_city    TEXT,
  ADD COLUMN IF NOT EXISTS event_state   TEXT,
  ADD COLUMN IF NOT EXISTS event_country TEXT,
  ADD COLUMN IF NOT EXISTS event_venue   TEXT;

-- 2. Backfill from existing location JSONB (idempotent — only updates NULL cells)
UPDATE fight_history
SET
  event_city    = COALESCE(event_city,    location->>'city'),
  event_state   = COALESCE(event_state,   location->>'state'),
  event_country = COALESCE(event_country, location->>'country'),
  event_venue   = COALESCE(event_venue,   location->>'venue')
WHERE location IS NOT NULL;

-- 3. Add indexes for filtering and analytics
CREATE INDEX IF NOT EXISTS fight_history_fighter_idx      ON fight_history (fighter_id);
CREATE INDEX IF NOT EXISTS fight_history_event_date_idx   ON fight_history (event_date);
CREATE INDEX IF NOT EXISTS fight_history_event_city_idx   ON fight_history (event_city);
CREATE INDEX IF NOT EXISTS fight_history_event_country_idx ON fight_history (event_country);
