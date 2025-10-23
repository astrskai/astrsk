import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { PanelStructure } from "../domain/flow";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";

type UpdatePanelLayoutRequest = {
  flowId: string;
  panelStructure: PanelStructure;
};

export class UpdatePanelLayout implements UseCase<UpdatePanelLayoutRequest, Promise<Result<void>>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo
  ) {}

  async execute(request: UpdatePanelLayoutRequest): Promise<Result<void>> {
    const { flowId, panelStructure } = request;
    const flowIdEntity = new UniqueEntityID(flowId);

    // Use targeted update if available for optimal performance
    if (this.saveFlowRepo.updatePanelLayout) {
      const updateResult = await this.saveFlowRepo.updatePanelLayout(flowIdEntity, panelStructure);
      
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }
      
      return Result.ok<void>();
    }
    
    // Fallback to full flow save if granular method not available
    const flowOrError = await this.loadFlowRepo.getFlowById(flowIdEntity);
    if (flowOrError.isFailure) {
      return Result.fail<void>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    const updatedFlowResult = flow.update({ panelStructure });
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