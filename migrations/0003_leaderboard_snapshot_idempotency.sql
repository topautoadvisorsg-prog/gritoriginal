-- Legacy snapshots retain NULL keys. Every new writer supplies a stable scope key.
ALTER TABLE "leaderboard_snapshots" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_snapshots_idempotency_key_idx" ON "leaderboard_snapshots" USING btree ("idempotency_key");
