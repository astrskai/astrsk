import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import { LorebookJSON } from "@astrsk/shared/types";

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
