import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/modules/card/domain/lorebook";

export const plotCards = pgTable(TableName.PlotCards, {
  id: uuid().primaryKey(),
  description: text(),
  scenarios: jsonb().$type<{ name: string; description: string }[]>(),
  lorebook: jsonb().$type<LorebookJSON>(),
  ...timestamps,
});

export type SelectPlotCard = typeof plotCards.$inferSelect;
export type InsertPlotCard = typeof plotCards.$inferInsert;
