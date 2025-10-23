import { Result, UseCase } from "@/shared/core";
import { readFileToString } from "@/shared/lib";

import { Agent } from "@/modules/agent/domain";
import { SaveAgentRepo } from "@/modules/agent/repos";

export class ImportAgentFromFile implements UseCase<File, Result<Agent>> {
  constructor(private saveAgentRepo: SaveAgentRepo) {}

  async execute(file: File): Promise<Result<Agent>> {
    try {
      const text = await readFileToString(file);

      const agentOrError = Agent.fromJSON(JSON.parse(text));
      if (agentOrError.isFailure) {
        return Result.fail<Agent>(agentOrError.getError());
      }

      const savedAgent = await this.saveAgentRepo.saveAgent(
        agentOrError.getValue(),
      );
      if (savedAgent.isFailure) {
        return Result.fail<Agent>(savedAgent.getError());
      }

      return Result.ok<Agent>(savedAgent.getValue());
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to import agent from file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
