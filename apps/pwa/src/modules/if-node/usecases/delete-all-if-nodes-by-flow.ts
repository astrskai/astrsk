import { Result, UseCase } from "@/shared/core";
import { DeleteIfNodeRepo } from "../repos";

export interface DeleteAllIfNodesByFlowRequest {
  flowId: string;
}

export class DeleteAllIfNodesByFlowUseCase implements UseCase<DeleteAllIfNodesByFlowRequest, Result<void>> {
  constructor(
    private deleteIfNodeRepo: DeleteIfNodeRepo,
  ) {}

  async execute(request: DeleteAllIfNodesByFlowRequest): Promise<Result<void>> {
    try {
      const result = await this.deleteIfNodeRepo.deleteAllIfNodesByFlow(request.flowId);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete all if nodes by flow: ${error}`);
    }
  }
}