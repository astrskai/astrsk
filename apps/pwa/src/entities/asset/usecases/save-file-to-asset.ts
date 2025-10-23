import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { formatFail } from "@/shared/lib/error-utils";
import { getFileHash } from "@/shared/lib/file-utils";

import { Asset } from "@/entities/asset/domain/asset";
import { SaveAssetRepo } from "@/entities/asset/repos/save-asset-repo";

type Command = {
  file: File;
};

export class SaveFileToAsset implements UseCase<Command, Result<Asset>> {
  constructor(private saveAssetRepo: SaveAssetRepo) {}

  async execute(command: Command): Promise<Result<Asset>> {
    try {
      // Get file hash
      const hash = await getFileHash(command.file);

      // Create asset from file
      const assetOrError = await Asset.createFromFile({
        file: command.file,
      });
      if (assetOrError.isFailure) {
        return Result.fail<Asset>(assetOrError.getError());
      }

      // Save and return asset
      return await this.saveAssetRepo.saveAsset(assetOrError.getValue());
    } catch (error) {
      return formatFail("Failed to save file to asset", error);
    }
  }
}
