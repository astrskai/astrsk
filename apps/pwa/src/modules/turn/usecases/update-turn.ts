import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/utils";
import { logger } from "@/shared/utils/logger";

import { Turn } from "@/modules/turn/domain/turn";
import { LoadTurnRepo } from "@/modules/turn/repos/load-turn-repo";
import { SaveTurnRepo } from "@/modules/turn/repos/save-turn-repo";

export class UpdateTurn implements UseCase<Turn, Result<Turn>> {
  constructor(
    private loadTurnRepo: LoadTurnRepo,
    private saveTurnRepo: SaveTurnRepo,
  ) {}

  async execute(turn: Turn): Promise<Result<Turn>> {
    try {
      // Check turn exists and get the old version to compare
      const turnResult = await this.loadTurnRepo.getTurnById(turn.id);
      if (turnResult.isFailure) {
        return formatFail("Failed to load turn", turnResult.getError());
      }
      const oldTurn = turnResult.getValue();

      // Check if content has actually changed
      const contentChanged = oldTurn.content !== turn.content;

      // Get memory IDs from both old and new turns
      const oldSupermemoryIdsField = oldTurn.dataStore.find(
        (f) => f.name === "memory_ids"
      );
      const newSupermemoryIdsField = turn.dataStore.find(
        (f) => f.name === "memory_ids"
      );

      const oldMemoryIds: string[] = oldSupermemoryIdsField?.value
        ? JSON.parse(oldSupermemoryIdsField.value)
        : [];
      const newMemoryIds: string[] = newSupermemoryIdsField?.value
        ? JSON.parse(newSupermemoryIdsField.value)
        : [];

      // Check if memory IDs have changed (new memories created vs editing existing)
      const memoryIdsChanged = JSON.stringify(oldMemoryIds.sort()) !== JSON.stringify(newMemoryIds.sort());

      // Trigger turn:beforeUpdate hook (for extensions like Supermemory)
      try {
        const { triggerExtensionHook } = await import("@/modules/extensions/bootstrap");
        const { SessionService } = await import("@/app/services/session-service");

        // Get session for hook context
        const sessionResult = await SessionService.getSession.execute(turn.sessionId);
        if (sessionResult.isSuccess) {
          await triggerExtensionHook("turn:beforeUpdate", {
            turn,
            session: sessionResult.getValue(),
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        logger.error("[UpdateTurn] Failed to trigger extension hook:", error);
        // Don't fail - extension hooks are optional
      }

      // Save turn to database
      const saveResult = await this.saveTurnRepo.saveTurn(turn);
      if (saveResult.isFailure) {
        return saveResult;
      }

      return saveResult;
    } catch (error) {
      return formatFail("Failed to save turn", error);
    }
  }
}
