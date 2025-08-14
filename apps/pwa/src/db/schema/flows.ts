import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import {
  Edge,
  Node,
  PanelStructure,
  FlowViewport,
  ReadyState,
} from "@/modules/flow/domain/flow";
import type { ValidationIssue } from "@/flow-multi/validation/types/validation-types";

export const flows = pgTable(TableName.Flows, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  description: text().notNull(),
  nodes: jsonb().$type<Node[]>().notNull(),
  edges: jsonb().$type<Edge[]>().notNull(),
  response_template: text().notNull(),
  data_store_schema: jsonb(),
  panel_structure: jsonb().$type<PanelStructure>(),
  viewport: jsonb().$type<FlowViewport>(),
  ready_state: varchar().$type<ReadyState>().notNull().default(ReadyState.Draft),
  validation_issues: jsonb().$type<ValidationIssue[]>(),
  ...timestamps,
});

export type SelectFlow = typeof flows.$inferSelect;
export type InsertFlow = typeof flows.$inferInsert;
