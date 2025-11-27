CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"icon_asset_id" uuid,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"creator" varchar,
	"card_summary" text,
	"version" varchar,
	"conceptual_origin" varchar,
	"vibe_session_id" uuid,
	"image_prompt" text,
	"name" varchar NOT NULL,
	"description" text,
	"example_dialogue" text,
	"lorebook" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"icon_asset_id" uuid,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"creator" varchar,
	"card_summary" text,
	"version" varchar,
	"conceptual_origin" varchar,
	"vibe_session_id" uuid,
	"image_prompt" text,
	"name" varchar NOT NULL,
	"description" text,
	"first_messages" jsonb,
	"lorebook" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
