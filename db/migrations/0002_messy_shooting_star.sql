ALTER TABLE "debts" ADD COLUMN "strategy_order" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "strategy_order_positive" CHECK ("debts"."strategy_order" > 0);