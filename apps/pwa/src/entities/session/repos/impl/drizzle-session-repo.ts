import { and, desc, eq, gt, ilike, inArray, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { sessions } from "@/db/schema/sessions";
import { characters } from "@/db/schema/characters";
import { scenarios } from "@/db/schema/scenarios";
import { backgrounds } from "@/db/schema/backgrounds";
import { generatedImages } from "@/db/schema/generated-images";
import { assets } from "@/db/schema/assets";
import { Transaction } from "@/db/transaction";
import { Session } from "@/entities/session/domain";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { DeleteSessionRepo } from "@/entities/session/repos/delete-session-repo";
import {
  GetSessionsQuery,
  LoadSessionRepo,
  SearchSessionsQuery,
  SessionListItem,
} from "@/entities/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/entities/session/repos/save-session-repo";
import { SORT_VALUES } from "@/shared/config/sort-options";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleSessionRepo
  implements SaveSessionRepo, LoadSessionRepo, DeleteSessionRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveSession(
    session: Session,
    tx?: Transaction,
  ): Promise<Result<Session>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = SessionDrizzleMapper.toPersistence(session);

      // Exclude created_at from update to preserve original timestamp
      const { created_at, ...rowWithoutCreatedAt } = row;

      // Insert or update session
      const savedRow = await db
        .insert(sessions)
        .values(row)
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            ...rowWithoutCreatedAt,
            updated_at: new Date(), // Update timestamp on conflict
          },
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Sessions,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved session
      return Result.ok(SessionDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return formatFail("Failed to save session", error);
    }
  }

  async searchSessions(
    { cursor, pageSize = 100, keyword, sort, isPlaySession }: SearchSessionsQuery,
    tx?: Transaction,
  ): Promise<Result<Session[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Search sessions
      const filters = [];
      if (keyword) {
        filters.push(ilike(sessions.name, `%${keyword}%`));
      }
      // Filter by play session if specified
      if (isPlaySession !== undefined) {
        filters.push(eq(sessions.is_play_session, isPlaySession));
      }
      // if (cursor) {
      //   filters.push(gt(sessions.id, cursor.toString()));
      // }

      // Make order by
      // For play sessions, sort by updated_at by default so most recently played appear first
      let orderBy: PgColumn | SQL;
      switch (sort) {
        case SORT_VALUES.LATEST:
          orderBy = desc(sessions.created_at);
          break;
        case SORT_VALUES.OLDEST:
          orderBy = sessions.created_at;
          break;
        case SORT_VALUES.TITLE_A_TO_Z: // Keep constant name for backward compatibility
          orderBy = sessions.name;
          break;
        case SORT_VALUES.TITLE_Z_TO_A: // Keep constant name for backward compatibility
          orderBy = desc(sessions.name);
          break;
        default:
          // For play sessions, default to updated_at; otherwise created_at
          orderBy = isPlaySession ? desc(sessions.updated_at) : desc(sessions.created_at);
          break;
      }

      const rows = await db
        .select()
        .from(sessions)
        .where(and(...filters))
        .limit(pageSize)
        .orderBy(orderBy);

      // Convert rows to entities
      const entities = rows.map((row) => SessionDrizzleMapper.toDomain(row));

      // Return sessions
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to list sessions", error);
    }
  }

  async getSessionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select session by id
      const row = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id.toString()))
        .then(getOneOrThrow);

      // Return session
      return Result.ok(SessionDrizzleMapper.toDomain(row));
    } catch (error) {
      return formatFail("Failed to get session by id", error);
    }
  }

  async getSessions(
    query: GetSessionsQuery,
    tx?: Transaction,
  ): Promise<Result<Session[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select sessions
      const rows = await db
        .select()
        .from(sessions)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0);

      // Convert rows to entities
      const entities = rows.map((row) => SessionDrizzleMapper.toDomain(row));

      // Return sessions
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to get sessions", error);
    }
  }

  async deleteSessionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const sessionId = id.toString();

      // Collect all asset IDs from session-local resources before cascade delete
      const assetIds: string[] = [];

      // Get asset IDs from session-local characters
      const characterAssets = await db
        .select({ iconAssetId: characters.icon_asset_id })
        .from(characters)
        .where(eq(characters.session_id, sessionId));
      characterAssets.forEach((c) => {
        if (c.iconAssetId) assetIds.push(c.iconAssetId);
      });

      // Get asset IDs from session-local scenarios
      const scenarioAssets = await db
        .select({ iconAssetId: scenarios.icon_asset_id })
        .from(scenarios)
        .where(eq(scenarios.session_id, sessionId));
      scenarioAssets.forEach((s) => {
        if (s.iconAssetId) assetIds.push(s.iconAssetId);
      });

      // Get asset IDs from session backgrounds
      const backgroundAssets = await db
        .select({ assetId: backgrounds.asset_id })
        .from(backgrounds)
        .where(eq(backgrounds.session_id, sessionId));
      backgroundAssets.forEach((b) => {
        if (b.assetId) assetIds.push(b.assetId);
      });

      // Get asset IDs from session-generated images
      const sessionGeneratedImages = await db
        .select({
          assetId: generatedImages.asset_id,
          thumbnailAssetId: generatedImages.thumbnail_asset_id,
        })
        .from(generatedImages)
        .where(eq(generatedImages.is_session_generated, true));
      // Note: We can't filter by session_id since generated_images doesn't have it
      // This gets ALL session-generated images - may need refinement

      // Delete session by id (CASCADE will delete characters, scenarios, flows, backgrounds)
      await db.delete(sessions).where(eq(sessions.id, sessionId));

      // Delete collected assets (after cascade delete removed the resources)
      if (assetIds.length > 0) {
        await db.delete(assets).where(inArray(assets.id, assetIds));
      }

      // Return result
      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete session by id", error);
    }
  }

  async getSessionsByCardId(
    cardId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select sessions by card id
      const rows = await db
        .select()
        .from(sessions)
        .where(
          sql.raw(
            `jsonb_path_exists(all_cards, '$[*] ? (@.id == "${cardId.toString()}")')`,
          ),
        );

      // Convert rows to entities
      const entities = rows.map((row) => SessionDrizzleMapper.toDomain(row));

      // Return sessions
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to get sessions by card id", error);
    }
  }

  async getSessionsByFlowId(
    flowId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Session[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select sessions by card id
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.flow_id, flowId.toString()));

      // Convert rows to entities
      const entities = rows.map((row) => SessionDrizzleMapper.toDomain(row));

      // Return sessions
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to get sessions by flow id", error);
    }
  }

  /**
   * Get lightweight session list items for sidebar
   * Only fetches id, title, message count (via jsonb_array_length), and updatedAt
   * Much more efficient than fetching full session data
   */
  async getSessionListItems(
    { isPlaySession, pageSize = 100 }: { isPlaySession?: boolean; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<SessionListItem[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const filters = [];
      if (isPlaySession !== undefined) {
        filters.push(eq(sessions.is_play_session, isPlaySession));
      }

      // Select only needed fields, use jsonb_array_length for message count
      const rows = await db
        .select({
          id: sessions.id,
          name: sessions.name,
          messageCount: sql<number>`jsonb_array_length(${sessions.turn_ids})`,
          updatedAt: sessions.updated_at,
        })
        .from(sessions)
        .where(and(...filters))
        .orderBy(isPlaySession ? desc(sessions.updated_at) : desc(sessions.created_at))
        .limit(pageSize);

      // Map to SessionListItem type
      const items: SessionListItem[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        messageCount: row.messageCount,
        updatedAt: new Date(row.updatedAt),
      }));

      return Result.ok(items);
    } catch (error) {
      return formatFail("Failed to get session list items", error);
    }
  }

  /**
   * Get session configs only (optimized for cleanup operations)
   *
   * Fetches only id and config fields from all sessions, avoiding the overhead
   * of loading complete session data. Used by cleanup utilities to detect
   * sessions with specific config states (e.g., generationStatus === "generating").
   *
   * @param tx - Optional transaction
   * @returns Result with array of { id, config } objects
   */
  async getSessionConfigs(
    tx?: Transaction,
  ): Promise<Result<Array<{ id: string; config: Record<string, unknown> }>>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only id and config fields for maximum efficiency
      const rows = await db
        .select({
          id: sessions.id,
          config: sessions.config,
        })
        .from(sessions);

      return Result.ok(rows);
    } catch (error) {
      return formatFail("Failed to get session configs", error);
    }
  }
}
