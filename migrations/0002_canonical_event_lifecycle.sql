-- Canonical event lifecycle. Legacy draft/ready rows are retained for explicit
-- admin classification because `ready` did not identify a lifecycle position.
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'Upcoming';

UPDATE "events" SET "status" = 'Upcoming' WHERE "status" = 'OPEN';
UPDATE "events" SET "status" = 'Live' WHERE "status" = 'LIVE';
UPDATE "events" SET "status" = 'Closed' WHERE "status" = 'CLOSED';
UPDATE "events" SET "status" = 'Archived' WHERE "status" = 'ARCHIVED';

ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_status_check";
ALTER TABLE "events" ADD CONSTRAINT "events_status_check" CHECK (
  "status" IN (
    'Upcoming', 'Live', 'Completed', 'Closed', 'Archived', 'Postponed', 'Cancelled',
    'draft', 'ready'
  )
);
