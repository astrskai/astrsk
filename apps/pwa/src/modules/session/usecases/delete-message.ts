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
          (f) => f.name === "supermemory_ids"
        );
        if (supermemoryIdsField && supermemoryIdsField.value) {
          try {
            supermemoryIds = JSON.parse(supermemoryIdsField.value);
          } catch (error) {
            logger.error("[DeleteMessage] Failed to parse supermemory_ids:", error);
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

      // Delete from Supermemory if memory IDs exist
      if (supermemoryIds.length > 0) {
        console.log("🗑️ [DeleteMessage] Deleting Supermemory entries...");
        console.log(`   Memory IDs (${supermemoryIds.length}):`, supermemoryIds);

        try {
          const { bulkDeleteMemories } = await import("@/modules/supermemory/roleplay-memory");

          const deleteResult = await bulkDeleteMemories(supermemoryIds);
          if (deleteResult.success) {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✅ SUPERMEMORY DELETE COMPLETE");
            console.log(`   Turn ID: ${messageId.toString()}`);
            console.log(`   Deleted ${deleteResult.deletedCount} memories from all containers`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            logger.info(`[DeleteMessage] Deleted ${deleteResult.deletedCount} Supermemory entries`);
          } else {
            console.log(`❌ [DeleteMessage] Failed to delete from Supermemory: ${deleteResult.error}`);
            logger.error("[DeleteMessage] Failed to delete from Supermemory:", deleteResult.error);
          }
        } catch (error) {
          // Log error but don't fail the message deletion (graceful degradation)
          console.log("❌ [DeleteMessage] Error deleting from Supermemory:", error);
          logger.error("[DeleteMessage] Failed to delete from Supermemory:", error);
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
