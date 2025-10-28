import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";

export interface DeleteTurnRepo {
  deleteTurnById(id: UniqueEntityID, tx?: Transaction): Promise<Result<void>>;
  bulkDeleteTurnByIds(
    ids: UniqueEntityID[],
    tx?: Transaction,
  ): Promise<Result<void>>;
}
