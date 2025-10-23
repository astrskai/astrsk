import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatError } from "@/shared/lib";

import { Agent } from "@/modules/agent/domain";
import { LoadAgentRepo, SaveAgentRepo } from "@/modules/agent/repos";

interface CloneAgentParams {
  sourceAgentId: UniqueEntityID;
  targetAgentId?: UniqueEntityID;
}

export class CloneAgent
  implements UseCase<CloneAgentParams | UniqueEntityID, Promise<Result<Agent>>>
{
  constructor(
    private loadAgentRepo: LoadAgentRepo,
    private saveAgentRepo: SaveAgentRepo,
  ) {}

  private async getAgent(id: UniqueEntityID): Promise<Agent> {
    const agentOrError = await this.loadAgentRepo.getAgentById(id);
    if (agentOrError.isFailure) {
      throw formatError("Failed to get agent", agentOrError.getError());
    }
    return agentOrError.getValue();
  }

  private cloneAgent(agent: Agent, targetId?: UniqueEntityID): Agent {
    const { _id, createdAt, updatedAt, ...agentJson } = agent.toJSON();
    // If targetId is provided, create the agent with that ID
    if (targetId) {
      const clonedAgentOrError = Agent.fromJSON({
        ...agentJson,
        _id: targetId.toString(),
      });
      if (clonedAgentOrError.isFailure) {
        throw formatError(
          "Failed to clone agent",
          clonedAgentOrError.getError(),
        );
      }
      return clonedAgentOrError.getValue();
    }
    // Otherwise create with auto-generated ID
    const clonedAgentOrError = Agent.fromJSON(agentJson);
    if (clonedAgentOrError.isFailure) {
      throw formatError("Failed to clone agent", clonedAgentOrError.getError());
    }
    return clonedAgentOrError.getValue();
  }

  private async changeAgentName(agent: Agent): Promise<Agent> {
    while (true) {
      const name = `Copy of ${agent.props.name}`;
      agent.update({ name });
      const canUseAgentNameOrError =
        await this.loadAgentRepo.canUseAgentName(name);
      if (canUseAgentNameOrError.isFailure) {
        throw formatError(
          "Failed to check agent name",
          canUseAgentNameOrError.getError(),
        );
      }
      if (
        canUseAgentNameOrError.isSuccess &&
        canUseAgentNameOrError.getValue()
      ) {
        break;
      }
    }
    return agent;
  }

  private async saveAgent(agent: Agent): Promise<Result<Agent>> {
    return this.saveAgentRepo.saveAgent(agent);
  }

  async execute(
    params: CloneAgentParams | UniqueEntityID,
  ): Promise<Result<Agent>> {
    // Handle both old (UniqueEntityID) and new (CloneAgentParams) parameter formats
    let sourceAgentId: UniqueEntityID;
    let targetAgentId: UniqueEntityID | undefined;

    if (params instanceof UniqueEntityID) {
      // Legacy format - just source agent ID
      sourceAgentId = params;
    } else {
      // New format with optional target ID
      sourceAgentId = params.sourceAgentId;
      targetAgentId = params.targetAgentId;
    }

    // Get agent
    const agent = await this.getAgent(sourceAgentId);

    // Clone agent with optional target ID
    const clonedAgent = this.cloneAgent(agent, targetAgentId);

    // Change name
    const changedAgent = await this.changeAgentName(clonedAgent);

    // Save agent
    return this.saveAgent(changedAgent);
  }
}
