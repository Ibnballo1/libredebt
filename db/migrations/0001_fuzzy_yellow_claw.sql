ALTER TABLE "users" ADD COLUMN "reminder_due_soon_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminder_overdue_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminder_weekly_summary_enabled" boolean DEFAULT true NOT NULL;