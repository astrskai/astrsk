import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Node } from "../domain/flow";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";
import { ReadyState } from "../domain";
import { UpdateNode } from "./update-node";
import { IfCondition } from "vibe-shared-types";

interface IfNodeData {
  conditions?: IfCondition[];
  draftConditions?: IfCondition[];
  logicOperator?: 'AND' | 'OR';
  [key: string]: any;
}

export type CreateIfNodeConditionsRequest = {
  flowId: string;
  nodeId: string;
  newConditions: IfCondition[]; // Type-safe conditions
  logicOperator?: 'AND' | 'OR'; // Optional - only update if provided
};

export class CreateIfNodeConditions implements UseCase<CreateIfNodeConditionsRequest, Promise<Result<void>>> {
  private updateNode: UpdateNode;
  
  constructor(private flowRepo: LoadFlowRepo & SaveFlowRepo) {
    this.updateNode = new UpdateNode(flowRepo);
  }

  async execute(request: CreateIfNodeConditionsRequest): Promise<Result<void>> {
    const { flowId, nodeId, newConditions, logicOperator } = request;

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
    if (node.type !== 'if') {
      return Result.fail<void>(`Node ${nodeId} is not an if node`);
    }

    // Type assert the node data to IfNodeData
    const nodeData = node.data as IfNodeData;

    // Get existing conditions and add new ones
    const existingConditions = nodeData.conditions || [];
    const updatedConditions = [...existingConditions, ...newConditions];

    // Prepare the updated node data
    const updatedNodeData: IfNodeData = {
      ...nodeData,
      conditions: updatedConditions,
      draftConditions: updatedConditions, // Keep both in sync
      ...(logicOperator && { logicOperator }) // Only update if provided
    };

    // Create updated node
    const updatedNode: Node = {
      ...node,
      data: updatedNodeData
    };

    // Update using the UpdateNode use case
    const updateResult = await this.updateNode.execute({
      flowId,
      nodeId,
      nodeData: updatedNodeData
    });

    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    return Result.ok<void>();
  }
}