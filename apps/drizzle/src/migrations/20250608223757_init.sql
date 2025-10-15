CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"target_api_type" varchar NOT NULL,
	"api_source" jsonb,
	"model_id" varchar,
	"model_name" varchar,
	"prompt_messages" text NOT NULL,
	"enabled_parameters" jsonb NOT NULL,
	"parameter_values" jsonb NOT NULL,
	"enabled_structured_output" boolean DEFAULT false NOT NULL,
	"schema_name" varchar,
	"schema_description" text,
	"schema_fields" jsonb,
	"token_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"source" varchar NOT NULL,
	"base_url" varchar,
	"api_key" varchar,
	"model_urls" jsonb,
	"openrouter_provider_sort" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"hash" varchar NOT NULL,
	"name" varchar NOT NULL,
	"size_byte" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backgrounds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"icon_asset_id" uuid,
	"type" varchar NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"creator" varchar,
	"card_summary" text,
	"version" varchar,
	"conceptual_origin" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character_cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"example_dialogue" text,
	"lorebook" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "configs" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"nodes" jsonb NOT NULL,
	"edges" jsonb NOT NULL,
	"agents" jsonb NOT NULL,
	"response_template" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plot_cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"description" text,
	"scenarios" jsonb,
	"lorebook" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"all_cards" jsonb NOT NULL,
	"user_character_card_id" uuid,
	"turn_ids" jsonb NOT NULL,
	"background_id" uuid,
	"translation" jsonb,
	"chat_styles" jsonb,
	"flow_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"character_card_id" uuid,
	"character_name" varchar,
	"options" jsonb NOT NULL,
	"selected_option_index" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
