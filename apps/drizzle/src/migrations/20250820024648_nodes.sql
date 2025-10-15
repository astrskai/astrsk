CREATE TABLE "data_store_nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"flow_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"color" varchar DEFAULT '#3b82f6' NOT NULL,
	"data_store_fields" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "if_nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"flow_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"color" varchar DEFAULT '#3b82f6' NOT NULL,
	"logicOperator" varchar,
	"conditions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
