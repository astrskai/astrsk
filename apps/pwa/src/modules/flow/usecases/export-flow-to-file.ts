import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { LoadFlowRepo } from "@/modules/flow/repos/load-flow-repo";
import { LoadAgentRepo } from "@/modules/agent/repos";

export class ExportFlowToFile implements UseCase<UniqueEntityID, Result<File>> {
  constructor(
    private loadFlowRepo: LoadFlowRepo,
    private loadAgentRepo: LoadAgentRepo,
  ) {}

  async execute(flowId: UniqueEntityID): Promise<Result<File>> {
    try {
      // Get flow by id
      const flowOrError = await this.loadFlowRepo.getFlowById(flowId);
      if (flowOrError.isFailure) {
        return Result.fail(flowOrError.getError());
      }
      const flow = flowOrError.getValue();

      // Convert flow to JSON format
      const flowJson = flow.toJSON();

      // Get agents
      const agents: Record<string, any> = {};
      const agentIds = flow.agentIds;
      for (const agentId of agentIds) {
        const agentOrError = await this.loadAgentRepo.getAgentById(agentId);
        if (agentOrError.isFailure) {
          throw new Error(agentOrError.getError());
        }
        agents[agentId.toString()] = agentOrError.getValue().toJSON();
      }

      // Create JSON file
      const json = {
        ...flowJson,
        agents: agents,
      };
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], `${flow.props.name}.json`, {
        type: "application/json",
      });

      // Return JSON file
      return Result.ok(file);
    } catch (error) {
      return Result.fail(
        `Failed to export flow to file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
