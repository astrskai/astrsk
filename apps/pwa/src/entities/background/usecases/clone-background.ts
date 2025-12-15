import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Transaction } from "@/db/transaction";
import { Background } from "@/entities/background/domain/background";
import { BackgroundDrizzleMapper } from "@/entities/background/mappers/background-drizzle-mapper";
import { LoadBackgroundRepo } from "@/entities/background/repos/load-background-repo";
import { SaveBackgroundRepo } from "@/entities/background/repos/save-background-repo";

interface Command {
  backgroundId: UniqueEntityID;
  sessionId: UniqueEntityID;
  tx?: Transaction;
}

export class CloneBackground implements UseCase<Command, Result<Background>> {
  constructor(
    private saveBackgroundRepo: SaveBackgroundRepo,
    private loadBackgroundRepo: LoadBackgroundRepo,
  ) {}

  async execute({
    backgroundId,
    sessionId,
    tx,
  }: Command): Promise<Result<Background>> {
    try {
      // Fetch original background
      const originalBackgroundOrError =
        await this.loadBackgroundRepo.getBackgroundById(backgroundId, tx);
      if (originalBackgroundOrError.isFailure) {
        throw new Error(originalBackgroundOrError.getError());
      }
      const originalBackground = originalBackgroundOrError.getValue();

      // Clone background using mapper
      const { id, ...backgroundRow } =
        BackgroundDrizzleMapper.toPersistence(originalBackground);
      const newId = new UniqueEntityID();
      const now = new Date();
      const clonedBackground = BackgroundDrizzleMapper.toDomain({
        ...backgroundRow,
        id: newId.toString(),
        session_id: sessionId.toString(), // Assign to new session
        updated_at: now,
        created_at: now,
      });

      // Save the cloned background
      const savedBackgroundOrError =
        await this.saveBackgroundRepo.saveBackground(clonedBackground, tx);
      if (savedBackgroundOrError.isFailure) {
        throw new Error(savedBackgroundOrError.getError());
      }

      // Return saved background
      return Result.ok(savedBackgroundOrError.getValue());
    } catch (error) {
      return formatFail("Failed to clone background", error);
    }
  }
}
