import { TableName } from "@/schema/table-name";
import { timestamps } from "@/types/timestamps";
import type {
  ConversationHistoryEntry,
  PersistedAIResults,
  PersistedMessage,
  ResourceSnapshot,
} from "@astrsk/shared/types";
import type {
  SessionStatus,
  StructuredChange,
} from "@astrsk/shared/vibe-shared-types";
import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const vibeSessions = pgTable(
  TableName.VibeSessions,
  {
    id: uuid().primaryKey(),
    session_id: varchar().notNull().unique(), // The actual session ID used by the vibe system
    resource_id: varchar().notNull(), // ID of the card or flow this session belongs to
    resource_type: varchar()
      .$type<"character_card" | "plot_card" | "flow">()
      .notNull(),

    // Session Data
    messages: jsonb().$type<PersistedMessage[]>().default([]).notNull(),
    applied_changes: jsonb().$type<StructuredChange[]>().default([]).notNull(),
    ai_results: jsonb().$type<PersistedAIResults>(),
    conversation_history: jsonb()
      .$type<ConversationHistoryEntry[]>()
      .default([])
      .notNull(),

    // Resource Snapshots - Store up to 5 latest snapshots for rollback
    snapshots: jsonb().$type<ResourceSnapshot[]>().default([]).notNull(),

    // Session State
    status: varchar().$type<SessionStatus>().notNull(),
    version: integer().default(1).notNull(),

    // Timestamps
    ...timestamps,
    last_active_at: text().notNull(), // ISO string timestamp
  },
  (table) => ({
    // Ensure only one session per resource
    uniqueResourceSession: uniqueIndex("unique_resource_session").on(
      table.resource_id,
      table.resource_type
    ),
  })
);

export type SelectVibeSession = typeof vibeSessions.$inferSelect;
export type InsertVibeSession = typeof vibeSessions.$inferInsert;
