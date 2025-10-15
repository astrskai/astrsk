import {
  jsonb,
  pgTable,
  text,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import {
  InsertCharacterCard,
  SelectCharacterCard,
} from "@/schema/character-cards";
import { InsertPlotCard, SelectPlotCard } from "@/schema/plot-cards";
import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";

export const cards = pgTable(TableName.Cards, {
  id: uuid().primaryKey(),
  title: varchar().notNull(),
  icon_asset_id: uuid(),
  type: varchar().notNull(),
  tags: jsonb().$type<string[]>().default([]).notNull(),
  creator: varchar(),
  card_summary: text(),
  version: varchar(),
  conceptual_origin: varchar(),
  vibe_session_id: uuid(), // Reference to active vibe session
  image_prompt: text(), // Prompt for image generation
  ...timestamps,
});

export type SelectCommonCard = typeof cards.$inferSelect;
export type InsertCommonCard = typeof cards.$inferInsert;

export type SelectCard = {
  common: SelectCommonCard;
  character?: SelectCharacterCard;
  plot?: SelectPlotCard;
};
export type InsertCard = {
  common: InsertCommonCard;
  character?: InsertCharacterCard;
  plot?: InsertPlotCard;
};
