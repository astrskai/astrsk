import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";
import { sessions } from "@/db/schema/sessions";

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

  // Session-local resource support
  // NULL = global resource (shows in lists)
  // Non-NULL = local to specific session (hidden from global lists)
  session_id: uuid().references(() => sessions.id, {
    onDelete: "cascade", // Auto-delete when session is deleted
  }),

  ...timestamps,
});

export type SelectCharacter = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;
