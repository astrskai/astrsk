import { timestamp } from "drizzle-orm/pg-core/columns/timestamp";

export const timestamps = {
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};
