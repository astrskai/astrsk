import { eq, and, inArray } from "drizzle-orm";

import { Drizzle } from "@/db/drizzle";
import { compressionAnchors, type InsertCompressionAnchor, type SelectCompressionAnchor } from "@/db/schema/compression-anchors";
import { Transaction } from "@/db/transaction";
import type { AnchorData } from "@/entities/compression/domain/types";

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
   * Optimized batch query using IN clause
   */
  async findAnchorsByNames(
    sessionId: string,
    anchorNames: string[],
    tx?: Transaction
  ): Promise<Record<string, AnchorData>> {
    if (anchorNames.length === 0) return {};

    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(compressionAnchors)
        .where(
          and(
            eq(compressionAnchors.session_id, sessionId),
            inArray(compressionAnchors.anchor, anchorNames)
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
   */
  async deleteAnchorsByTurnId(
    turnId: string,
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .delete(compressionAnchors)
        .where(eq(compressionAnchors.turn_id, turnId));
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
