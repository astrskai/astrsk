import { UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";

type UpdateFlowNameRequest = {
  flowId: UniqueEntityID;
  name: string;
};

export class UpdateFlowName implements UseCase<UpdateFlowNameRequest, Promise<Result<void>>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo
  ) {}

  async execute(request: UpdateFlowNameRequest): Promise<Result<void>> {
    const { flowId, name } = request;

    // Use targeted update if available, otherwise fallback to full save
    if (this.saveFlowRepo.updateFlowName) {
      const updateResult = await this.saveFlowRepo.updateFlowName(flowId, name);
      
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }
      
      return Result.ok<void>();
    }
    
    // Fallback to full flow save if granular method not available
    const flowOrError = await this.loadFlowRepo.getFlowById(flowId);
    if (flowOrError.isFailure) {
      return Result.fail<void>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    const updatedFlowResult = flow.update({ name });
    if (updatedFlowResult.isFailure) {
      return Result.fail<void>(updatedFlowResult.getError());
    }

    const savedFlowResult = await this.saveFlowRepo.saveFlow(updatedFlowResult.getValue());
    if (savedFlowResult.isFailure) {
      return Result.fail<void>(savedFlowResult.getError());
    }

    return Result.ok<void>();
  }
}