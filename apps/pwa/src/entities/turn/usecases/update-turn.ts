import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Turn } from "@/entities/turn/domain/turn";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";
import { compressTurn } from "@/entities/turn/usecases/compress-turn";

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
      const savedTurnResult = await this.saveTurnRepo.saveTurn(turn);
      if (savedTurnResult.isFailure) {
        return savedTurnResult;
      }

      const savedTurn = savedTurnResult.getValue();

      // Compress turn if compression is enabled for this session
      const compressedTurnResult = await compressTurn({
        turnId: savedTurn.id,
        sessionId: savedTurn.sessionId,
        loadTurnRepo: this.loadTurnRepo,
        saveTurnRepo: this.saveTurnRepo,
      });

      if (compressedTurnResult.isFailure) {
        // Log compression failure but don't fail the entire operation
        console.warn(
          "[UpdateTurn] Compression failed:",
          compressedTurnResult.getError()
        );
      }

      const finalTurn = compressedTurnResult.isSuccess
        ? compressedTurnResult.getValue()
        : savedTurn;

      return Result.ok(finalTurn);
    } catch (error) {
      return formatFail("Failed to save turn", error);
    }
  }
}
