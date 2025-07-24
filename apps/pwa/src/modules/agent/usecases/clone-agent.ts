import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatError } from "@/shared/utils";

import { Agent } from "@/modules/agent/domain";
import { LoadAgentRepo, SaveAgentRepo } from "@/modules/agent/repos";

export class CloneAgent
  implements UseCase<UniqueEntityID, Promise<Result<Agent>>>
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

  private cloneAgent(agent: Agent): Agent {
    const { _id, createdAt, updatedAt, ...agentJson } = agent.toJSON();
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

  async execute(agentId: UniqueEntityID): Promise<Result<Agent>> {
    // Get agent
    const agent = await this.getAgent(agentId);

    // Clone agent
    const clonedAgent = this.cloneAgent(agent);

    // Change name
    const changedAgent = await this.changeAgentName(clonedAgent);

    // Save agent
    return this.saveAgent(changedAgent);
  }
}
