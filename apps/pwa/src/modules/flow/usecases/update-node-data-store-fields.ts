import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreField, Node } from "../domain/flow";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";
import { ReadyState } from "../domain";
import { UpdateNode } from "./update-node";

type UpdateNodeDataStoreFieldsRequest = {
  flowId: string;
  nodeId: string;
  fields: DataStoreField[];
};

export class UpdateNodeDataStoreFields implements UseCase<UpdateNodeDataStoreFieldsRequest, Promise<Result<void>>> {
  private updateNode: UpdateNode;
  
  constructor(private flowRepo: LoadFlowRepo & SaveFlowRepo) {
    this.updateNode = new UpdateNode(flowRepo);
  }

  async execute(request: UpdateNodeDataStoreFieldsRequest): Promise<Result<void>> {
    const { flowId, nodeId, fields } = request;

    // Get the current flow
    const flowOrError = await this.flowRepo.getFlowById(new UniqueEntityID(flowId));
    if (flowOrError.isFailure) {
      return Result.fail<void>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    
    // Find the node
    const nodeIndex = flow.props.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) {
      return Result.fail<void>(`Node with id ${nodeId} not found`);
    }

    const node = flow.props.nodes[nodeIndex];
    if (node.type !== 'dataStore') {
      return Result.fail<void>(`Node ${nodeId} is not a data store node`);
    }

    // Prepare the updated node data
    const updatedNodeData = {
      ...node.data,
      dataStoreFields: fields
    };

    // Use targeted update to only save this node's data (avoids race conditions)
    const saveResult = await this.updateNode.execute({
      flowId,
      nodeId,
      nodeData: updatedNodeData
    });
    
    if (saveResult.isFailure) {
      return Result.fail<void>(saveResult.getError());
    }

    return Result.ok<void>();
  }
}