ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "is_play_session" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_is_play_session_idx" ON "sessions" ("is_play_session");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_play_session_updated_at_idx" ON "sessions" ("is_play_session", "updated_at" DESC) WHERE "is_play_session" = true;