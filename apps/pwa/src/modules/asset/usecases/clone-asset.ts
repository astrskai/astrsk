import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Transaction } from "@/db/transaction";
import { Asset } from "@/modules/asset/domain/asset";
import { AssetDrizzleMapper } from "@/modules/asset/mappers/asset-drizzle-mapper";
import { LoadAssetRepo } from "@/modules/asset/repos/load-asset-repo";
import { SaveAssetRepo } from "@/modules/asset/repos/save-asset-repo";

interface Command {
  assetId: UniqueEntityID;
  tx?: Transaction;
}

export class CloneAsset implements UseCase<Command, Result<Asset>> {
  constructor(
    private saveAssetRepo: SaveAssetRepo,
    private loadAssetRepo: LoadAssetRepo,
  ) {}

  async execute({ assetId, tx }: Command): Promise<Result<Asset>> {
    try {
      // Fetch original asset
      const originalAssetOrError = await this.loadAssetRepo.getAssetById(
        assetId,
        tx,
      );
      if (originalAssetOrError.isFailure) {
        throw new Error(originalAssetOrError.getError());
      }
      const originalAsset = originalAssetOrError.getValue();

      // Clone asset using mapper
      const { id, ...assetRow } =
        AssetDrizzleMapper.toPersistence(originalAsset);
      const newId = new UniqueEntityID();
      const now = new Date();
      const clonedAsset = AssetDrizzleMapper.toDomain({
        ...assetRow,
        id: newId.toString(),
        updated_at: now,
        created_at: now,
      });

      // Save the cloned asset
      const savedAssetOrError = await this.saveAssetRepo.saveAsset(
        clonedAsset,
        tx,
      );
      if (savedAssetOrError.isFailure) {
        throw new Error(savedAssetOrError.getError());
      }

      // Return saved asset
      return Result.ok(savedAssetOrError.getValue());
    } catch (error) {
      return formatFail("Failed to clone asset", error);
    }
  }
}
