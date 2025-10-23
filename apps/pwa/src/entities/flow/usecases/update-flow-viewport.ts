import { UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";
import { FlowViewport } from "../domain/flow";

type UpdateFlowViewportRequest = {
  flowId: UniqueEntityID;
  viewport: FlowViewport;
};

export class UpdateFlowViewport implements UseCase<UpdateFlowViewportRequest, Promise<Result<void>>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo
  ) {}

  async execute(request: UpdateFlowViewportRequest): Promise<Result<void>> {
    const { flowId, viewport } = request;

    // Use targeted update if available, otherwise fallback to full save
    if (this.saveFlowRepo.updateFlowViewport) {
      const updateResult = await this.saveFlowRepo.updateFlowViewport(flowId, viewport);
      
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
    const updatedFlowResult = flow.update({ viewport });
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