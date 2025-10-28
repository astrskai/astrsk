import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { LoadAgentRepo } from "@/entities/agent/repos";

export class ExportAgentToFile
  implements UseCase<UniqueEntityID, Result<File>>
{
  constructor(private loadAgentRepo: LoadAgentRepo) {}

  async execute(agentId: UniqueEntityID): Promise<Result<File>> {
    try {
      const agentOrError = await this.loadAgentRepo.getAgentById(agentId);
      if (agentOrError.isFailure) {
        return Result.fail<File>(agentOrError.getError());
      }

      const agent = agentOrError.getValue();

      const blob = new Blob([JSON.stringify(agent, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], `${agent.props.name}.json`, {
        type: "application/json",
      });

      return Result.ok<File>(file);
    } catch (error) {
      return Result.fail<File>(
        `Failed to export agent to file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
