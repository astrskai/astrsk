-- Populate name from title for existing sessions
UPDATE "sessions" SET "name" = "title" WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "name" SET NOT NULL;