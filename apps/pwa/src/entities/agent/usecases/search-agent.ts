import { Result, UseCase } from "@/shared/core";

import { Agent } from "@/entities/agent/domain";
import { LoadAgentRepo, SearchAgentQuery } from "@/entities/agent/repos";

export class SearchAgent implements UseCase<SearchAgentQuery, Result<Agent[]>> {
  constructor(private loadAgentRepo: LoadAgentRepo) {}

  async execute(query: SearchAgentQuery): Promise<Result<Agent[]>> {
    try {
      return await this.loadAgentRepo.searchAgents(query);
    } catch (error) {
      return Result.fail<Agent[]>(
        `Failed to search agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
