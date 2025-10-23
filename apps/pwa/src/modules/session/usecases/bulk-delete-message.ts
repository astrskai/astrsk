import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session } from "@/modules/session/domain/session";
import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/modules/session/repos/save-session-repo";
import { DeleteTurnRepo } from "@/modules/turn/repos/delete-turn-repo";

type Command = {
  sessionId: UniqueEntityID;
  messageIds: UniqueEntityID[];
};

export class BulkDeleteMessage implements UseCase<Command, Result<Session>> {
  constructor(
    private deleteMessageRepo: DeleteTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
  ) {}

  async execute(command: Command): Promise<Result<Session>> {
    try {
      const { sessionId, messageIds } = command;

      // Get session
      const sessionOrError =
        await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionOrError.isFailure) {
        return formatFail("Failed to load session", sessionOrError.getError());
      }

      // Delete messages from session
      const session = sessionOrError.getValue();
      for (const messageId of messageIds) {
        session.deleteMessage(messageId);
      }

      // Delete messages
      const deleteMessagesResult =
        await this.deleteMessageRepo.bulkDeleteTurnByIds(messageIds);
      if (deleteMessagesResult.isFailure) {
        return formatFail(
          "Failed to delete messages",
          deleteMessagesResult.getError(),
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

      return Result.ok(savedSessionOrError.getValue());
    } catch (error) {
      return formatFail("Failed to bulk delete messages", error);
    }
  }
}
