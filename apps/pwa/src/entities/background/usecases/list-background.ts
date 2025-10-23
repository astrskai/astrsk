import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Background } from "@/entities/background/domain";
import {
  ListBackgroundQuery,
  LoadBackgroundRepo,
} from "@/entities/background/repos/load-background-repo";

export class ListBackground
  implements UseCase<ListBackgroundQuery, Result<Background[]>>
{
  constructor(private loadBackgroundRepo: LoadBackgroundRepo) {}

  async execute(query: ListBackgroundQuery): Promise<Result<Background[]>> {
    try {
      const backgroundsResult =
        await this.loadBackgroundRepo.getBackgrounds(query);
      if (backgroundsResult.isFailure) {
        return Result.fail(backgroundsResult.getError());
      }
      const backgrounds = backgroundsResult.getValue();
      return Result.ok(backgrounds);
    } catch (error) {
      return formatFail("Failed to list Backgrounds", error);
    }
  }
}
