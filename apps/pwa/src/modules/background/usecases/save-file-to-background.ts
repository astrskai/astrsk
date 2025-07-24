import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { formatFail } from "@/shared/utils";

import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { Background } from "@/modules/background/domain/background";
import { SaveBackground } from "@/modules/background/usecases/save-background";

export class SaveFileToBackground implements UseCase<File, Result<Background>> {
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveBackground: SaveBackground,
  ) {}

  async execute(file: File): Promise<Result<Background>> {
    try {
      // Save file to asset
      const backgroundId = new UniqueEntityID();
      const assetOrError = await this.saveFileToAsset.execute({
        file: file,
      });
      if (assetOrError.isFailure) {
        throw new Error(assetOrError.getError());
      }
      const asset = assetOrError.getValue();

      // Create background
      const backgroundOrError = Background.create(
        {
          name: file.name,
          assetId: asset.id,
        },
        backgroundId,
      );
      if (backgroundOrError.isFailure) {
        throw new Error(backgroundOrError.getError());
      }
      const background = backgroundOrError.getValue();

      // Save and return background
      return await this.saveBackground.execute(background);
    } catch (error) {
      return formatFail("Failed to save file to background", error);
    }
  }
}
