import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { formatFail } from "@/shared/utils/error-utils";
import { getFileHash } from "@/shared/utils/file-utils";

import { Asset } from "@/modules/asset/domain/asset";
import { SaveAssetRepo } from "@/modules/asset/repos/save-asset-repo";
import { FileStorageService } from "@/app/services/storage/file-storage-service";

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
        storage: FileStorageService.getInstance(),
      });
      if (assetOrError.isFailure) {
        throw new Error(assetOrError.getError());
      }

      // Save and return asset
      return await this.saveAssetRepo.saveAsset(assetOrError.getValue());
    } catch (error) {
      return formatFail("Failed to save file to asset", error);
    }
  }
}
