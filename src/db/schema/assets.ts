import { integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";

export const assets = pgTable(TableName.Assets, {
  id: uuid().primaryKey(),
  hash: varchar().notNull(),
  name: varchar().notNull(),
  size_byte: integer().notNull(),
  mime_type: varchar().notNull(),
  file_path: varchar().notNull(),
  ...timestamps,
});

export type SelectAsset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
