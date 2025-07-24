import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { DeleteCardRepo } from "@/modules/card/repos/delete-card-repo";

export class DeleteCard implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private deleteCardRepo: DeleteCardRepo,
    private deleteAsset: DeleteAsset,
  ) {}

  // TODO: transaction
  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // Delete card
      const deletedCardOrError = await this.deleteCardRepo.deleteCardById(id);
      if (deletedCardOrError.isFailure) {
        throw new Error(deletedCardOrError.getError());
      }
      const deletedCard = deletedCardOrError.getValue();

      // Check icon asset exists
      if (deletedCard.props.iconAssetId) {
        // Remove icon asset
        const assetRefRemoveResult = await this.deleteAsset.execute({
          assetId: deletedCard.props.iconAssetId,
        });
        if (assetRefRemoveResult.isFailure) {
          throw new Error(assetRefRemoveResult.getError());
        }
      }

      // Return success
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        `Error deleting card: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
