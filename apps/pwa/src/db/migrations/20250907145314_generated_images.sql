CREATE TABLE "generated_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"asset_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"style" varchar,
	"aspect_ratio" varchar,
	"associated_card_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_resource_session" ON "vibe_sessions" USING btree ("resource_id","resource_type");