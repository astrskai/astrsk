import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreField, Node } from "../domain/flow";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";
import { ReadyState } from "../domain";

type UpdateNodeDataStoreFieldsDTO = {
  flowId: string;
  nodeId: string;
  fields: DataStoreField[];
};

export class UpdateNodeDataStoreFields implements UseCase<UpdateNodeDataStoreFieldsDTO, Promise<Result<void>>> {
  constructor(private flowRepo: LoadFlowRepo & SaveFlowRepo) {}

  async execute(request: UpdateNodeDataStoreFieldsDTO): Promise<Result<void>> {
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

    // Update the node's data store fields
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        dataStoreFields: fields
      }
    };

    const updatedNodes = [...flow.props.nodes];
    updatedNodes[nodeIndex] = updatedNode;

    // Update the flow with new nodes
    const updateResult = flow.update({ nodes: updatedNodes });
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    let flowToSave = updateResult.getValue();

    // Set flow to Draft state if it was Ready
    if (flowToSave.props.readyState === ReadyState.Ready) {
      const stateUpdateResult = flowToSave.setReadyState(ReadyState.Draft);
      if (stateUpdateResult.isSuccess) {
        flowToSave = stateUpdateResult.getValue();
      }
    }

    // Save the updated flow
    const saveResult = await this.flowRepo.saveFlow(flowToSave);
    if (saveResult.isFailure) {
      return Result.fail<void>(saveResult.getError());
    }

    return Result.ok<void>();
  }
}