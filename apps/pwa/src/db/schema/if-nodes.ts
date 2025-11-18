import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { IfCondition } from "@/features/flow/nodes/if-node";
import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { flows } from "@/db/schema/flows";

export const ifNodes = pgTable(TableName.IfNodes, {
  id: uuid().primaryKey(),
  flow_id: uuid()
    .notNull()
    .references(() => flows.id, {
      onDelete: "cascade", // Auto-delete when flow is deleted
    }),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  logicOperator: varchar(),
  conditions: jsonb().$type<IfCondition[]>().default([]),
  ...timestamps,
});

export type SelectIfNode = typeof ifNodes.$inferSelect;
export type InsertIfNode = typeof ifNodes.$inferInsert;
