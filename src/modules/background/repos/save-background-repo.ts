import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { Background } from "@/modules/background/domain";

export interface SaveBackgroundRepo {
  saveBackground(
    background: Background,
    tx?: Transaction,
  ): Promise<Result<Background>>;
}
