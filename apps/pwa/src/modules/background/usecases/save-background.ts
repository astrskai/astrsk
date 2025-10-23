import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Background } from "@/modules/background/domain";
import { SaveBackgroundRepo } from "@/modules/background/repos/save-background-repo";

export class SaveBackground implements UseCase<Background, Result<Background>> {
  constructor(private saveBackgroundRepo: SaveBackgroundRepo) {}

  async execute(background: Background): Promise<Result<Background>> {
    try {
      return await this.saveBackgroundRepo.saveBackground(background);
    } catch (error) {
      return formatFail("Failed to save Background", error);
    }
  }
}
