import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";

import { Asset } from "@/entities/asset/domain/asset";
import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";

export class GetAsset implements UseCase<UniqueEntityID, Result<Asset>> {
  constructor(private loadAssetRepo: LoadAssetRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Asset>> {
    try {
      return await this.loadAssetRepo.getAssetById(id);
    } catch (error) {
      return formatFail("Failed to get asset", error);
    }
  }
}
