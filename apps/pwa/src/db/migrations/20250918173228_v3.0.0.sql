CREATE TABLE "generated_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"asset_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"style" varchar,
	"aspect_ratio" varchar,
	"media_type" varchar,
	"thumbnail_asset_id" uuid,
	"associated_card_id" uuid,
	"is_session_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vibe_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"resource_id" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applied_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_results" jsonb,
	"conversation_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"snapshots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" text NOT NULL,
	CONSTRAINT "vibe_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "model_tier" varchar DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "vibe_session_id" uuid;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "image_prompt" text;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "vibe_session_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_resource_session" ON "vibe_sessions" USING btree ("resource_id","resource_type");