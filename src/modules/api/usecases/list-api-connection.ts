import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/utils";

import { ApiConnection } from "@/modules/api/domain";
import {
  ListApiConnectionQuery,
  LoadApiConnectionRepo,
} from "@/modules/api/repos";

export class ListApiConnection
  implements UseCase<ListApiConnectionQuery, Result<ApiConnection[]>>
{
  constructor(private loadApiConnectionRepo: LoadApiConnectionRepo) {}

  async execute(
    query: ListApiConnectionQuery,
  ): Promise<Result<ApiConnection[]>> {
    try {
      const apiConnections =
        await this.loadApiConnectionRepo.getApiConnections(query);
      return Result.ok<ApiConnection[]>(apiConnections.getValue());
    } catch (error) {
      return formatFail<ApiConnection[]>(
        "Failed to list API connections",
        error,
      );
    }
  }
}
