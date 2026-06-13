CREATE TYPE "public"."billing_plan" AS ENUM('pro');--> statement-breakpoint
CREATE TYPE "public"."debt_status" AS ENUM('active', 'paused', 'settled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('opening', 'payment', 'interest', 'fee', 'adjustment', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."ledger_recorded_by" AS ENUM('user', 'system', 'job');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'push', 'sms');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'paystack');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'retrying', 'sent', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('payment_due', 'payment_overdue', 'general_notification');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"currency" char(3) DEFAULT 'NGN' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"subscription_tier" text DEFAULT 'free',
	"currency" text DEFAULT 'NGN',
	"onboarding_completed" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"creditor" varchar(100) NOT NULL,
	"original_amount_minor" integer NOT NULL,
	"interest_rate_bps" integer DEFAULT 0 NOT NULL,
	"minimum_payment_minor" integer DEFAULT 0 NOT NULL,
	"due_day" integer,
	"currency" char(3) DEFAULT 'NGN' NOT NULL,
	"status" "debt_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"settled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "original_amount_positive" CHECK ("debts"."original_amount_minor" > 0),
	CONSTRAINT "interest_rate_non_negative" CHECK ("debts"."interest_rate_bps" >= 0),
	CONSTRAINT "minimum_payment_non_negative" CHECK ("debts"."minimum_payment_minor" >= 0),
	CONSTRAINT "due_day_valid" CHECK ("debts"."due_day" >= 1 AND "debts"."due_day" <= 31)
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" "ledger_entry_type" NOT NULL,
	"amount_minor" bigint NOT NULL,
	"reference_entry_id" uuid,
	"recorded_by" "ledger_recorded_by" DEFAULT 'user' NOT NULL,
	"note" text,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amount_cannot_be_zero" CHECK ("ledger_entries"."amount_minor" <> 0),
	CONSTRAINT "ledger_business_rules" CHECK (
        (type = 'opening' AND amount_minor > 0) OR
        (type = 'interest' AND amount_minor > 0) OR
        (type = 'fee' AND amount_minor > 0) OR
        (type = 'payment' AND amount_minor < 0) OR
        (type = 'reversal' AND amount_minor <> 0 AND reference_entry_id IS NOT NULL) OR
        (type = 'adjustment' AND note IS NOT NULL AND length(trim(note)) > 0)
      )
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" "billing_plan" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_subscription_id" varchar(255) NOT NULL,
	"provider_customer_id" varchar(255),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"last_webhook_event_id" varchar(255),
	"metadata" jsonb,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" "reminder_type" NOT NULL,
	"channel" "notification_channel" DEFAULT 'email' NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"status" "reminder_status" DEFAULT 'pending' NOT NULL,
	"trigger_task_id" varchar(255),
	"provider_message_id" varchar(255),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"failure_reason" text,
	"processed_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_self_fk" FOREIGN KEY ("reference_entry_id") REFERENCES "public"."ledger_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "debts_user_id_idx" ON "debts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debts_user_id_status_idx" ON "debts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ledger_entries_debt_id_idx" ON "ledger_entries" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_user_id_idx" ON "ledger_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_debt_user_idx" ON "ledger_entries" USING btree ("debt_id","user_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_debt_effective_idx" ON "ledger_entries" USING btree ("debt_id","effective_date");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_sub_id_idx" ON "subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_debt_id_idx" ON "reminders" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX "reminders_status_remind_at_idx" ON "reminders" USING btree ("status","remind_at");