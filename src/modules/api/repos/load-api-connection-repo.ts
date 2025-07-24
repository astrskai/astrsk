import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { ApiConnection } from "@/modules/api/domain";

export type ListApiConnectionQuery = {
  // Pagination
  limit?: number;
  offset?: number;

  // Search
  keyword?: string;
};

export interface LoadApiConnectionRepo {
  listApiConnections(
    query: {
      cursor?: UniqueEntityID;
      pageSize?: number;
    },
    tx?: Transaction,
  ): Promise<Result<ApiConnection[]>>;
  getApiConnectionById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<ApiConnection>>;
  getApiConnections(
    query: ListApiConnectionQuery,
    tx?: Transaction,
  ): Promise<Result<ApiConnection[]>>;
}
