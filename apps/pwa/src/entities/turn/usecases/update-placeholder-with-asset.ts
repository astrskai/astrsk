import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Turn } from "@/entities/turn/domain/turn";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";
import { CreatePlaceholderTurn } from "@/entities/turn/usecases/create-placeholder-turn";

type Command = {
  placeholderTurnId: UniqueEntityID;
  assetId: string;
};

type Response = Turn;

export class UpdatePlaceholderWithAsset implements UseCase<Command, Result<Response>> {
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private saveTurnRepo: SaveTurnRepo
  ) {}

  async execute(command: Command): Promise<Result<Response>> {
    try {
      const { placeholderTurnId, assetId } = command;

      // Load the placeholder turn
      const turnOrError = await this.loadTurnRepo.getTurnById(placeholderTurnId);
      if (turnOrError.isFailure) {
        return formatFail("Failed to load placeholder turn", turnOrError.getError());
      }

      const turn = turnOrError.getValue();

      // Verify this is actually a placeholder turn
      if (!CreatePlaceholderTurn.isPlaceholderTurn(turn)) {
        return formatFail("Turn is not a placeholder turn");
      }

      // Update the turn with the asset
      turn.setAssetId(assetId);
      
      // Don't change the content - keep the original placeholder text
      // This way the component can still detect it's a media placeholder

      // Save the updated turn
      const saveResult = await this.saveTurnRepo.saveTurn(turn);
      if (saveResult.isFailure) {
        return formatFail("Failed to save updated turn", saveResult.getError());
      }

      return Result.ok(turn);
    } catch (error) {
      return formatFail("Failed to update placeholder with asset", error);
    }
  }
}