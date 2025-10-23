import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";

import { Transaction } from "@/db/transaction";
import { DeleteAssetRepo } from "@/modules/asset/repos/delete-asset-repo";

type Command = {
  assetId: UniqueEntityID;
  tx?: Transaction;
};

export class DeleteAsset implements UseCase<Command, Result<void>> {
  constructor(private deleteAssetRepo: DeleteAssetRepo) {}

  async execute({ assetId, tx }: Command): Promise<Result<void>> {
    try {
      return await this.deleteAssetRepo.deleteAssetById(assetId, tx);
    } catch (error) {
      return formatFail("Failed to delete asset", error);
    }
  }
}
