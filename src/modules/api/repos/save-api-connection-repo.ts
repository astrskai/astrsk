import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { ApiConnection } from "@/modules/api/domain";

export interface SaveApiConnectionRepo {
  saveApiConnection(
    apiConnection: ApiConnection,
    tx?: Transaction,
  ): Promise<Result<ApiConnection>>;
}
