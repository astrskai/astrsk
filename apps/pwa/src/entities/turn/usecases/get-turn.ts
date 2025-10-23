import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Turn } from "@/entities/turn/domain/turn";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";

export class GetTurn implements UseCase<UniqueEntityID, Result<Turn>> {
  constructor(private loadTurnRepo: LoadTurnRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Turn>> {
    try {
      return this.loadTurnRepo.getTurnById(id);
    } catch (error) {
      return formatFail("Failed to load turn", error);
    }
  }
}
