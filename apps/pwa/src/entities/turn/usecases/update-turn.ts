import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Turn } from "@/entities/turn/domain/turn";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";

export class UpdateTurn implements UseCase<Turn, Result<Turn>> {
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private saveTurnRepo: SaveTurnRepo,
  ) {}

  async execute(turn: Turn): Promise<Result<Turn>> {
    try {
      // Check turn exists
      const turnResult = await this.loadTurnRepo.getTurnById(turn.id);
      if (turnResult.isFailure) {
        return formatFail("Failed to load turn", turnResult.getError());
      }

      // Save turn
      return this.saveTurnRepo.saveTurn(turn);
    } catch (error) {
      return formatFail("Failed to save turn", error);
    }
  }
}
