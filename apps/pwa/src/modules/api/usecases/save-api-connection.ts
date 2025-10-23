import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { ApiConnection } from "@/modules/api/domain";
import { SaveApiConnectionRepo } from "@/modules/api/repos";

export class SaveApiConnection
  implements UseCase<ApiConnection, Result<ApiConnection>>
{
  constructor(private saveApiConnectionRepo: SaveApiConnectionRepo) {}

  async execute(request: ApiConnection): Promise<Result<ApiConnection>> {
    try {
      const savedConnection =
        await this.saveApiConnectionRepo.saveApiConnection(request);
      return savedConnection;
    } catch (error) {
      return formatFail<ApiConnection>("Failed to save API connection", error);
    }
  }
}
