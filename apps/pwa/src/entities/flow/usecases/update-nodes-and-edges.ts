import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Node, Edge } from "../domain/flow";
import { LoadFlowRepo, SaveFlowRepo } from "../repos";

type UpdateNodesAndEdgesRequest = {
  flowId: string;
  nodes: Node[];
  edges: Edge[];
};

export class UpdateNodesAndEdges implements UseCase<UpdateNodesAndEdgesRequest, Promise<Result<void>>> {
  constructor(private flowRepo: LoadFlowRepo & SaveFlowRepo) {}

  async execute(request: UpdateNodesAndEdgesRequest): Promise<Result<void>> {
    const { flowId, nodes, edges } = request;

    // Use targeted update if available
    if ((this.flowRepo as any).updateNodesAndEdges) {
      const updateResult = await (this.flowRepo as any).updateNodesAndEdges(
        new UniqueEntityID(flowId),
        nodes,
        edges
      );
      
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }
      
      return Result.ok<void>();
    }
    
    // Fallback to full flow update if granular method not available
    const flowOrError = await this.flowRepo.getFlowById(new UniqueEntityID(flowId));
    if (flowOrError.isFailure) {
      return Result.fail<void>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    const updatedFlowResult = flow.update({ nodes, edges });
    if (updatedFlowResult.isFailure) {
      return Result.fail<void>(updatedFlowResult.getError());
    }

    const savedFlowResult = await this.flowRepo.saveFlow(updatedFlowResult.getValue());
    if (savedFlowResult.isFailure) {
      return Result.fail<void>(savedFlowResult.getError());
    }

    return Result.ok<void>();
  }
}