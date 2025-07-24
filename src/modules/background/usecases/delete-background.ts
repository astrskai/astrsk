import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { Drizzle } from "@/db/drizzle";
import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { DeleteBackgroundRepo } from "@/modules/background/repos/delete-background-repo";

export class DeleteBackground implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private deleteBackgroundRepo: DeleteBackgroundRepo,
    private deleteAsset: DeleteAsset,
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    // TODO: improve transaction handling
    let result;
    try {
      const drizzle = await Drizzle.getInstance();
      result = await drizzle.transaction(async (tx) => {
        try {
          // Delete background
          const deletedBackgroundOrError =
            await this.deleteBackgroundRepo.deleteBackgroundById(id, tx);
          if (deletedBackgroundOrError.isFailure) {
            throw new Error(deletedBackgroundOrError.getError());
          }
          const deletedBackground = deletedBackgroundOrError.getValue();

          // Delete asset
          const assetRefRemoveResult = await this.deleteAsset.execute({
            assetId: deletedBackground.assetId,
            tx: tx,
          });
          if (assetRefRemoveResult.isFailure) {
            throw new Error(assetRefRemoveResult.getError());
          }

          // Return success
          return Result.ok<void>();
        } catch (error) {
          throw error;
        }
      });
    } catch (error) {
      result = formatFail<void>("Failed to delete background", error);
    }
    return result;
  }
}
