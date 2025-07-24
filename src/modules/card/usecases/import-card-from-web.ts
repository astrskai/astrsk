import { Result, UseCase } from "@/shared/core";

import { Card } from "@/modules/card/domain";

export class ImportCardFromWeb implements UseCase<string, Result<Card[]>> {
  async execute(url: string): Promise<Result<Card[]>> {
    throw new Error("Method not implemented.");
  }
}
