import { Result, UseCase } from "@/shared/core";
import { DeleteDataStoreNodeRepo } from "../repos";

export interface DeleteAllDataStoreNodesByFlowRequest {
  flowId: string;
}

export class DeleteAllDataStoreNodesByFlowUseCase implements UseCase<DeleteAllDataStoreNodesByFlowRequest, Result<void>> {
  constructor(
    private deleteDataStoreNodeRepo: DeleteDataStoreNodeRepo,
  ) {}

  async execute(request: DeleteAllDataStoreNodesByFlowRequest): Promise<Result<void>> {
    try {
      const result = await this.deleteDataStoreNodeRepo.deleteAllDataStoreNodesByFlow(request.flowId);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete all data store nodes by flow: ${error}`);
    }
  }
}