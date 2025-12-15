import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { sessions } from "@/db/schema/sessions";

export const backgrounds = pgTable(TableName.Backgrounds, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  asset_id: uuid().notNull(),
  session_id: uuid()
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  ...timestamps,
});

export type SelectBackground = typeof backgrounds.$inferSelect;
export type InsertBackground = typeof backgrounds.$inferInsert;
