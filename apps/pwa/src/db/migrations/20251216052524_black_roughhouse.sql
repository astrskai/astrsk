ALTER TABLE "characters" ADD COLUMN "config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "config" jsonb DEFAULT '{}'::jsonb NOT NULL;