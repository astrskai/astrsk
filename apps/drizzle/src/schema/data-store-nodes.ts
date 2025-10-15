import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import { DataStoreField } from "@astrsk/shared/types";
import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const dataStoresNodes = pgTable(TableName.DataStoreNodes, {
  id: uuid().primaryKey(),
  flow_id: uuid().notNull(),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  data_store_fields: jsonb().$type<DataStoreField[]>().default([]),
   ...timestamps,
});

export type SelectDataStoreNode = typeof dataStoresNodes.$inferSelect;
export type InsertDataStoreNode = typeof dataStoresNodes.$inferInsert;
