import { DeleteAsset } from "@/entities/asset/usecases/delete-asset";
import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { DrizzleGeneratedImageRepo } from "@/entities/generated-image/repos/impl/drizzle-generated-image-repo";
import { DeleteGeneratedImage } from "@/entities/generated-image/usecases/delete-generated-image";
import { GetGeneratedImage } from "@/entities/generated-image/usecases/get-generated-image";
import { ListGeneratedImages } from "@/entities/generated-image/usecases/list-generated-images";
import { SaveGeneratedImage } from "@/entities/generated-image/usecases/save-generated-image";
import { SaveFileToGeneratedImage } from "@/entities/generated-image/usecases/save-file-to-generated-image";
import { SaveGeneratedImageFromAsset } from "@/entities/generated-image/usecases/save-generated-image-from-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { GeneratedImage } from "@/entities/generated-image/domain";

export class GeneratedImageService {
  public static generatedImageRepo: DrizzleGeneratedImageRepo;

  public static deleteGeneratedImage: DeleteGeneratedImage;
  public static getGeneratedImage: GetGeneratedImage;
  public static listGeneratedImages: ListGeneratedImages;
  public static saveGeneratedImage: SaveGeneratedImage;
  public static saveFileToGeneratedImage: SaveFileToGeneratedImage;
  public static saveGeneratedImageFromAsset: SaveGeneratedImageFromAsset;

  public static init(
    saveFileToAsset: SaveFileToAsset,
    deleteAsset: DeleteAsset,
  ) {
    if (!saveFileToAsset) {
      throw new Error(
        "Cannot initialize GeneratedImageService: saveFileToAsset is undefined",
      );
    }

    if (!deleteAsset) {
      throw new Error(
        "Cannot initialize GeneratedImageService: deleteAsset is undefined",
      );
    }

    this.generatedImageRepo = new DrizzleGeneratedImageRepo();

    this.getGeneratedImage = new GetGeneratedImage(this.generatedImageRepo);
    this.listGeneratedImages = new ListGeneratedImages(this.generatedImageRepo);
    this.saveGeneratedImage = new SaveGeneratedImage(this.generatedImageRepo);
    this.deleteGeneratedImage = new DeleteGeneratedImage(
      this.generatedImageRepo,
      deleteAsset,
      this.getGeneratedImage,
    );
    this.saveFileToGeneratedImage = new SaveFileToGeneratedImage(
      saveFileToAsset,
      this.saveGeneratedImage,
      this.generatedImageRepo,
    );
    this.saveGeneratedImageFromAsset = new SaveGeneratedImageFromAsset(
      this.saveGeneratedImage,
    );
  }

  /**
   * Get a GeneratedImage by its asset ID
   */
  public static async getByAssetId(
    assetId: UniqueEntityID,
  ): Promise<Result<GeneratedImage | null>> {
    return this.generatedImageRepo.getGeneratedImageByAssetId(assetId);
  }

  /**
   * Delete a GeneratedImage by its asset ID (includes cleanup of thumbnail assets)
   */
  public static async deleteByAssetId(
    assetId: UniqueEntityID,
  ): Promise<Result<void>> {
    try {
      // First, find the GeneratedImage by asset ID
      const imageResult = await this.getByAssetId(assetId);

      if (imageResult.isFailure) {
        return Result.fail(
          `Failed to find GeneratedImage: ${imageResult.getError()}`,
        );
      }

      const generatedImage = imageResult.getValue();

      if (!generatedImage) {
        return Result.ok();
      }

      // Delete the GeneratedImage (this also handles thumbnail cleanup)
      const deleteResult = await this.deleteGeneratedImage.execute(
        generatedImage.id,
      );

      if (deleteResult.isFailure) {
        return Result.fail(
          `Failed to delete GeneratedImage: ${deleteResult.getError()}`,
        );
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Error deleting GeneratedImage by asset ID: ${error}`);
    }
  }
}
