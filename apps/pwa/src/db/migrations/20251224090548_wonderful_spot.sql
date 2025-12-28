CREATE TABLE "compression_anchors" (
	"session_id" uuid NOT NULL,
	"anchor" varchar NOT NULL,
	"text" text NOT NULL,
	"accessible_to" text[] NOT NULL,
	"starting_text" varchar NOT NULL,
	"character_name" varchar,
	"turn_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compression_anchors_session_id_anchor_pk" PRIMARY KEY("session_id","anchor")
);
--> statement-breakpoint
CREATE INDEX "idx_compression_session_character" ON "compression_anchors" USING btree ("session_id","character_name");