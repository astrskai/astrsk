import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { DeleteTurnRepo } from "@/entities/turn/repos/delete-turn-repo";
import { LoadSessionRepo } from "@/entities/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/entities/session/repos/save-session-repo";
import { CreatePlaceholderTurn } from "@/entities/turn/usecases/create-placeholder-turn";

type Command = {
  sessionId: UniqueEntityID;
  placeholderTurnId: UniqueEntityID;
};

type Response = void;

export class RemovePlaceholderTurn
  implements UseCase<Command, Result<Response>>
{
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private deleteTurnRepo: DeleteTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
  ) {}

  async execute(command: Command): Promise<Result<Response>> {
    try {
      const { sessionId, placeholderTurnId } = command;

      // Load the turn to verify it's a placeholder
      const turnOrError =
        await this.loadTurnRepo.getTurnById(placeholderTurnId);
      if (turnOrError.isFailure) {
        return formatFail("Failed to load turn", turnOrError.getError());
      }

      const turn = turnOrError.getValue();

      // Verify this is actually a placeholder turn
      if (!CreatePlaceholderTurn.isPlaceholderTurn(turn)) {
        return formatFail("Turn is not a placeholder turn");
      }

      // Load the session
      const sessionOrError =
        await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionOrError.isFailure) {
        return formatFail("Failed to load session", sessionOrError.getError());
      }

      const session = sessionOrError.getValue();

      // Store asset ID for cleanup (will be handled by the service layer)
      const selectedOption = turn.options?.[turn.selectedOptionIndex || 0];
      const assetIdToDelete = selectedOption?.assetId
        ? new UniqueEntityID(selectedOption.assetId)
        : undefined;

      // Remove turn from session
      session.deleteMessage(placeholderTurnId);

      // Delete the turn from database
      const deleteResult =
        await this.deleteTurnRepo.deleteTurnById(placeholderTurnId);
      if (deleteResult.isFailure) {
        return formatFail(
          "Failed to delete placeholder turn",
          deleteResult.getError(),
        );
      }

      // Save the updated session
      const saveSessionResult = await this.saveSessionRepo.saveSession(session);
      if (saveSessionResult.isFailure) {
        return formatFail(
          "Failed to update session",
          saveSessionResult.getError(),
        );
      }

      return Result.ok();
    } catch (error) {
      return formatFail("Failed to remove placeholder turn", error);
    }
  }
}
