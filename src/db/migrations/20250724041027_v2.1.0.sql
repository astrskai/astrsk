DROP TABLE "configs" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "auto_reply" varchar DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" DROP COLUMN "agents";