import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { Card } from "@/modules/card/domain";

export interface SaveCardRepo {
  saveCard(card: Card, tx?: Transaction): Promise<Result<Card>>;
}
