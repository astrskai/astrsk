import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { SaveFlowRepo } from "../repos";

export interface UpdateNodesPositionsDTO {
  flowId: UniqueEntityID;
  positions: Array<{
    nodeId: string;
    position: { x: number; y: number };
  }>;
}

export class UpdateNodesPositions {
  private flowRepository: SaveFlowRepo;

  constructor(flowRepository: SaveFlowRepo) {
    this.flowRepository = flowRepository;
  }

  public async execute(dto: UpdateNodesPositionsDTO): Promise<Result<void>> {
    try {
      // Use granular update method if available
      if (!this.flowRepository.updateNodesPositions) {
        return Result.fail("updateNodesPositions not implemented");
      }
      
      const result = await this.flowRepository.updateNodesPositions(dto.flowId, dto.positions);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update node positions: ${error}`);
    }
  }
}