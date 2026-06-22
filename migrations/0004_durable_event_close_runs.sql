-- Durable event-close state. Progression remains deferred until it is replay-safe.
CREATE TABLE "event_close_runs" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"state" varchar(30) DEFAULT 'processing' NOT NULL,
	"progression_state" varchar(30) DEFAULT 'deferred' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"snapshot_completed_at" timestamp,
	"last_error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
