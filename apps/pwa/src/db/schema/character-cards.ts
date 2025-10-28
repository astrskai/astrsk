import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";

export const characterCards = pgTable(TableName.CharacterCards, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  description: text(),
  example_dialogue: text(),
  lorebook: jsonb().$type<LorebookJSON>(),
  ...timestamps,
});

export type SelectCharacterCard = typeof characterCards.$inferSelect;
export type InsertCharacterCard = typeof characterCards.$inferInsert;
