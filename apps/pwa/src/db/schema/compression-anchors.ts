import {
  pgTable,
  text,
  uuid,
  varchar,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { TableName } from "./table-name";
import { timestamps } from "@/db/types/timestamps";

/**
 * Denormalized anchor storage for O(1) lookups
 *
 * Purpose: Fast retrieval/decompression without loading full Turn objects
 * Source of truth: Turn.options[0].compressionSegments
 * This table: Performance index (duplicated data for speed)
 *
 * Lifecycle: Created/deleted alongside turns (foreign key cascade on turn_id)
 */
export const compressionAnchors = pgTable(
  TableName.CompressionAnchors,
  {
    // Composite primary key (session_id + anchor)
    session_id: uuid().notNull(),
    anchor: varchar().notNull(),

    // Anchor data (denormalized from Turn.options)
    text: text().notNull(),
    accessible_to: text().array().notNull(),
    starting_text: varchar().notNull(),

    // Metadata (indexed for fast character-specific queries)
    character_name: varchar(),
    turn_id: uuid().notNull(),

    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.session_id, table.anchor] }),
    idx_session_character: index("idx_compression_session_character").on(
      table.session_id,
      table.character_name
    ),
  })
);

export type SelectCompressionAnchor = typeof compressionAnchors.$inferSelect;
export type InsertCompressionAnchor = typeof compressionAnchors.$inferInsert;
