CREATE TABLE "vibe_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"resource_id" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applied_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_results" jsonb,
	"conversation_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" text NOT NULL,
	CONSTRAINT "vibe_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "vibe_session_id" uuid;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "vibe_session_id" uuid;