import { and, desc, eq, gt, ilike, sql } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { sessions } from "@/db/schema/sessions";
import { Transaction } from "@/db/transaction";
import { Session } from "@/entities/session/domain";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { DeleteSessionRepo } from "@/entities/session/repos/delete-session-repo";
import {
  GetSessionsQuery,
  LoadSessionRepo,
  SearchSessionsQuery,
} from "@/entities/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/entities/session/repos/save-session-repo";
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

      // Insert or update session
      const savedRow = await db
        .insert(sessions)
        .values(row)
        .onConflictDoUpdate({
          target: sessions.id,
          set: row,
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
    { cursor, pageSize = 100, keyword }: SearchSessionsQuery,
    tx?: Transaction,
  ): Promise<Result<Session[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Search sessions
      const filters = [];
      if (keyword) {
        filters.push(ilike(sessions.title, `%${keyword}%`));
      }
      if (cursor) {
        filters.push(gt(sessions.id, cursor.toString()));
      }
      const rows = await db
        .select()
        .from(sessions)
        .where(and(...filters))
        .limit(pageSize)
        .orderBy(desc(sessions.id));

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
      // Delete session by id
      await db.delete(sessions).where(eq(sessions.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Sessions,
      //   entityId: id,
      //   updatedAt: null,
      // });

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
}
