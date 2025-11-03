import { Result } from "@/shared/core";
import { IfNode } from "../domain";
import { LoadIfNodeRepo } from "../repos/load-if-node-repo";
import { SaveIfNodeRepo } from "../repos/save-if-node-repo";
import { IfCondition } from "@/features/flow/nodes/if-node";

export interface UpdateIfNodeConditionsRequest {
  flowId: string;
  nodeId: string;
  conditions: IfCondition[];
}

export class UpdateIfNodeConditionsUseCase {
  constructor(
    private loadIfNodeRepo: LoadIfNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  async execute(request: UpdateIfNodeConditionsRequest): Promise<Result<IfNode>> {
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

      // Update the conditions
      const updateResult = ifNode.updateConditions(request.conditions);
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
      console.error("Failed to update if node conditions:", error);
      return Result.fail(`Failed to update if node conditions: ${error}`);
    }
  }
}