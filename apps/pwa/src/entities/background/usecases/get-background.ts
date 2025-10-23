import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";

import { Background } from "@/entities/background/domain/background";
import { LoadBackgroundRepo } from "@/entities/background/repos/load-background-repo";

export class GetBackground
  implements UseCase<UniqueEntityID, Result<Background>>
{
  constructor(private loadBackgroundRepo: LoadBackgroundRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Background>> {
    try {
      const background = await this.loadBackgroundRepo.getBackgroundById(id);
      return Result.ok(background.getValue());
    } catch (error) {
      return formatFail("Failed to get background", error);
    }
  }
}
