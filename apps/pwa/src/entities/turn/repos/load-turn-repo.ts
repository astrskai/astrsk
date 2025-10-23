import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Turn } from "@/entities/turn/domain/turn";

export interface LoadTurnRepo {
  listTurns(
    query: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<Turn[]>>;
  getTurnById(id: UniqueEntityID, tx?: Transaction): Promise<Result<Turn>>;
}
