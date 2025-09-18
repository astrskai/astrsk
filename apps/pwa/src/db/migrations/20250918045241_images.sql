ALTER TABLE "agents" ADD COLUMN "model_tier" varchar DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "image_prompt" text;--> statement-breakpoint
ALTER TABLE "generated_images" ADD COLUMN "media_type" varchar;--> statement-breakpoint
ALTER TABLE "generated_images" ADD COLUMN "thumbnail_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "generated_images" ADD COLUMN "is_session_generated" boolean DEFAULT false;
