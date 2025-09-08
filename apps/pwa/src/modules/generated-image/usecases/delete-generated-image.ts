import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { GetGeneratedImage } from "./get-generated-image";
import { DeleteGeneratedImageRepo } from "../repos/delete-generated-image-repo";

export class DeleteGeneratedImage {
  constructor(
    private deleteGeneratedImageRepo: DeleteGeneratedImageRepo,
    private deleteAsset: DeleteAsset,
    private getGeneratedImage: GetGeneratedImage,
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // Get the generated image first to access the asset ID
      const getResult = await this.getGeneratedImage.execute(id);
      if (getResult.isFailure) {
        return Result.fail<void>(getResult.getError());
      }

      const generatedImage = getResult.getValue();

      // Delete the associated asset
      const deleteAssetResult = await this.deleteAsset.execute({ assetId: generatedImage.assetId });
      if (deleteAssetResult.isFailure) {
        return Result.fail<void>(deleteAssetResult.getError());
      }

      // Delete the generated image record
      const deleteResult = await this.deleteGeneratedImageRepo.delete(id);
      if (deleteResult.isFailure) {
        return Result.fail<void>(deleteResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete generated image: ${error}`);
    }
  }
}