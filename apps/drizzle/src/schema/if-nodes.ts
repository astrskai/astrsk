import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import {
  ConditionDataType,
  ConditionOperator,
} from "@astrsk/shared/types";
import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * If node condition definition
 */
export interface IfCondition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

export const ifNodes = pgTable(TableName.IfNodes, {
  id: uuid().primaryKey(),
  flow_id: uuid().notNull(),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  logicOperator: varchar(),
  conditions: jsonb().$type<IfCondition[]>().default([]),
  ...timestamps,
});

export type SelectIfNode = typeof ifNodes.$inferSelect;
export type InsertIfNode = typeof ifNodes.$inferInsert;
