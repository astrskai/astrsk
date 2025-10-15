import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import {
  DataStoreSchema,
  Edge,
  FlowViewport,
  Node,
  PanelStructure,
  ReadyState,
  ValidationIssue,
} from "@astrsk/shared/types";

export const flows = pgTable(TableName.Flows, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  description: text().notNull(),
  nodes: jsonb().$type<Node[]>().notNull(),
  edges: jsonb().$type<Edge[]>().notNull(),
  response_template: text().notNull(),
  data_store_schema: jsonb().$type<DataStoreSchema>(),
  panel_structure: jsonb().$type<PanelStructure>(),
  viewport: jsonb().$type<FlowViewport>(),
  vibe_session_id: uuid(), // Reference to active vibe session
  ready_state: varchar().$type<ReadyState>().notNull().default(ReadyState.Draft),
  validation_issues: jsonb().$type<ValidationIssue[]>(),
  ...timestamps,
});

export type SelectFlow = typeof flows.$inferSelect;
export type InsertFlow = typeof flows.$inferInsert;
