import { Result, UseCase } from "@/shared/core";

import { CharacterCard } from "@/entities/card/domain";
import { LoadCardRepo, SearchCharactersQuery } from "@/entities/card/repos";

export class SearchCharacters
  implements UseCase<SearchCharactersQuery, Result<CharacterCard[]>>
{
  constructor(private loadCardRepo: LoadCardRepo) {}

  async execute(query: SearchCharactersQuery): Promise<Result<CharacterCard[]>> {
    try {
      return await this.loadCardRepo.searchCharacters(query);
    } catch (error) {
      return Result.fail<CharacterCard[]>(
        `Failed to search characters: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
