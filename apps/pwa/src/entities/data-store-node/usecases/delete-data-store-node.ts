import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DeleteDataStoreNodeRepo } from "../repos";

export interface DeleteDataStoreNodeRequest {
  nodeId: string;
}

export class DeleteDataStoreNodeUseCase implements UseCase<DeleteDataStoreNodeRequest, Result<void>> {
  constructor(
    private deleteDataStoreNodeRepo: DeleteDataStoreNodeRepo,
  ) {}

  async execute(request: DeleteDataStoreNodeRequest): Promise<Result<void>> {
    try {
      const result = await this.deleteDataStoreNodeRepo.deleteDataStoreNode(
        new UniqueEntityID(request.nodeId)
      );
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete data store node: ${error}`);
    }
  }
}