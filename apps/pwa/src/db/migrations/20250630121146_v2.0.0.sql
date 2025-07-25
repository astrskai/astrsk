ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "text_prompt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "output_format" varchar DEFAULT 'structured_output';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "color" varchar DEFAULT '#3b82f6' NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN IF NOT EXISTS "panel_structure" jsonb;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN IF NOT EXISTS "viewport" jsonb;