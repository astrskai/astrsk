import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";

export interface UpdateFlowCodingPanelStateRequest {
  flowId: UniqueEntityID;
  isCodingPanelOpen: boolean;
}

export class UpdateFlowCodingPanelState
  implements UseCase<UpdateFlowCodingPanelStateRequest, Promise<Result<void>>>
{
  private loadFlowRepo: LoadFlowRepo;
  private saveFlowRepo: SaveFlowRepo;

  constructor(loadFlowRepo: LoadFlowRepo, saveFlowRepo: SaveFlowRepo) {
    this.loadFlowRepo = loadFlowRepo;
    this.saveFlowRepo = saveFlowRepo;
  }

  async execute(request: UpdateFlowCodingPanelStateRequest): Promise<Result<void>> {
    try {
      // Load the flow
      const flowOrError = await this.loadFlowRepo.getFlowById(request.flowId);
      if (flowOrError.isFailure) {
        return Result.fail(flowOrError.getError());
      }

      const flow = flowOrError.getValue();

      // Update the coding panel state
      const updateResult = flow.update({
        isCodingPanelOpen: request.isCodingPanelOpen,
      });

      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      // Save the updated flow
      const saveResult = await this.saveFlowRepo.saveFlow(flow);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update flow coding panel state: ${error}`);
    }
  }
}