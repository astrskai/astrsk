import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { DeleteCardRepo } from "@/modules/card/repos/delete-card-repo";

export class DeleteCard implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private deleteCardRepo: DeleteCardRepo,
    // Remove deleteAsset dependency - we preserve assets in gallery
  ) {}

  // TODO: transaction
  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // Only delete the card record, not the associated assets
      // Assets remain in gallery and are managed separately
      const deletedCardOrError = await this.deleteCardRepo.deleteCardById(id);
      if (deletedCardOrError.isFailure) {
        throw new Error(deletedCardOrError.getError());
      }

      // Assets are preserved in gallery - they're managed by GeneratedImageService
      console.log("✅ Card deleted, assets preserved in gallery");
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
