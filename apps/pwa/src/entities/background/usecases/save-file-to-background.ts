import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { formatFail } from "@/shared/lib";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { Background } from "@/entities/background/domain/background";
import { SaveBackground } from "@/entities/background/usecases/save-background";

interface Command {
  file: File;
  sessionId: UniqueEntityID;
}

export class SaveFileToBackground implements UseCase<Command, Result<Background>> {
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveBackground: SaveBackground,
  ) {}

  async execute({ file, sessionId }: Command): Promise<Result<Background>> {
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
          sessionId,
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
