import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { ApiConnection } from "@/modules/api/domain";
import { LoadApiConnectionRepo } from "@/modules/api/repos";

export class GetApiConnection
  implements UseCase<UniqueEntityID, Result<ApiConnection>>
{
  constructor(private loadApiConnectionRepo: LoadApiConnectionRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<ApiConnection>> {
    try {
      return await this.loadApiConnectionRepo.getApiConnectionById(id);
    } catch (error) {
      return Result.fail<ApiConnection>(
        `Error fetching api connection: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
