import { UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";
import { Node, Edge } from "../domain/flow";

type UpdateFlowGraphRequest = {
  flowId: UniqueEntityID;
  nodes: Node[];
  edges: Edge[];
};

export class UpdateFlowGraph implements UseCase<UpdateFlowGraphRequest, Promise<Result<void>>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private saveFlowRepo: SaveFlowRepo
  ) {}

  async execute(request: UpdateFlowGraphRequest): Promise<Result<void>> {
    const { flowId, nodes: newNodes, edges } = request;

    // Load the flow
    const flowOrError = await this.loadFlowRepo.getFlowById(flowId);
    if (flowOrError.isFailure) {
      return Result.fail<void>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    
    // Create a map of existing node data to preserve it
    const existingDataMap = new Map(
      flow.props.nodes.map((node: Node) => [node.id, node.data])
    );
    
    // Merge nodes: preserve data for existing nodes, use new data for new nodes
    const mergedNodes = newNodes.map(node => {
      const existingData = existingDataMap.get(node.id);
      if (existingData && node.type !== 'start' && node.type !== 'end') {
        // For existing nodes (except start/end), preserve their data field
        // This prevents race conditions with node-specific mutations
        return { ...node, data: existingData };
      }
      // For new nodes or start/end nodes, use the provided data
      return node;
    });

    // Update both nodes and edges together to maintain consistency
    const updatedFlowResult = flow.update({ nodes: mergedNodes, edges });
    if (updatedFlowResult.isFailure) {
      return Result.fail<void>(updatedFlowResult.getError());
    }

    // Save the updated flow
    const savedFlowResult = await this.saveFlowRepo.saveFlow(updatedFlowResult.getValue());
    if (savedFlowResult.isFailure) {
      return Result.fail<void>(savedFlowResult.getError());
    }

    return Result.ok<void>();
  }
}