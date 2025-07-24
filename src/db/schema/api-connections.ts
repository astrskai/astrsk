import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";

export const apiConnections = pgTable(TableName.ApiConnections, {
  id: uuid().primaryKey(),
  title: varchar().notNull(),
  source: varchar().notNull(),
  base_url: varchar(),
  api_key: varchar(),
  model_urls: jsonb().$type<string[]>(),
  openrouter_provider_sort: varchar(),
  ...timestamps,
});

export type SelectApiConnection = typeof apiConnections.$inferSelect;
export type InsertApiConnection = typeof apiConnections.$inferInsert;
