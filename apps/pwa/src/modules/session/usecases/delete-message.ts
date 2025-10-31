import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";
import { logger } from "@/shared/utils/logger";

import { LoadSessionRepo } from "@/modules/session/repos/load-session-repo";
import { SaveSessionRepo } from "@/modules/session/repos/save-session-repo";
import { DeleteTurnRepo } from "@/modules/turn/repos/delete-turn-repo";
import { LoadTurnRepo } from "@/modules/turn/repos/load-turn-repo";

type Command = {
  sessionId: UniqueEntityID;
  messageId: UniqueEntityID;
};

export class DeleteMessage implements UseCase<Command, Result<void>> {
  constructor(
    private deleteMessageRepo: DeleteTurnRepo,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
    private loadTurnRepo: LoadTurnRepo,
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

      // Get turn to extract Supermemory IDs before deletion
      const turnOrError = await this.loadTurnRepo.getTurnById(messageId);
      let supermemoryIds: string[] = [];
      if (turnOrError.isSuccess) {
        const turn = turnOrError.getValue();
        const supermemoryIdsField = turn.dataStore.find(
          (f) => f.name === "memory_ids"
        );
        if (supermemoryIdsField && supermemoryIdsField.value) {
          try {
            supermemoryIds = JSON.parse(supermemoryIdsField.value);
          } catch (error) {
            logger.error("[DeleteMessage] Failed to parse memory_ids:", error);
          }
        }
      }

      // Delete message from session
      const session = sessionOrError.getValue();
      session.deleteMessage(messageId);

      // Delete message from database
      const deleteMessageOrError =
        await this.deleteMessageRepo.deleteTurnById(messageId);
      if (deleteMessageOrError.isFailure) {
        return formatFail(
          "Failed to delete message",
          deleteMessageOrError.getError(),
        );
      }

      // Trigger turn:afterDelete hook (for extensions like Supermemory)
      if (turnOrError.isSuccess) {
        try {
          const { triggerExtensionHook } = await import("@/modules/extensions/bootstrap");
          await triggerExtensionHook("turn:afterDelete", {
            turn: turnOrError.getValue(),
            session,
            timestamp: Date.now(),
          });
        } catch (error) {
          logger.error("[DeleteMessage] Failed to trigger extension hook:", error);
          // Don't fail - extension hooks are optional
        }
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
