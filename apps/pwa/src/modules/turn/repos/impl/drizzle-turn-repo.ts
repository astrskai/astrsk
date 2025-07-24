import { asc, eq, gt, inArray } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { TableName } from "@/db/schema/table-name";
import { turns } from "@/db/schema/turns";
import { Transaction } from "@/db/transaction";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";
import { Turn } from "@/modules/turn/domain/turn";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";
import { DeleteTurnRepo } from "@/modules/turn/repos/delete-turn-repo";
import { LoadTurnRepo } from "@/modules/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/modules/turn/repos/save-turn-repo";

export class DrizzleTurnRepo
  implements SaveTurnRepo, LoadTurnRepo, DeleteTurnRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveTurn(turn: Turn, tx?: Transaction): Promise<Result<Turn>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = TurnDrizzleMapper.toPersistence(turn);

      // Insert or update turn
      const savedRow = await db
        .insert(turns)
        .values(row)
        .onConflictDoUpdate({
          target: turns.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Turns,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved turn
      return Result.ok(TurnDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return Result.fail("Failed to save turn");
    }
  }

  async listTurns(
    { cursor, pageSize = 100 }: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<Turn[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select turns
      const rows = await db
        .select()
        .from(turns)
        .where(cursor ? gt(turns.id, cursor.toString()) : undefined)
        .limit(pageSize)
        .orderBy(asc(turns.id));

      // Return turns
      return Result.ok(rows.map((row) => TurnDrizzleMapper.toDomain(row)));
    } catch (error) {
      return Result.fail("Failed to list turns");
    }
  }

  async getTurnById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Turn>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select turn by id
      const row = await db
        .select()
        .from(turns)
        .where(eq(turns.id, id.toString()))
        .then(getOneOrThrow);

      // Return turn
      return Result.ok(TurnDrizzleMapper.toDomain(row));
    } catch (error) {
      return Result.fail("Failed to get turn by id");
    }
  }

  async deleteTurnById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete turn by id
      await db.delete(turns).where(eq(turns.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Turns,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok();
    } catch (error) {
      return Result.fail("Failed to delete turn by id");
    }
  }

  async bulkDeleteTurnByIds(
    ids: UniqueEntityID[],
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete turns by ids
      await db.delete(turns).where(
        inArray(
          turns.id,
          ids.map((id) => id.toString()),
        ),
      );

      // Update local sync metadata
      // for (const id of ids) {
      //   await this.updateLocalSyncMetadata.execute({
      //     tableName: TableName.Turns,
      //     entityId: id,
      //     updatedAt: null,
      //   });
      // }

      // Return result
      return Result.ok();
    } catch (error) {
      return Result.fail("Failed to bulk delete turns");
    }
  }
}
