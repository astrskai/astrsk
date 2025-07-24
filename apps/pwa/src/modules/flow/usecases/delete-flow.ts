import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteFlowRepo } from "@/modules/flow/repos/delete-flow-repo";

export class DeleteFlow implements UseCase<UniqueEntityID, Result<void>> {
  constructor(private deleteFlowRepo: DeleteFlowRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const deleteResult = await this.deleteFlowRepo.deleteFlow(id);
      if (deleteResult.isFailure) {
        return deleteResult;
      }
      return Result.ok<void>();
    } catch (error) {
      return Result.fail(
        `Failed to delete flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
