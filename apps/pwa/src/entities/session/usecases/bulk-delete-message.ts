import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Session } from "@/entities/session/domain/session";
import { LoadSessionRepo } from "@/entities/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/entities/session/repos/save-session-repo";
import { DeleteTurnRepo } from "@/entities/turn/repos/delete-turn-repo";
import { CompressionAnchorRepo } from "@/entities/compression/repos";

type Command = {
  sessionId: UniqueEntityID;
  messageIds: UniqueEntityID[];
};

export class BulkDeleteMessage implements UseCase<Command, Result<Session>> {
  constructor(
    private deleteMessageRepo: DeleteTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
    private compressionAnchorRepo: CompressionAnchorRepo,
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

      // Delete compression anchors for these turns (if any exist)
      try {
        for (const messageId of messageIds) {
          await this.compressionAnchorRepo.deleteAnchorsByTurnId(messageId.toString());
        }
        console.log(`[BulkDeleteMessage] Deleted compression anchors for ${messageIds.length} turns`);
      } catch (error) {
        // Log but don't fail - anchors might not exist
        console.warn("[BulkDeleteMessage] Failed to delete compression anchors:", error);
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
