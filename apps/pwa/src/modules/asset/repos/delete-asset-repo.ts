import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Transaction } from "@/db/transaction";

export interface DeleteAssetRepo {
  deleteAssetById(id: UniqueEntityID, tx?: Transaction): Promise<Result<void>>;
}
