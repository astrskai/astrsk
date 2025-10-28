import { and, asc, eq, gt, ilike, or, SQL } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { apiConnections } from "@/db/schema/api-connections";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { ApiConnection } from "@/entities/api/domain";
import { ApiConnectionDrizzleMapper } from "@/entities/api/mappers/api-connection-drizzle-mapper";
import { DeleteApiConnectionRepo } from "@/entities/api/repos/delete-api-connection-repo";
import {
  ListApiConnectionQuery,
  LoadApiConnectionRepo,
} from "@/entities/api/repos/load-api-connection-repo";
import { SaveApiConnectionRepo } from "@/entities/api/repos/save-api-connection-repo";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleApiConnectionRepo
  implements
    SaveApiConnectionRepo,
    LoadApiConnectionRepo,
    DeleteApiConnectionRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveApiConnection(
    apiConnection: ApiConnection,
    tx?: Transaction,
  ): Promise<Result<ApiConnection>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = ApiConnectionDrizzleMapper.toPersistence(apiConnection);

      // Insert API connection
      const savedRow = await db
        .insert(apiConnections)
        .values(row)
        .onConflictDoUpdate({
          target: apiConnections.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.ApiConnections,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved API connection
      return Result.ok(ApiConnectionDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return formatFail("Failed to save API connection", error);
    }
  }

  async listApiConnections(
    { cursor, pageSize = 100 }: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<ApiConnection[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select API connections
      const rows = await db
        .select()
        .from(apiConnections)
        .where(cursor ? gt(apiConnections.id, cursor.toString()) : undefined)
        .limit(pageSize)
        .orderBy(asc(apiConnections.id));

      // Return API connections
      return Result.ok(rows.map(ApiConnectionDrizzleMapper.toDomain));
    } catch (error) {
      return formatFail("Failed to list API connections", error);
    }
  }

  async getApiConnectionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<ApiConnection>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select API connection by id
      const row = await db
        .select()
        .from(apiConnections)
        .where(eq(apiConnections.id, id.toString()))
        .then(getOneOrThrow);

      // Return API connection
      return Result.ok(ApiConnectionDrizzleMapper.toDomain(row));
    } catch (error) {
      return formatFail("Failed to get API connection", error);
    }
  }

  async getApiConnections(
    query: ListApiConnectionQuery,
    tx?: Transaction,
  ): Promise<Result<ApiConnection[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Make filters
      let whereClause;
      if (query.keyword) {
        whereClause = or(
          ilike(apiConnections.title, `%${query.keyword}%`),
          ilike(apiConnections.source, `%${query.keyword}%`),
          ilike(apiConnections.base_url, `%${query.keyword}%`),
        );
      }

      // Select API connections
      const rows = await db
        .select()
        .from(apiConnections)
        .where(whereClause)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(asc(apiConnections.id));

      // Convert rows to entities
      const entities = rows.map((row) =>
        ApiConnectionDrizzleMapper.toDomain(row),
      );

      // Return API connections
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to get API connections", error);
    }
  }

  async deleteApiConnectionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete API connection by id
      await db
        .delete(apiConnections)
        .where(eq(apiConnections.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.ApiConnections,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete API connection", error);
    }
  }
}
