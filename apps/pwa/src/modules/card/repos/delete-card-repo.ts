import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Card } from "@/modules/card/domain";

export interface DeleteCardRepo {
  deleteCardById(id: UniqueEntityID, tx?: Transaction): Promise<Result<Card>>;
}
