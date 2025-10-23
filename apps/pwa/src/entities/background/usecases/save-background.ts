import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Background } from "@/entities/background/domain";
import { SaveBackgroundRepo } from "@/entities/background/repos/save-background-repo";

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
