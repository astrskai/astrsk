import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { Turn } from "@/entities/turn/domain/turn";

export interface SaveTurnRepo {
  saveTurn(turn: Turn, tx?: Transaction): Promise<Result<Turn>>;
}
