-- Exactly-once user/event progression ledger. User updates and completion rows
-- are committed in the same transaction.
CREATE TABLE "event_progression_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"state" varchar(30) DEFAULT 'processing' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"result" jsonb,
	"last_error" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_progression_applications_event_user_idx" ON "event_progression_applications" USING btree ("event_id","user_id");
