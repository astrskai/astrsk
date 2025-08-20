import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { IfCondition } from "@/flow-multi/nodes/if-node";
import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const ifNodes = pgTable(TableName.IfNodes, {
  id: uuid().primaryKey(),
  flow_id: uuid().notNull(),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  logicOperator: varchar(),
  conditions: jsonb().$type<IfCondition[]>().default([]),
  ...timestamps,
});

export type SelectDataStoreNode = typeof ifNodes.$inferSelect;
export type InsertDataStoreNode = typeof ifNodes.$inferInsert;
