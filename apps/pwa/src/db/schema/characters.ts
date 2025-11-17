import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";

export const characters = pgTable(TableName.Characters, {
  id: uuid().primaryKey(),

  // Common fields (previously in cards table)
  title: varchar().notNull(),
  icon_asset_id: uuid(),
  tags: text().array().notNull().default(sql`'{}'`),
  creator: varchar(),
  card_summary: text(),
  version: varchar(),
  conceptual_origin: varchar(),
  vibe_session_id: uuid(), // Reference to active vibe session
  image_prompt: text(), // Prompt for image generation

  // Character-specific fields (previously in character_cards table)
  name: varchar().notNull(),
  description: text(),
  example_dialogue: text(),
  lorebook: jsonb().$type<LorebookJSON>(),

  ...timestamps,
});

export type SelectCharacter = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;
