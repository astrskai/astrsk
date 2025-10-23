import { asc, eq, gt } from "drizzle-orm";

import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { formatFail } from "@/shared/lib/error-utils";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { assets } from "@/db/schema/assets";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Asset } from "@/modules/asset/domain/asset";
import { AssetDrizzleMapper } from "@/modules/asset/mappers/asset-drizzle-mapper";
import { DeleteAssetRepo } from "@/modules/asset/repos/delete-asset-repo";
import { LoadAssetRepo } from "@/modules/asset/repos/load-asset-repo";
import { SaveAssetRepo } from "@/modules/asset/repos/save-asset-repo";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class DrizzleAssetRepo
  implements SaveAssetRepo, LoadAssetRepo, DeleteAssetRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveAsset(asset: Asset, tx?: Transaction): Promise<Result<Asset>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = AssetDrizzleMapper.toPersistence(asset);

      // Insert asset
      const savedRow = await db
        .insert(assets)
        .values(row)
        .onConflictDoUpdate({
          target: assets.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Assets,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved asset
      return Result.ok(AssetDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return formatFail("Failed to save Asset", error);
    }
  }

  async listAssets(
    { cursor, pageSize = 100 }: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<Asset[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select assets
      const rows = await db
        .select()
        .from(assets)
        .where(cursor ? gt(assets.id, cursor.toString()) : undefined)
        .limit(pageSize)
        .orderBy(asc(assets.id));

      // Return assets
      return Result.ok(rows.map(AssetDrizzleMapper.toDomain));
    } catch (error) {
      return formatFail("Failed to list Assets", error);
    }
  }

  async getAssetById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Asset>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select asset by id
      const row = await db
        .select()
        .from(assets)
        .where(eq(assets.id, id.toString()))
        .then(getOneOrThrow);

      // Return asset
      return Result.ok(AssetDrizzleMapper.toDomain(row));
    } catch (error) {
      return formatFail("Failed to get Asset by id", error);
    }
  }

  async getAssetByHash(hash: string, tx?: Transaction): Promise<Result<Asset>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select asset by hash
      const row = await db
        .select()
        .from(assets)
        .where(eq(assets.hash, hash))
        .then(getOneOrThrow);

      // Return asset
      return Result.ok(AssetDrizzleMapper.toDomain(row));
    } catch (error) {
      return formatFail("Failed to get Asset by hash", error);
    }
  }

  async deleteAssetById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete asset by id
      await db.delete(assets).where(eq(assets.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Assets,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return success
      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete Asset by id", error);
    }
  }
}
