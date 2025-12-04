import { boolean, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { AutoReply } from "@/shared/stores/session-store";
import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { TranslationConfigJSON } from "@/entities/session/domain/translation-config";
import { CardListItemJson } from "@/entities/session/mappers/session-drizzle-mapper";

export const sessions = pgTable(TableName.Sessions, {
  id: uuid().primaryKey(),
  title: varchar().notNull(),

  // Metadata fields (similar to flows and characters)
  name: varchar(),
  tags: text().array().notNull().default(sql`'{}'`),
  summary: text(),

  all_cards: jsonb().$type<CardListItemJson[]>().notNull(),
  user_character_card_id: uuid(),
  turn_ids: jsonb().$type<string[]>().notNull(),
  background_id: uuid(),
  cover_id: uuid(),
  translation: jsonb().$type<TranslationConfigJSON>(),
  chat_styles: jsonb().$type<ChatStyles>(),
  flow_id: uuid(), // Nullable - session can exist without a flow (during import)
  auto_reply: varchar().$type<AutoReply>().notNull().default(AutoReply.Off),
  data_schema_order: jsonb().$type<string[]>().notNull().default([]),
  widget_layout: jsonb().$type<Array<{ i: string; x: number; y: number; w: number; h: number }>>(),
  is_play_session: boolean().notNull().default(false),
  config: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export type SelectSession = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
