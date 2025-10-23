import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Transaction } from "@/db/transaction";
import { Asset } from "@/entities/asset/domain/asset";

export interface LoadAssetRepo {
  listAssets(
    query: {
      cursor?: UniqueEntityID;
      pageSize?: number;
    },
    tx?: Transaction,
  ): Promise<Result<Asset[]>>;
  getAssetById(id: UniqueEntityID, tx?: Transaction): Promise<Result<Asset>>;
  getAssetByHash(hash: string, tx?: Transaction): Promise<Result<Asset>>;
}
