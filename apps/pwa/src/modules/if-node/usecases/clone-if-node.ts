import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { IfNode } from "../domain";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "../repos";

export interface CloneIfNodeRequest {
  originalNodeId: string;
  originalFlowId: string;
  newNodeId: string;
  newFlowId: string;
  name?: string; // Optional: override the name
  color?: string; // Optional: override the color
}

export class CloneIfNodeUseCase
  implements UseCase<CloneIfNodeRequest, Result<IfNode | null>>
{
  constructor(
    private loadIfNodeRepo: LoadIfNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  async execute(request: CloneIfNodeRequest): Promise<Result<IfNode | null>> {
    try {
      // Get the original if node
      const ifNodeOrError = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
        request.originalFlowId,
        request.originalNodeId,
      );

      if (ifNodeOrError.isFailure) {
        return Result.fail(
          `Failed to get original if node: ${ifNodeOrError.getError()}`,
        );
      }

      const originalNode = ifNodeOrError.getValue();
      if (!originalNode) {
        // Node doesn't exist, return success with null (not an error case for optional nodes)
        console.log(
          `If node not found for nodeId: ${request.originalNodeId}, returning null`,
        );
        return Result.ok(null);
      }

      // Create a clone with new IDs and optionally override name/color
      const clonedNodeOrError = IfNode.create(
        {
          flowId: request.newFlowId,
          name: request.name || originalNode.props.name,
          color: request.color || originalNode.props.color,
          conditions: originalNode.props.conditions || [],
          logicOperator: originalNode.props.logicOperator || "AND",
        },
        new UniqueEntityID(request.newNodeId),
      );

      if (clonedNodeOrError.isFailure) {
        return Result.fail(
          `Failed to create cloned if node: ${clonedNodeOrError.getError()}`,
        );
      }

      const clonedNode = clonedNodeOrError.getValue();

      // Save the cloned node
      const saveResult = await this.saveIfNodeRepo.saveIfNode(clonedNode);
      if (saveResult.isFailure) {
        return Result.fail(
          `Failed to save cloned if node: ${saveResult.getError()}`,
        );
      }

      console.log(
        `Successfully cloned If node from ${request.originalNodeId} to ${request.newNodeId}`,
      );
      return Result.ok(clonedNode);
    } catch (error) {
      return Result.fail(`Failed to clone if node: ${error}`);
    }
  }
}
