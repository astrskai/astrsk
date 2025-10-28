import { asc, desc, eq, gt } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { backgrounds } from "@/db/schema/backgrounds";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Background } from "@/entities/background/domain";
import { BackgroundDrizzleMapper } from "@/entities/background/mappers/background-drizzle-mapper";
import { DeleteBackgroundRepo } from "@/entities/background/repos/delete-background-repo";
import {
  ListBackgroundQuery,
  LoadBackgroundRepo,
} from "@/entities/background/repos/load-background-repo";
import { SaveBackgroundRepo } from "@/entities/background/repos/save-background-repo";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleBackgroundRepo
  implements SaveBackgroundRepo, LoadBackgroundRepo, DeleteBackgroundRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveBackground(
    background: Background,
    tx?: Transaction,
  ): Promise<Result<Background>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = BackgroundDrizzleMapper.toPersistence(background);

      // Insert background
      const savedRow = await db
        .insert(backgrounds)
        .values(row)
        .onConflictDoUpdate({
          target: backgrounds.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Backgrounds,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved background
      return Result.ok(BackgroundDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return formatFail("Failed to save Background", error);
    }
  }

  async listBackgrounds(
    { cursor, pageSize = 100 }: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<Background[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select backgrounds
      const rows = await db
        .select()
        .from(backgrounds)
        .where(cursor ? gt(backgrounds.id, cursor.toString()) : undefined)
        .limit(pageSize)
        .orderBy(asc(backgrounds.id));

      // Return backgrounds
      return Result.ok(
        rows.map((row) => BackgroundDrizzleMapper.toDomain(row)),
      );
    } catch (error) {
      return formatFail("Failed to list Backgrounds", error);
    }
  }

  async getBackgroundById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Background>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select background by id
      const row = await db
        .select()
        .from(backgrounds)
        .where(eq(backgrounds.id, id.toString()))
        .then(getOneOrThrow);

      // Return Background
      return Result.ok(BackgroundDrizzleMapper.toDomain(row));
    } catch (error) {
      return formatFail("Failed to get Background", error);
    }
  }

  async getBackgrounds(
    query: ListBackgroundQuery,
    tx?: Transaction,
  ): Promise<Result<Background[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select backgrounds
      const rows = await db
        .select()
        .from(backgrounds)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(desc(backgrounds.id));

      // Convert rows to entities
      const entities = rows.map((row) => BackgroundDrizzleMapper.toDomain(row));

      // Return backgrounds
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to get Backgrounds", error);
    }
  }

  async deleteBackgroundById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Background>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete background by id
      const deletedRow = await db
        .delete(backgrounds)
        .where(eq(backgrounds.id, id.toString()))
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Backgrounds,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok(BackgroundDrizzleMapper.toDomain(deletedRow));
    } catch (error) {
      return formatFail("Failed to delete Background", error);
    }
  }
}
