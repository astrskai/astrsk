import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";

export interface DeleteApiConnectionRepo {
  deleteApiConnectionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>>;
}
