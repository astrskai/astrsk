import {
  boolean,
  jsonb,
  pgTable,
  integer,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { SchemaField, ModelTier } from "@/entities/agent/domain";
import { ApiSource } from "@/entities/api/domain";
import { flows } from "@/db/schema/flows";

export const agents = pgTable(TableName.Agents, {
  id: uuid().primaryKey(),
  flow_id: uuid()
    .notNull()
    .references(() => flows.id, {
      onDelete: "cascade", // Auto-delete when flow is deleted
    }),
  name: varchar().notNull(),
  description: text().notNull(),
  target_api_type: varchar().notNull(),
  api_source: jsonb().$type<ApiSource>(),
  model_id: varchar(),
  model_name: varchar(),
  model_tier: varchar().$type<ModelTier>().default(ModelTier.Light),
  use_default_model: boolean().notNull().default(true), // true = use tier-based default, false = use specific model
  prompt_messages: text().notNull(),
  text_prompt: text().notNull().default(""),
  enabled_parameters: jsonb()
    .$type<{
      [key: string]: boolean;
    }>()
    .notNull(),
  parameter_values: jsonb()
    .$type<{
      [key: string]: any;
    }>()
    .notNull(),
  enabled_structured_output: boolean().notNull().default(false), // TODO: remove this field
  output_format: varchar().default("structured_output"),
  output_streaming: boolean().default(true),
  schema_name: varchar(),
  schema_description: text(),
  schema_fields: jsonb().$type<SchemaField[]>(),
  token_count: integer().notNull().default(0),
  color: varchar().notNull().default("#3b82f6"),
  ...timestamps,
});

export type SelectAgent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
