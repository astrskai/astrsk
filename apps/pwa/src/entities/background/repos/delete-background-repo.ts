import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Background } from "@/entities/background/domain";

export interface DeleteBackgroundRepo {
  deleteBackgroundById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Background>>;
}
