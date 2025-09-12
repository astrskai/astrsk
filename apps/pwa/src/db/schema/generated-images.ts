import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";

export const generatedImages = pgTable(TableName.GeneratedImages, {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  asset_id: uuid().notNull(),
  prompt: text().notNull(),
  style: varchar(),
  aspect_ratio: varchar(),
  media_type: varchar(), // 'image' or 'video'
  thumbnail_asset_id: uuid(), // For video thumbnails
  associated_card_id: uuid(), // Optional association to a card
  ...timestamps,
});

export type SelectGeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;