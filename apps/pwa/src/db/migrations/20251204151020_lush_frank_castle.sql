ALTER TABLE "sessions" ALTER COLUMN "auto_reply" SET DEFAULT 'random';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "use_default_model" boolean DEFAULT true NOT NULL;