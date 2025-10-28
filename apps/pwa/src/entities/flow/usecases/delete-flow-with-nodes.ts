import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteFlowRepo } from "@/entities/flow/repos/delete-flow-repo";
import { LoadFlowRepo } from "@/entities/flow/repos/load-flow-repo";
import { DeleteAgentRepo } from "@/entities/agent/repos/delete-agent-repo";
import { DeleteDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { DeleteIfNodeRepo } from "@/entities/if-node/repos";
import { DeleteAllDataStoreNodesByFlowUseCase } from "@/entities/data-store-node/usecases/delete-all-data-store-nodes-by-flow";
import { DeleteAllIfNodesByFlowUseCase } from "@/entities/if-node/usecases/delete-all-if-nodes-by-flow";

export class DeleteFlowWithNodes implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private deleteFlowRepo: DeleteFlowRepo,
    private loadFlowRepo: LoadFlowRepo,
    private deleteAgentRepo: DeleteAgentRepo,
    private deleteDataStoreNodeRepo: DeleteDataStoreNodeRepo,
    private deleteIfNodeRepo: DeleteIfNodeRepo
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const flowId = id.toString();
      
      // First, load the flow to get the agent IDs
      const flowResult = await this.loadFlowRepo.getFlowById(id);
      if (flowResult.isSuccess) {
        const flow = flowResult.getValue();
        
        // Delete all agents associated with this flow
        const agentIds = flow.agentIds;
        
        for (const agentId of agentIds) {
          const deleteAgentResult = await this.deleteAgentRepo.deleteAgent(agentId);
          if (deleteAgentResult.isFailure) {
            console.warn(`Failed to delete agent ${agentId.toString()}:`, deleteAgentResult.getError());
            // Continue deleting other agents even if one fails
          }
        }
      }
      
      // Delete all data store nodes associated with this flow
      const deleteDataStoreNodesUseCase = new DeleteAllDataStoreNodesByFlowUseCase(
        this.deleteDataStoreNodeRepo
      );
      const deleteDataStoreResult = await deleteDataStoreNodesUseCase.execute({ flowId });
      if (deleteDataStoreResult.isFailure) {
        console.warn(`Failed to delete data store nodes for flow ${flowId}:`, deleteDataStoreResult.getError());
        // Continue with deletion even if this fails
      }
      
      // Delete all if nodes associated with this flow
      const deleteIfNodesUseCase = new DeleteAllIfNodesByFlowUseCase(
        this.deleteIfNodeRepo
      );
      const deleteIfNodesResult = await deleteIfNodesUseCase.execute({ flowId });
      if (deleteIfNodesResult.isFailure) {
        console.warn(`Failed to delete if nodes for flow ${flowId}:`, deleteIfNodesResult.getError());
        // Continue with deletion even if this fails
      }
      
      // Finally delete the flow itself
      const deleteResult = await this.deleteFlowRepo.deleteFlow(id);
      if (deleteResult.isFailure) {
        return deleteResult;
      }
      
      return Result.ok<void>();
    } catch (error) {
      return Result.fail(
        `Failed to delete flow with nodes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}