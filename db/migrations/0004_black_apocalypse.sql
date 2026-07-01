CREATE TYPE "public"."receivable_ledger_type" AS ENUM('opening', 'repayment', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."receivable_status" AS ENUM('active', 'settled', 'archived');--> statement-breakpoint
CREATE TABLE "receivable_ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"receivable_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" "receivable_ledger_type" NOT NULL,
	"amount_minor" integer NOT NULL,
	"recorded_by" text DEFAULT 'user' NOT NULL,
	"note" text,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivables" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"debtor_name" text NOT NULL,
	"debtor_phone" text,
	"debtor_relationship" text,
	"original_amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"expected_by_date" timestamp with time zone,
	"status" "receivable_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receivable_ledger_entries" ADD CONSTRAINT "receivable_ledger_entries_receivable_id_receivables_id_fk" FOREIGN KEY ("receivable_id") REFERENCES "public"."receivables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "receivable_ledger_receivable_id_idx" ON "receivable_ledger_entries" USING btree ("receivable_id");--> statement-breakpoint
CREATE INDEX "receivable_ledger_user_id_idx" ON "receivable_ledger_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receivables_user_id_idx" ON "receivables" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receivables_user_id_status_idx" ON "receivables" USING btree ("user_id","status");