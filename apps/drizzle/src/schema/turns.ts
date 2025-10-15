import { jsonb, pgTable, smallint, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import { OptionJSON } from "@astrsk/shared/types";

export const turns = pgTable(TableName.Turns, {
  id: uuid().primaryKey(),
  session_id: uuid().notNull(),
  character_card_id: uuid(),
  character_name: varchar(),
  options: jsonb().$type<OptionJSON[]>().notNull(),
  selected_option_index: smallint().notNull(),
  ...timestamps,
});

export type SelectTurn = typeof turns.$inferSelect;
export type InsertTurn = typeof turns.$inferInsert;
