ALTER TABLE "flows" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "version" varchar;--> statement-breakpoint
ALTER TABLE "flows" ADD COLUMN "conceptual_origin" varchar;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "name" varchar;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "summary" text;