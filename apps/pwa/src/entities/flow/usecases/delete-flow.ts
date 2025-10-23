import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteFlowRepo } from "@/entities/flow/repos/delete-flow-repo";
import { LoadFlowRepo } from "@/entities/flow/repos/load-flow-repo";
import { DeleteAgentRepo } from "@/entities/agent/repos/delete-agent-repo";

export class DeleteFlow implements UseCase<UniqueEntityID, Result<void>> {
  constructor(
    private deleteFlowRepo: DeleteFlowRepo,
    private loadFlowRepo: LoadFlowRepo,
    private deleteAgentRepo: DeleteAgentRepo
  ) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      // First, load the flow to get the agent IDs
      const flowResult = await this.loadFlowRepo.getFlowById(id);
      if (flowResult.isSuccess) {
        const flow = flowResult.getValue();
        
        // Delete all agents associated with this flow
        const agentIds = flow.agentIds;
        
        for (const agentId of agentIds) {
          const deleteAgentResult = await this.deleteAgentRepo.deleteAgent(agentId);
          if (deleteAgentResult.isFailure) {
            // Continue deleting other agents even if one fails
          }
        }
      }
      
      // Then delete the flow itself
      const deleteResult = await this.deleteFlowRepo.deleteFlow(id);
      if (deleteResult.isFailure) {
        return deleteResult;
      }
      
      return Result.ok<void>();
    } catch (error) {
      return Result.fail(
        `Failed to delete flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
