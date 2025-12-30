import { eq, and, inArray, asc } from "drizzle-orm";

import { Drizzle } from "@/db/drizzle";
import { compressionAnchors, type InsertCompressionAnchor, type SelectCompressionAnchor } from "@/db/schema/compression-anchors";
import { turns } from "@/db/schema/turns";
import { Transaction } from "@/db/transaction";
import type { AnchorData } from "@/entities/compression/domain/types";
import { compressionApi } from "@/entities/compression/api";

/**
 * Repository for compression anchor operations
 * Provides O(1) lookups via primary key (session_id, anchor)
 */
export class CompressionAnchorRepo {
  /**
   * Find a single anchor by name within a session
   * O(1) lookup using primary key index
   */
  async findAnchorByName(
    sessionId: string,
    anchorName: string,
    tx?: Transaction
  ): Promise<AnchorData | null> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const result = await db
        .select()
        .from(compressionAnchors)
        .where(
          and(
            eq(compressionAnchors.session_id, sessionId),
            eq(compressionAnchors.anchor, anchorName)
          )
        )
        .limit(1);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        text: row.text,
        accessible_to: row.accessible_to,
        starting_text: row.starting_text,
      };
    } catch (error) {
      console.error("[CompressionAnchorRepo] findAnchorByName failed:", error);
      return null;
    }
  }

  /**
   * Find multiple anchors by names within a session
   * Returns all instances of each anchor, ordered by turn (turns.created_at)
   *
   * Returns a Map where each anchor name maps to an array of instances in turn order
   */
  async findAnchorsByNames(
    sessionId: string,
    anchorNames: string[],
    tx?: Transaction
  ): Promise<Record<string, AnchorData[]>> {
    if (anchorNames.length === 0) return {};

    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Join with turns table to get proper turn ordering
      const rows = await db
        .select({
          anchor: compressionAnchors.anchor,
          text: compressionAnchors.text,
          accessible_to: compressionAnchors.accessible_to,
          starting_text: compressionAnchors.starting_text,
          turn_created_at: turns.created_at,
        })
        .from(compressionAnchors)
        .innerJoin(turns, eq(compressionAnchors.turn_id, turns.id))
        .where(
          and(
            eq(compressionAnchors.session_id, sessionId),
            inArray(compressionAnchors.anchor, anchorNames)
          )
        )
        .orderBy(asc(turns.created_at)); // Order by turn creation time (session order)

      const result: Record<string, AnchorData[]> = {};
      for (const row of rows) {
        if (!result[row.anchor]) {
          result[row.anchor] = [];
        }
        result[row.anchor].push({
          text: row.text,
          accessible_to: row.accessible_to,
          starting_text: row.starting_text,
        });
      }

      return result;
    } catch (error) {
      console.error("[CompressionAnchorRepo] findAnchorsByNames failed:", error);
      return {};
    }
  }

  /**
   * Find all anchors for a specific character within a session
   * Uses composite index (session_id, character_name)
   */
  async findAnchorsByCharacter(
    sessionId: string,
    characterName: string,
    tx?: Transaction
  ): Promise<Record<string, AnchorData>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(compressionAnchors)
        .where(
          and(
            eq(compressionAnchors.session_id, sessionId),
            eq(compressionAnchors.character_name, characterName)
          )
        );

      const result: Record<string, AnchorData> = {};
      for (const row of rows) {
        result[row.anchor] = {
          text: row.text,
          accessible_to: row.accessible_to,
          starting_text: row.starting_text,
        };
      }

      return result;
    } catch (error) {
      console.error(
        "[CompressionAnchorRepo] findAnchorsByCharacter failed:",
        error
      );
      return {};
    }
  }

  /**
   * Find all anchors for a session
   * Used to build compressed XML context
   */
  async findAnchorsBySessionId(
    sessionId: string,
    tx?: Transaction
  ): Promise<SelectCompressionAnchor[]> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(compressionAnchors)
        .where(eq(compressionAnchors.session_id, sessionId));

      return rows;
    } catch (error) {
      console.error(
        "[CompressionAnchorRepo] findAnchorsBySessionId failed:",
        error
      );
      return [];
    }
  }

  /**
   * Save a single anchor (denormalized from Turn.options)
   * Called when a turn is created with compression data
   */
  async saveAnchor(
    anchor: InsertCompressionAnchor,
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .insert(compressionAnchors)
        .values(anchor)
        .onConflictDoUpdate({
          target: [compressionAnchors.session_id, compressionAnchors.anchor],
          set: {
            text: anchor.text,
            accessible_to: anchor.accessible_to,
            starting_text: anchor.starting_text,
            character_name: anchor.character_name,
            turn_id: anchor.turn_id,
            updated_at: new Date(),
          },
        });
    } catch (error) {
      console.error("[CompressionAnchorRepo] saveAnchor failed:", error);
      throw error;
    }
  }

  /**
   * Save multiple anchors in a batch
   * More efficient than multiple saveAnchor() calls
   */
  async saveAnchors(
    anchors: InsertCompressionAnchor[],
    tx?: Transaction
  ): Promise<void> {
    if (anchors.length === 0) return;

    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db.insert(compressionAnchors).values(anchors).onConflictDoNothing();
    } catch (error) {
      console.error("[CompressionAnchorRepo] saveAnchors failed:", error);
      throw error;
    }
  }

  /**
   * Delete all anchors for a specific turn
   * Called when a turn is deleted (cleanup)
   * Also deletes anchors from Redis backend for BM25 search
   */
  async deleteAnchorsByTurnId(
    turnId: string,
    sessionId: string,
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete from PGlite (local storage)
      await db
        .delete(compressionAnchors)
        .where(eq(compressionAnchors.turn_id, turnId));

      // Delete from Redis backend (BM25 search)
      try {
        await compressionApi.deleteAnchors({
          sessionId,
          turnId,
        });
        console.log(
          `[CompressionAnchorRepo] Deleted anchors from Redis for turn ${turnId}`
        );
      } catch (error) {
        // Log but don't fail - backend might be unavailable or anchors might not exist
        console.warn(
          "[CompressionAnchorRepo] Failed to delete anchors from Redis backend:",
          error
        );
      }
    } catch (error) {
      console.error(
        "[CompressionAnchorRepo] deleteAnchorsByTurnId failed:",
        error
      );
      throw error;
    }
  }

  /**
   * Delete all anchors for a session
   * Called when a session is deleted (cleanup)
   */
  async deleteAnchorsBySessionId(
    sessionId: string,
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .delete(compressionAnchors)
        .where(eq(compressionAnchors.session_id, sessionId));
    } catch (error) {
      console.error(
        "[CompressionAnchorRepo] deleteAnchorsBySessionId failed:",
        error
      );
      throw error;
    }
  }
}
