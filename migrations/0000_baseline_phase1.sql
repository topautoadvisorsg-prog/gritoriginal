CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"details" text,
	"ip_address" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "ai_chat_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"violation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_fight_qa_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"question" text NOT NULL,
	"question_key" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"is_suggested" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_hit_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_fight_stats" (
	"fight_id" uuid PRIMARY KEY NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"last_open_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_prediction_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prediction" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_suggested_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_type" varchar(100) NOT NULL,
	"trigger_event_id" uuid,
	"triggered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_bans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"moderator_id" varchar NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"cooldown_minutes" integer DEFAULT 30 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_id" uuid,
	"chat_type" varchar(20) DEFAULT 'global' NOT NULL,
	"country_code" varchar(10),
	"message" text NOT NULL,
	"message_type" varchar(10) DEFAULT 'text' NOT NULL,
	"slip_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_mutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"moderator_id" varchar NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(30) NOT NULL,
	"message" text NOT NULL,
	"slip_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_engine_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar,
	CONSTRAINT "data_engine_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "data_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" varchar,
	"action_type" varchar(20) NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"submitted_by" varchar,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"is_potential_duplicate" boolean DEFAULT false NOT NULL,
	"error_log" text,
	"applied_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_fights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"fighter1_id" uuid NOT NULL,
	"fighter2_id" uuid NOT NULL,
	"card_placement" varchar(50) NOT NULL,
	"bout_order" integer NOT NULL,
	"weight_class" varchar(100) NOT NULL,
	"is_title_fight" boolean DEFAULT false NOT NULL,
	"rounds" integer DEFAULT 3 NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"scheduled_time" varchar(20),
	"odds" jsonb,
	"time_format" varchar(50),
	"round_end" integer,
	"time_end" varchar(20),
	"method" varchar(100),
	"referee" varchar(255),
	"winner_id" uuid,
	"fighter1_result" varchar(10),
	"fighter2_result" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"date" timestamp NOT NULL,
	"venue" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(100),
	"country" varchar(100) NOT NULL,
	"organization" varchar(50) DEFAULT 'UFC' NOT NULL,
	"description" text,
	"image_url" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"lock_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fight_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fighter_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"fighter_name" varchar(255),
	"fighter_nickname" varchar(255),
	"opponent_id" uuid,
	"opponent_name" varchar(255) NOT NULL,
	"opponent_nickname" varchar(255),
	"opponent_linked" boolean DEFAULT true NOT NULL,
	"event_name" varchar(500),
	"event_date" timestamp,
	"event_promotion" varchar(100),
	"weight_class" varchar(100),
	"fight_type" varchar(50),
	"billing" varchar(100),
	"bout_order" integer NOT NULL,
	"rounds_scheduled" integer,
	"round_duration_minutes" integer,
	"location" jsonb,
	"event_city" text,
	"event_state" text,
	"event_country" text,
	"event_venue" text,
	"result" varchar(20) NOT NULL,
	"method" varchar(100) NOT NULL,
	"method_detail" varchar(255),
	"round" integer NOT NULL,
	"time" varchar(20) NOT NULL,
	"fight_duration_seconds" integer NOT NULL,
	"title_fight" boolean DEFAULT false NOT NULL,
	"title_fight_detail" varchar(255),
	"referee" varchar(255),
	"round_time_format" varchar(50),
	"judges_scores_data" jsonb,
	"per_round_stats" jsonb,
	"is_locked" boolean DEFAULT false NOT NULL,
	"stats" jsonb,
	"odds_snapshot" jsonb,
	"travel_distance" integer,
	"venue_altitude" integer,
	"media_pressure" boolean,
	"gym_changes" boolean,
	"injury_flags" jsonb,
	"referee_notes" jsonb,
	"penalty_deductions" jsonb,
	"weight_cut_success" boolean,
	"admin_notes" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fight_history_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_history_id" uuid NOT NULL,
	"previous_data" jsonb NOT NULL,
	"changed_by" varchar NOT NULL,
	"change_type" text NOT NULL,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fight_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"fight_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fight_odds_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"fighter1_odds" varchar(20),
	"fighter2_odds" varchar(20),
	"over_under" varchar(20),
	"source" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fight_totals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"fighter_id" uuid NOT NULL,
	"knockdowns" integer,
	"sig_str_landed" integer,
	"sig_str_attempted" integer,
	"sig_str_percentage" integer,
	"total_str_landed" integer,
	"total_str_attempted" integer,
	"takedowns_landed" integer,
	"takedowns_attempted" integer,
	"takedown_percentage" integer,
	"submission_attempts" integer,
	"reversals" integer,
	"control_time" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "fighter_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fighter_id" uuid NOT NULL,
	"submitted_by" varchar(255),
	"what_is_wrong" text NOT NULL,
	"source_link" varchar(1000),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fighter_tag_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'Intangibles' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fighter_tag_definitions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "fighter_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fighter_id" uuid NOT NULL,
	"tag_definition_id" uuid NOT NULL,
	"value" integer DEFAULT 5 NOT NULL,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fighters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"nickname" varchar(255),
	"date_of_birth" timestamp,
	"nationality" varchar(255) NOT NULL,
	"gender" varchar(20) NOT NULL,
	"weight_class" varchar(100) NOT NULL,
	"stance" varchar(50),
	"gym" varchar(255),
	"head_coach" varchar(255),
	"team" varchar(255),
	"fighting_out_of" varchar(255),
	"style" varchar(100),
	"bio" text,
	"ai_preferences" jsonb DEFAULT '{"enabled":true}'::jsonb,
	"social_media" jsonb,
	"height_inch" real,
	"reach_inch" real,
	"leg_reach_inch" real,
	"weight" real,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"nc" integer DEFAULT 0 NOT NULL,
	"image_url" text NOT NULL,
	"body_image_url" text,
	"organization" varchar(50) NOT NULL,
	"physical_stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"record" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"odds" jsonb,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"camp_start_date" timestamp,
	"training_partners" jsonb,
	"dominant_hand" varchar(20),
	"dominant_foot" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"ranking" integer,
	"rank_global" integer,
	"rank_promotion" integer,
	"is_champion" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false NOT NULL,
	"needs_image" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"owner_id" varchar NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"max_members" integer DEFAULT 50 NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intel_feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"emoji" varchar(10) DEFAULT '⚡' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "judges_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"judge_name" varchar(255) NOT NULL,
	"fighter1_score" integer NOT NULL,
	"fighter2_score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"subtitle" varchar(500),
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"author" varchar(255) NOT NULL,
	"image_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"layer" varchar(20) DEFAULT 'standard' NOT NULL,
	"event_reference" uuid,
	"fighter_reference" uuid,
	"read_time" varchar(50),
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle_draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"winner_id" varchar NOT NULL,
	"pool_total" integer NOT NULL,
	"total_tickets" integer NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"drawn_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"contribution_amount" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"source" varchar(50) DEFAULT 'admin' NOT NULL,
	"event_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"fighter_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"sig_str_landed" integer,
	"sig_str_attempted" integer,
	"sig_str_percentage" integer,
	"total_str_landed" integer,
	"total_str_attempted" integer,
	"td_landed" integer,
	"td_attempted" integer,
	"sub_attempts" integer,
	"control_time" varchar(20),
	"knockdowns" integer
);
--> statement-breakpoint
CREATE TABLE "sig_strikes_breakdown" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" uuid NOT NULL,
	"fighter_id" uuid NOT NULL,
	"head_landed" integer,
	"head_attempted" integer,
	"body_landed" integer,
	"body_attempted" integer,
	"leg_landed" integer,
	"leg_attempted" integer,
	"distance_landed" integer,
	"distance_attempted" integer,
	"clinch_landed" integer,
	"clinch_attempted" integer,
	"ground_landed" integer,
	"ground_attempted" integer
);
--> statement-breakpoint
CREATE TABLE "slips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"image_url" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"caption" text,
	"rejection_message" text,
	"expires_at" timestamp NOT NULL,
	"featured_at" timestamp,
	"approved_at" timestamp,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(20) DEFAULT '#6b7280' NOT NULL,
	"category" varchar(50) DEFAULT 'standard' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "unmatched_opponents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imported_name" text NOT NULL,
	"candidates" jsonb,
	"resolved_fighter_id" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_type" varchar(100) DEFAULT 'custom' NOT NULL,
	"badge_name" varchar(100) DEFAULT 'Badge' NOT NULL,
	"badge_icon" varchar(20) DEFAULT '🏆',
	"reason" text,
	"awarded_by" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"prize_claimed" boolean DEFAULT false NOT NULL,
	"prize_amount" integer,
	"admin_notified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enable_sounds" boolean DEFAULT true NOT NULL,
	"enable_celebrations" boolean DEFAULT true NOT NULL,
	"show_streaks" boolean DEFAULT true NOT NULL,
	"show_badges" boolean DEFAULT true NOT NULL,
	"show_betting_tracker" boolean DEFAULT false NOT NULL,
	"unit_size" integer DEFAULT 0,
	"enable_push_notifications" boolean DEFAULT true NOT NULL,
	"enable_event_reminders" boolean DEFAULT true NOT NULL,
	"enable_result_alerts" boolean DEFAULT true NOT NULL,
	"enable_leaderboard_updates" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "fight_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fight_id" varchar NOT NULL,
	"winner_id" varchar,
	"method" varchar(50),
	"method_detail" varchar(255),
	"round" integer,
	"time" varchar(20),
	"referee" varchar(255),
	"stats" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "fight_results_fight_id_unique" UNIQUE("fight_id")
);
--> statement-breakpoint
CREATE TABLE "leaderboard_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_type" varchar(20) NOT NULL,
	"event_id" uuid,
	"snapshot_date" timestamp NOT NULL,
	"rankings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" varchar NOT NULL,
	"blocked_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_mutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"muter_id" varchar NOT NULL,
	"muted_id" varchar NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_picks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"fight_id" varchar NOT NULL,
	"picked_fighter_id" varchar NOT NULL,
	"picked_method" varchar(50) NOT NULL,
	"picked_round" integer,
	"units" integer DEFAULT 1 NOT NULL,
	"locked_odds" varchar,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"confidence_flag" varchar(20) DEFAULT 'none' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" varchar NOT NULL,
	"reported_id" varchar NOT NULL,
	"reason" varchar(500) NOT NULL,
	"details" varchar(2000),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_notes" varchar(2000),
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"username" varchar(50),
	"avatar_url" varchar,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"privacy_settings" jsonb DEFAULT '{"showAvatar":true,"showSocialLinks":true,"showUsername":true}'::jsonb,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"tier" varchar(20) DEFAULT 'free' NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"country" varchar(100),
	"language" varchar(10) DEFAULT 'en',
	"featured_influencer" boolean DEFAULT false NOT NULL,
	"star_level" integer DEFAULT 0 NOT NULL,
	"progress_badge" varchar(20) DEFAULT 'none' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"last_progression_calc" timestamp,
	"monthly_login_count" integer DEFAULT 0,
	"last_login_month" varchar(7),
	"last_login_date" timestamp,
	"is_ai_chat_blocked" boolean DEFAULT false,
	"subscription_id" varchar,
	"subscription_status" varchar,
	"current_period_end" timestamp,
	"subscription_start_date" timestamp,
	"yellow_red_flags_used" integer DEFAULT 0 NOT NULL,
	"flag_budget" integer DEFAULT 0 NOT NULL,
	"current_event_id" varchar,
	"last_flag_reset_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "fight_history" ADD CONSTRAINT "fight_history_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fight_history" ADD CONSTRAINT "fight_history_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fight_odds_history" ADD CONSTRAINT "fight_odds_history_fight_id_event_fights_id_fk" FOREIGN KEY ("fight_id") REFERENCES "public"."event_fights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighter_corrections" ADD CONSTRAINT "fighter_corrections_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat" ADD CONSTRAINT "group_chat_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat" ADD CONSTRAINT "group_chat_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_draws" ADD CONSTRAINT "raffle_draws_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_pool" ADD CONSTRAINT "raffle_pool_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fight_history_fighter_event_idx" ON "fight_history" USING btree ("fighter_id","event_id");--> statement-breakpoint
CREATE INDEX "fight_history_fighter_idx" ON "fight_history" USING btree ("fighter_id");--> statement-breakpoint
CREATE INDEX "fight_history_event_date_idx" ON "fight_history" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "fight_history_event_city_idx" ON "fight_history" USING btree ("event_city");--> statement-breakpoint
CREATE INDEX "fight_history_event_country_idx" ON "fight_history" USING btree ("event_country");--> statement-breakpoint
CREATE UNIQUE INDEX "fight_notes_user_fight_idx" ON "fight_notes" USING btree ("user_id","fight_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fighters_name_idx" ON "fighters" USING btree (lower("first_name"),lower("last_name"));--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_user_idx" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "raffle_pool_event_user_idx" ON "raffle_pool" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_picks_user_id_fight_id_idx" ON "user_picks" USING btree ("user_id","fight_id");--> statement-breakpoint
CREATE INDEX "user_picks_fight_id_picked_id_idx" ON "user_picks" USING btree ("fight_id","picked_fighter_id");