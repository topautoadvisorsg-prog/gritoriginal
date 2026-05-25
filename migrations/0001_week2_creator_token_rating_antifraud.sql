CREATE TABLE "cash_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"kind" varchar(30) NOT NULL,
	"amount_cents" integer NOT NULL,
	"payout_method" varchar(30),
	"payout_destination" varchar(255),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"tax_year" integer NOT NULL,
	"tax_form_collected" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booker_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"price_cents" integer NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"stripe_payment_intent_id" varchar(100) NOT NULL,
	"status" varchar(30) DEFAULT 'booked' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"no_show_flagged_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_charge_id" varchar(100) NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"monthly_price_cents" integer,
	"stripe_connect_account_id" varchar(100),
	"stripe_connect_charges_enabled" boolean DEFAULT false NOT NULL,
	"stripe_connect_payouts_enabled" boolean DEFAULT false NOT NULL,
	"paid_eligibility_met_at" timestamp,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"bio" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"paused_at" timestamp,
	"terminated_at" timestamp,
	"termination_reason" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"stripe_subscription_id" varchar(100) NOT NULL,
	"status" varchar(30) NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"visitor_id" varchar(100),
	"stripe_card_fingerprint" varchar(100),
	"stripe_email" varchar(255),
	"ip" varchar(45),
	"asn" varchar(50),
	"asn_org" varchar(255),
	"event_kind" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fighter_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"fighter_id" uuid NOT NULL,
	"fight_id" uuid NOT NULL,
	"fight_iq" integer NOT NULL,
	"grappling" integer NOT NULL,
	"striking" integer NOT NULL,
	"cardio" integer NOT NULL,
	"aggressiveness" integer NOT NULL,
	"counts_toward_aggregate" boolean DEFAULT true NOT NULL,
	"excluded_reason" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_badge_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" integer NOT NULL,
	"slot_number" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"doc_kind" varchar(30) NOT NULL,
	"doc_version" varchar(20) NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"ip" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "multi_account_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"linked_user_id" varchar NOT NULL,
	"match_type" varchar(30) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"resolution" varchar(30),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_balances" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"frozen_at" timestamp,
	"unfrozen_at" timestamp,
	"lifetime_purchased" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_feature_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_code" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"token_cost" integer NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_feature_costs_feature_code_unique" UNIQUE("feature_code")
);
--> statement-breakpoint
CREATE TABLE "token_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"price_cents" integer NOT NULL,
	"token_amount" integer NOT NULL,
	"stripe_product_id" varchar(100),
	"stripe_price_id" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_packs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"kind" varchar(30) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"pack_id" uuid,
	"stripe_charge_id" varchar(100),
	"ai_feature" varchar(50),
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_payouts" ADD CONSTRAINT "cash_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_booker_id_users_id_fk" FOREIGN KEY ("booker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_donations" ADD CONSTRAINT "creator_donations_donor_id_users_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_donations" ADD CONSTRAINT "creator_donations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_subscriptions" ADD CONSTRAINT "creator_subscriptions_subscriber_id_users_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_subscriptions" ADD CONSTRAINT "creator_subscriptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighter_ratings" ADD CONSTRAINT "fighter_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighter_ratings" ADD CONSTRAINT "fighter_ratings_fighter_id_fighters_id_fk" FOREIGN KEY ("fighter_id") REFERENCES "public"."fighters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fighter_ratings" ADD CONSTRAINT "fighter_ratings_fight_id_event_fights_id_fk" FOREIGN KEY ("fight_id") REFERENCES "public"."event_fights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founder_badge_slots" ADD CONSTRAINT "founder_badge_slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_account_flags" ADD CONSTRAINT "multi_account_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_account_flags" ADD CONSTRAINT "multi_account_flags_linked_user_id_users_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_account_flags" ADD CONSTRAINT "multi_account_flags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_balances" ADD CONSTRAINT "token_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_pack_id_token_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."token_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_user_year_idx" ON "cash_payouts" USING btree ("user_id","tax_year");--> statement-breakpoint
CREATE INDEX "payout_pending_idx" ON "cash_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_session_booker_idx" ON "chat_sessions" USING btree ("booker_id","status");--> statement-breakpoint
CREATE INDEX "chat_session_creator_idx" ON "chat_sessions" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX "donation_creator_idx" ON "creator_donations" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_sub_unique_idx" ON "creator_subscriptions" USING btree ("subscriber_id","creator_id");--> statement-breakpoint
CREATE INDEX "creator_sub_creator_idx" ON "creator_subscriptions" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX "creator_sub_subscriber_idx" ON "creator_subscriptions" USING btree ("subscriber_id","status");--> statement-breakpoint
CREATE INDEX "fp_visitor_idx" ON "device_fingerprints" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "fp_card_idx" ON "device_fingerprints" USING btree ("stripe_card_fingerprint");--> statement-breakpoint
CREATE INDEX "fp_email_idx" ON "device_fingerprints" USING btree ("stripe_email");--> statement-breakpoint
CREATE INDEX "fp_user_idx" ON "device_fingerprints" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rating_user_fighter_fight_idx" ON "fighter_ratings" USING btree ("user_id","fighter_id","fight_id");--> statement-breakpoint
CREATE INDEX "rating_fighter_idx" ON "fighter_ratings" USING btree ("fighter_id","counts_toward_aggregate");--> statement-breakpoint
CREATE UNIQUE INDEX "founder_tier_slot_idx" ON "founder_badge_slots" USING btree ("tier","slot_number");--> statement-breakpoint
CREATE UNIQUE INDEX "founder_user_tier_idx" ON "founder_badge_slots" USING btree ("user_id","tier");--> statement-breakpoint
CREATE INDEX "legal_user_kind_idx" ON "legal_acceptances" USING btree ("user_id","doc_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "ma_flag_unique_idx" ON "multi_account_flags" USING btree ("user_id","linked_user_id","match_type");--> statement-breakpoint
CREATE INDEX "ma_flag_pending_idx" ON "multi_account_flags" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "token_tx_user_idx" ON "token_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "token_tx_pack_idx" ON "token_transactions" USING btree ("pack_id");