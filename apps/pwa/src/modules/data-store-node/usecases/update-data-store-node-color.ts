import { Result } from "@/shared/core";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo } from "../repos/load-data-store-node-repo";
import { SaveDataStoreNodeRepo } from "../repos/save-data-store-node-repo";

export interface UpdateDataStoreNodeColorRequest {
  flowId: string;
  nodeId: string;
  color: string;
}

export class UpdateDataStoreNodeColorUseCase {
  constructor(
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
  ) {}

  async execute(request: UpdateDataStoreNodeColorRequest): Promise<Result<DataStoreNode>> {
    try {
      // Get the existing data store node by flow and node ID
      const getDataStoreNodeResult = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
        request.flowId, 
        request.nodeId
      );
      
      if (getDataStoreNodeResult.isFailure) {
        return Result.fail(getDataStoreNodeResult.getError());
      }

      const dataStoreNode = getDataStoreNodeResult.getValue();
      if (!dataStoreNode) {
        return Result.fail("Data store node not found");
      }

      // Update the color
      const updateResult = dataStoreNode.updateColor(request.color);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const updatedDataStoreNode = updateResult.getValue();

      // Save the updated data store node
      const saveResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(updatedDataStoreNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(updatedDataStoreNode);
    } catch (error) {
      console.error("Failed to update data store node color:", error);
      return Result.fail(`Failed to update data store node color: ${error}`);
    }
  }
}