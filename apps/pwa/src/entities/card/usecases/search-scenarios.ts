import { Result, UseCase } from "@/shared/core";

import { PlotCard } from "@/entities/card/domain";
import { LoadCardRepo, SearchScenariosQuery } from "@/entities/card/repos";

export class SearchScenarios
  implements UseCase<SearchScenariosQuery, Result<PlotCard[]>>
{
  constructor(private loadCardRepo: LoadCardRepo) {}

  async execute(query: SearchScenariosQuery): Promise<Result<PlotCard[]>> {
    try {
      return await this.loadCardRepo.searchScenarios(query);
    } catch (error) {
      return Result.fail<PlotCard[]>(
        `Failed to search scenarios: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
