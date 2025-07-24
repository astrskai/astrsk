ALTER TABLE "agents" ADD COLUMN "text_prompt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "output_format" varchar DEFAULT 'structured_output';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "color" varchar DEFAULT '#3b82f6' NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "panel_structure" jsonb;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "viewport" jsonb;