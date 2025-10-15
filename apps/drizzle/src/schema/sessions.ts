import { jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import {
  CardListItemJson,
  ChatStyles,
  TranslationConfigJSON,
} from "@astrsk/shared/types";

export const AutoReply = {
  Off: "off",
  Random: "random",
  Rotate: "rotate",
} as const;

export type AutoReply = (typeof AutoReply)[keyof typeof AutoReply];

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
