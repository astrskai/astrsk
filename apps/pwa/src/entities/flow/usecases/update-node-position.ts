import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { SaveFlowRepo } from "../repos";

export interface UpdateNodePositionDTO {
  flowId: UniqueEntityID;
  nodeId: string;
  position: { x: number; y: number };
}

export class UpdateNodePosition {
  private flowRepository: SaveFlowRepo;

  constructor(flowRepository: SaveFlowRepo) {
    this.flowRepository = flowRepository;
  }

  public async execute(dto: UpdateNodePositionDTO): Promise<Result<void>> {
    try {
      // Use granular update method if available
      if (!this.flowRepository.updateNodePosition) {
        return Result.fail("updateNodePosition not implemented");
      }
      
      const result = await this.flowRepository.updateNodePosition(dto.flowId, dto.nodeId, dto.position);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update node position: ${error}`);
    }
  }
}