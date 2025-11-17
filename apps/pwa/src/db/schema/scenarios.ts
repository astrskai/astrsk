import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";

export const scenarios = pgTable(TableName.Scenarios, {
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

  // Scenario-specific fields (previously in plot_cards table)
  name: varchar().notNull(), // Scenario name (from plot card title)
  description: text(),
  first_messages: jsonb().$type<{ name: string; description: string }[]>(),
  lorebook: jsonb().$type<LorebookJSON>(),

  ...timestamps,
});

export type SelectScenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
