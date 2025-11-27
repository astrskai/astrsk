import { Result, UseCase } from "@/shared/core";

import { ScenarioCard } from "@/entities/card/domain";
import { LoadCardRepo, SearchScenariosQuery } from "@/entities/card/repos";

export class SearchScenarios
  implements UseCase<SearchScenariosQuery, Result<ScenarioCard[]>>
{
  constructor(private loadCardRepo: LoadCardRepo) {}

  async execute(query: SearchScenariosQuery): Promise<Result<ScenarioCard[]>> {
    try {
      return await this.loadCardRepo.searchScenarios(query);
    } catch (error) {
      return Result.fail<ScenarioCard[]>(
        `Failed to search scenarios: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
