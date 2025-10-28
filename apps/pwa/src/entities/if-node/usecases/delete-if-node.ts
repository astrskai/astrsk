import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DeleteIfNodeRepo } from "../repos";

export interface DeleteIfNodeRequest {
  nodeId: string;
}

export class DeleteIfNodeUseCase implements UseCase<DeleteIfNodeRequest, Result<void>> {
  constructor(
    private deleteIfNodeRepo: DeleteIfNodeRepo,
  ) {}

  async execute(request: DeleteIfNodeRequest): Promise<Result<void>> {
    try {
      const result = await this.deleteIfNodeRepo.deleteIfNode(
        new UniqueEntityID(request.nodeId)
      );
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete if node: ${error}`);
    }
  }
}