import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/modules/session/repos/save-session-repo";
import { DeleteTurnRepo } from "@/modules/turn/repos/delete-turn-repo";

type Command = {
  sessionId: UniqueEntityID;
  messageId: UniqueEntityID;
};

export class DeleteMessage implements UseCase<Command, Result<void>> {
  constructor(
    private deleteMessageRepo: DeleteTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
  ) {}

  async execute(command: Command): Promise<Result<void>> {
    try {
      const { sessionId, messageId } = command;

      // Get session
      const sessionOrError =
        await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionOrError.isFailure) {
        return formatFail("Failed to load session", sessionOrError.getError());
      }

      // Delete message from session
      const session = sessionOrError.getValue();
      session.deleteMessage(messageId);

      // Delete message
      const deleteMessageOrError =
        await this.deleteMessageRepo.deleteTurnById(messageId);
      if (deleteMessageOrError.isFailure) {
        return formatFail(
          "Failed to delete message",
          deleteMessageOrError.getError(),
        );
      }

      // Save session
      const savedSessionOrError =
        await this.saveSessionRepo.saveSession(session);
      if (savedSessionOrError.isFailure) {
        return formatFail(
          "Failed to save session",
          savedSessionOrError.getError(),
        );
      }

      return Result.ok();
    } catch (error) {
      return formatFail("Failed to delete message", error);
    }
  }
}
