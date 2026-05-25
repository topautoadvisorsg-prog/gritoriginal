-- Update events table to use simpler draft/ready status system
ALTER TABLE events 
  ALTER COLUMN status TYPE varchar(20),
  ALTER COLUMN status SET DEFAULT 'draft';

-- Convert existing statuses to new system
-- OPEN, LIVE → ready (active events)
-- CLOSED, ARCHIVED → ready (completed events)
UPDATE events 
SET status = 'ready' 
WHERE status IN ('OPEN', 'LIVE', 'CLOSED', 'ARCHIVED');

-- Add check constraint to ensure only valid statuses
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_status_check,
  ADD CONSTRAINT events_status_check CHECK (status IN ('draft', 'ready'));
