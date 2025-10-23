import { Result, UseCase } from "@/shared/core";

import { Agent } from "@/entities/agent/domain";
import { SaveAgentRepo } from "@/entities/agent/repos";

export class SaveAgent implements UseCase<Agent, Result<Agent>> {
  constructor(private saveAgentRepo: SaveAgentRepo) {}

  async execute(agent: Agent): Promise<Result<Agent>> {
    try {
      const savedAgent = await this.saveAgentRepo.saveAgent(agent);
      return savedAgent;
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to save agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
