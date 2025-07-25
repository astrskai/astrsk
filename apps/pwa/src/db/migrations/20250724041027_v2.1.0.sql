DROP TABLE IF EXISTS "configs" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "auto_reply" varchar DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" DROP COLUMN IF EXISTS "agents" CASCADE;