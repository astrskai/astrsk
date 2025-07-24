import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";

export const backgrounds = pgTable(TableName.Backgrounds, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  asset_id: uuid().notNull(),
  ...timestamps,
});

export type SelectBackground = typeof backgrounds.$inferSelect;
export type InsertBackground = typeof backgrounds.$inferInsert;
