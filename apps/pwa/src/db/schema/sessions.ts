import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { AutoReply } from "@/app/stores/session-store";
import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { TranslationConfigJSON } from "@/entities/session/domain/translation-config";
import { CardListItemJson } from "@/entities/session/mappers/session-drizzle-mapper";

export const sessions = pgTable(TableName.Sessions, {
  id: uuid().primaryKey(),
  title: varchar().notNull(),
  all_cards: jsonb().$type<CardListItemJson[]>().notNull(),
  user_character_card_id: uuid(),
  turn_ids: jsonb().$type<string[]>().notNull(),
  background_id: uuid(),
  translation: jsonb().$type<TranslationConfigJSON>(),
  chat_styles: jsonb().$type<ChatStyles>(),
  flow_id: uuid().notNull(),
  auto_reply: varchar().$type<AutoReply>().notNull().default(AutoReply.Off),
  data_schema_order: jsonb().$type<string[]>().notNull().default([]),
  ...timestamps,
});

export type SelectSession = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
