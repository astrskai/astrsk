import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { DeleteApiConnectionRepo } from "@/modules/api/repos/delete-api-connection-repo";

export class DeleteApiConnection
  implements UseCase<UniqueEntityID, Result<void>>
{
  constructor(private deleteApiConnectionRepo: DeleteApiConnectionRepo) {}

  async execute(apiConnectionId: UniqueEntityID): Promise<Result<void>> {
    try {
      const deleteResult =
        await this.deleteApiConnectionRepo.deleteApiConnectionById(
          apiConnectionId,
        );

      if (deleteResult.isFailure) {
        return formatFail<void>(
          "Failed to delete API connection",
          deleteResult.getError(),
        );
      }

      return Result.ok<void>();
    } catch (error) {
      return formatFail<void>(
        "An error occurred while deleting API connection",
        error,
      );
    }
  }
}
