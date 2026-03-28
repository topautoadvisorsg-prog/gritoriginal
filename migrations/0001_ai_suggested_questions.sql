CREATE TABLE IF NOT EXISTS "ai_suggested_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "ai_suggested_questions" ("question", "sort_order", "is_active")
SELECT q.question, q.sort_order, true
FROM (VALUES
  ('Who has the striking advantage?', 1),
  ('Who has the grappling advantage?', 2),
  ('What is the most likely path to victory for each fighter?', 3),
  ('How do their last 5 fights compare?', 4),
  ('Does reach or size play a significant role in this matchup?', 5),
  ('Who has the cardio and conditioning edge?', 6),
  ('What style problems does each fighter present for the other?', 7),
  ('Give me your overall prediction and confidence level.', 8)
) AS q(question, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "ai_suggested_questions" LIMIT 1);
