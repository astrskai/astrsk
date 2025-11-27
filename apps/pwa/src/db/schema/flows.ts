import { boolean, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import {
  Edge,
  Node,
  PanelStructure,
  FlowViewport,
  ReadyState,
  DataStoreSchema,
} from "@/entities/flow/domain/flow";
import type { ValidationIssue } from "@/entities/flow/model/validation-types";
import { sessions } from "@/db/schema/sessions";

export const flows = pgTable(TableName.Flows, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  description: text().notNull(),

  // Metadata fields (similar to characters)
  tags: text().array().notNull().default(sql`'{}'`),
  summary: text(),
  version: varchar(),
  conceptual_origin: varchar(),

  nodes: jsonb().$type<Node[]>().notNull(),
  edges: jsonb().$type<Edge[]>().notNull(),
  response_template: text().notNull(),
  data_store_schema: jsonb().$type<DataStoreSchema>(),
  panel_structure: jsonb().$type<PanelStructure>(),
  viewport: jsonb().$type<FlowViewport>(),
  vibe_session_id: uuid(), // Reference to active vibe session
  ready_state: varchar().$type<ReadyState>().notNull().default(ReadyState.Draft),
  validation_issues: jsonb().$type<ValidationIssue[]>(),

  // Session-local resource support
  // NULL = global resource (shows in lists)
  // Non-NULL = local to specific session (hidden from global lists)
  session_id: uuid().references(() => sessions.id, {
    onDelete: "cascade", // Auto-delete when session is deleted
  }),

  ...timestamps,
});

export type SelectFlow = typeof flows.$inferSelect;
export type InsertFlow = typeof flows.$inferInsert;
