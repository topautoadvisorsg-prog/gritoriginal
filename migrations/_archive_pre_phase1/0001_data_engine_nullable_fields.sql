-- Migration: data_engine_nullable_fields
-- Applied via: npm run db:push --force
-- Purpose: Make fighter gym and fight history snapshot fields nullable
--          so the external data engine can push records with missing values.

-- 1. fighters.gym — was NOT NULL, now nullable
--    Data engine may push fighter records without a gym value.
ALTER TABLE "fighters" ALTER COLUMN "gym" DROP NOT NULL;

-- 2. fight_history snapshot columns — were NOT NULL, now nullable
--    These are denormalised snapshot fields copied from event/fighter records.
--    The data engine pushes them when available; absent values default to NULL.
ALTER TABLE "fight_history" ALTER COLUMN "event_name" DROP NOT NULL;
ALTER TABLE "fight_history" ALTER COLUMN "event_date" DROP NOT NULL;
ALTER TABLE "fight_history" ALTER COLUMN "fight_type" DROP NOT NULL;
ALTER TABLE "fight_history" ALTER COLUMN "location" DROP NOT NULL;
