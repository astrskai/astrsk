import { Result } from "@/shared/core";
import { IfNode } from "../domain";
import { LoadIfNodeRepo } from "../repos/load-if-node-repo";
import { SaveIfNodeRepo } from "../repos/save-if-node-repo";

export interface UpdateIfNodeLogicOperatorRequest {
  flowId: string;
  nodeId: string;
  logicOperator: 'AND' | 'OR';
}

export class UpdateIfNodeLogicOperatorUseCase {
  constructor(
    private loadIfNodeRepo: LoadIfNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  async execute(request: UpdateIfNodeLogicOperatorRequest): Promise<Result<IfNode>> {
    try {
      // Get the existing if node by flow and node ID
      const getIfNodeResult = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
        request.flowId, 
        request.nodeId
      );
      
      if (getIfNodeResult.isFailure) {
        return Result.fail(getIfNodeResult.getError());
      }

      const ifNode = getIfNodeResult.getValue();
      if (!ifNode) {
        return Result.fail("If node not found");
      }

      // Update the logic operator
      const updateResult = ifNode.updateLogicOperator(request.logicOperator);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const updatedIfNode = updateResult.getValue();

      // Save the updated if node
      const saveResult = await this.saveIfNodeRepo.saveIfNode(updatedIfNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(updatedIfNode);
    } catch (error) {
      console.error("Failed to update if node logic operator:", error);
      return Result.fail(`Failed to update if node logic operator: ${error}`);
    }
  }
}