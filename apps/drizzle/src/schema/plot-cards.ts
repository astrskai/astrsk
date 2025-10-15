import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import { LorebookJSON } from "@astrsk/shared/types";

export const plotCards = pgTable(TableName.PlotCards, {
  id: uuid().primaryKey(),
  description: text(),
  scenarios: jsonb().$type<{ name: string; description: string }[]>(),
  lorebook: jsonb().$type<LorebookJSON>(),
  ...timestamps,
});

export type SelectPlotCard = typeof plotCards.$inferSelect;
export type InsertPlotCard = typeof plotCards.$inferInsert;
