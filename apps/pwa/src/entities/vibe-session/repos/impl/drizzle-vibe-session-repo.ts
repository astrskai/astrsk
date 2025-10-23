import { and, eq, lt, sql, desc } from "drizzle-orm";

import { Result } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { vibeSessions, InsertVibeSession } from "@/db/schema/vibe-sessions";
import { Transaction } from "@/db/transaction";
import { VibeSession } from "@/entities/vibe-session/domain";
import { VibeSessionRepository } from "@/entities/vibe-session/repos/vibe-session-repo";

/**
 * Drizzle implementation of the VibeSession repository
 * 
 * Handles persistence operations for vibe sessions using Drizzle ORM,
 * including JSON serialization/deserialization and proper error handling.
 */
export class DrizzleVibeSessionRepo implements VibeSessionRepository {
  
  async save(session: VibeSession, tx?: Transaction): Promise<Result<VibeSession>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert domain object to database row
      const sessionData = session.toJSON();
      
      // Check if session already exists for this resource
      const existingResult = await this.findByResourceId(
        sessionData.resourceId,
        sessionData.resourceType,
        tx
      );
      
      if (existingResult.isFailure) {
        return Result.fail(existingResult.getError());
      }

      const existingSession = existingResult.getValue();
      
      if (existingSession) {
        // UPDATE existing session - preserve the database ID
        const existingSessionData = existingSession.toJSON();
        const updateData = {
          session_id: sessionData.sessionId,
          messages: sessionData.messages,
          applied_changes: sessionData.appliedChanges,
          ai_results: sessionData.aiResults || null,
          conversation_history: sessionData.conversationHistory,
          status: sessionData.status,
          version: sessionData.version || 1,
          updated_at: new Date(),
          last_active_at: sessionData.lastActiveAt,
          snapshots: sessionData.snapshots, // Update snapshots
        };

        const updatedRows = await db
          .update(vibeSessions)
          .set(updateData)
          .where(
            and(
              eq(vibeSessions.resource_id, sessionData.resourceId),
              eq(vibeSessions.resource_type, sessionData.resourceType as 'character_card' | 'plot_card' | 'flow')
            )
          )
          .returning()
          .then(rows => rows.length > 0 ? rows[0] : null);

        if (!updatedRows) {
          return Result.fail("Failed to update existing session");
        }

        // Convert back to domain object
        const domainResult = this.toDomain(updatedRows);
        if (domainResult.isFailure) {
          return domainResult;
        }

        return Result.ok(domainResult.getValue());
      } else {
        // INSERT new session
        const row: InsertVibeSession = {
          id: crypto.randomUUID(),
          session_id: sessionData.sessionId,
          resource_id: sessionData.resourceId,
          resource_type: sessionData.resourceType,
          messages: sessionData.messages,
          applied_changes: sessionData.appliedChanges,
          ai_results: sessionData.aiResults || null,
          conversation_history: sessionData.conversationHistory,
          status: sessionData.status,
          version: sessionData.version || 1,
          created_at: new Date(sessionData.createdAt),
          updated_at: new Date(),
          last_active_at: sessionData.lastActiveAt,
          snapshots: sessionData.snapshots,
        };

        const savedRow = await db
          .insert(vibeSessions)
          .values(row)
          .returning()
          .then(getOneOrThrow);

        // Convert back to domain object
        const domainResult = this.toDomain(savedRow);
        if (domainResult.isFailure) {
          return domainResult;
        }

        return Result.ok(domainResult.getValue());
      }
    } catch (error) {
      return formatFail("Failed to save vibe session", error);
    }
  }

  async findById(id: string, tx?: Transaction): Promise<Result<VibeSession | null>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(vibeSessions)
        .where(eq(vibeSessions.id, id))
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      const domainResult = this.toDomain(rows[0]);
      if (domainResult.isFailure) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return formatFail("Failed to find vibe session by id", error);
    }
  }

  async findByResourceId(
    resourceId: string,
    resourceType: string,
    tx?: Transaction
  ): Promise<Result<VibeSession | null>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(vibeSessions)
        .where(
          and(
            eq(vibeSessions.resource_id, resourceId),
            eq(vibeSessions.resource_type, resourceType as 'character_card' | 'plot_card' | 'flow')
          )
        )
        .orderBy(desc(vibeSessions.updated_at))
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      const domainResult = this.toDomain(rows[0]);
      if (domainResult.isFailure) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return formatFail("Failed to find vibe session by resource", error);
    }
  }

  async findBySessionId(sessionId: string, tx?: Transaction): Promise<Result<VibeSession | null>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const rows = await db
        .select()
        .from(vibeSessions)
        .where(eq(vibeSessions.session_id, sessionId))
        .limit(1);

      if (rows.length === 0) {
        return Result.ok(null);
      }

      const domainResult = this.toDomain(rows[0]);
      if (domainResult.isFailure) {
        return Result.fail(domainResult.getError());
      }

      return Result.ok(domainResult.getValue());
    } catch (error) {
      return formatFail("Failed to find vibe session by session id", error);
    }
  }

  async delete(id: string, tx?: Transaction): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .delete(vibeSessions)
        .where(eq(vibeSessions.id, id));

      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete vibe session", error);
    }
  }

  /**
   * Delete a vibe session by its session ID (convenience method for service layer)
   * @param sessionId - The session ID of the vibe session to delete
   * @param tx - Optional database transaction
   */
  async deleteBySessionId(sessionId: string, tx?: Transaction): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .delete(vibeSessions)
        .where(eq(vibeSessions.session_id, sessionId));

      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete vibe session by session ID", error);
    }
  }

  async findStale(thresholdHours: number, tx?: Transaction): Promise<Result<VibeSession[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Calculate threshold timestamp
      const thresholdDate = new Date(Date.now() - (thresholdHours * 60 * 60 * 1000));
      const thresholdIso = thresholdDate.toISOString();

      const rows = await db
        .select()
        .from(vibeSessions)
        .where(lt(vibeSessions.last_active_at, thresholdIso));

      // Convert all rows to domain objects
      const sessions: VibeSession[] = [];
      for (const row of rows) {
        const domainResult = this.toDomain(row);
        if (domainResult.isFailure) {
          return Result.fail(`Failed to convert session to domain: ${domainResult.getError()}`);
        }
        sessions.push(domainResult.getValue());
      }

      return Result.ok(sessions);
    } catch (error) {
      return formatFail("Failed to find stale vibe sessions", error);
    }
  }

  /**
   * Delete ALL vibe sessions for a specific resource (for clearing resource sessions)
   * @param resourceId - The ID of the resource
   * @param resourceType - The type of resource
   * @param tx - Optional database transaction
   */
  async deleteByResourceId(resourceId: string, resourceType: string, tx?: Transaction): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      await db
        .delete(vibeSessions)
        .where(
          and(
            eq(vibeSessions.resource_id, resourceId),
            eq(vibeSessions.resource_type, resourceType as 'character_card' | 'plot_card' | 'flow')
          )
        );

      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete vibe sessions by resource ID", error);
    }
  }

  /**
   * Convert database row to domain object
   * @private
   */
  private toDomain(row: typeof vibeSessions.$inferSelect): Result<VibeSession> {
    try {
      // Prepare JSON data for domain object creation
      const jsonData = {
        sessionId: row.session_id,
        resourceId: row.resource_id,
        resourceType: row.resource_type,
        messages: row.messages || [],
        appliedChanges: row.applied_changes || [],
        aiResults: row.ai_results || undefined,
        conversationHistory: row.conversation_history || [],
        snapshots: row.snapshots || [],
        status: row.status,
        createdAt: row.created_at.toISOString(),
        lastActiveAt: row.last_active_at,
        version: row.version || 1,
      };

      // Use domain object's fromJSON method
      return VibeSession.fromJSON(jsonData);
    } catch (error) {
      return Result.fail(`Failed to convert database row to domain object: ${error}`);
    }
  }
}