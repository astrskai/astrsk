import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { ReadyState } from "@/modules/flow/domain/flow";

type UpdateFlowReadyStateRequest = {
  flowId: string;
  readyState: ReadyState;
};

export class UpdateFlowReadyState implements UseCase<UpdateFlowReadyStateRequest, Promise<Result<void>>> {
  constructor(private flowRepo: any) {}

  async execute(request: UpdateFlowReadyStateRequest): Promise<Result<void>> {
    const { flowId, readyState } = request;

    // Use targeted update to only update ready state
    // This avoids race conditions where other fields might be overwritten
    const updateResult = await this.flowRepo.updateFlowReadyState(flowId, readyState);
    
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    return Result.ok<void>();
  }
}