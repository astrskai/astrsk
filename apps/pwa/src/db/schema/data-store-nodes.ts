import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { DataStoreField } from "@/entities/flow/domain/flow";
import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { flows } from "@/db/schema/flows";

export const dataStoresNodes = pgTable(TableName.DataStoreNodes, {
  id: uuid().primaryKey(),
  flow_id: uuid()
    .notNull()
    .references(() => flows.id, {
      onDelete: "cascade", // Auto-delete when flow is deleted
    }),
  name: varchar().notNull(),
  color: varchar().notNull().default("#3b82f6"),
  data_store_fields: jsonb().$type<DataStoreField[]>().default([]),
   ...timestamps,
});

export type SelectDataStoreNode = typeof dataStoresNodes.$inferSelect;
export type InsertDataStoreNode = typeof dataStoresNodes.$inferInsert;
