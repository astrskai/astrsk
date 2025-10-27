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
        (f) => f.name === "supermemory_ids"
      );
      const newSupermemoryIdsField = turn.dataStore.find(
        (f) => f.name === "supermemory_ids"
      );

      const oldMemoryIds: string[] = oldSupermemoryIdsField?.value
        ? JSON.parse(oldSupermemoryIdsField.value)
        : [];
      const newMemoryIds: string[] = newSupermemoryIdsField?.value
        ? JSON.parse(newSupermemoryIdsField.value)
        : [];

      // Check if memory IDs have changed (new memories created vs editing existing)
      const memoryIdsChanged = JSON.stringify(oldMemoryIds.sort()) !== JSON.stringify(newMemoryIds.sort());

      // Save turn to database
      const saveResult = await this.saveTurnRepo.saveTurn(turn);
      if (saveResult.isFailure) {
        return saveResult;
      }

      // Update Supermemory ONLY if:
      // 1. Memory IDs exist in BOTH old and new Turn
      // 2. Memory IDs are THE SAME (not new memories, but editing existing ones)
      // 3. Content has actually changed
      try {
        console.log("🔍 [UpdateTurn] Checking for supermemory_ids in dataStore...");
        console.log("   DataStore fields:", turn.dataStore.map(f => f.name));
        console.log("   Content changed:", contentChanged);
        console.log("   Old memory IDs:", oldMemoryIds);
        console.log("   New memory IDs:", newMemoryIds);
        console.log("   Memory IDs changed:", memoryIdsChanged);

        // Skip if memory IDs changed (new memories created, not an edit)
        if (memoryIdsChanged) {
          console.log("   ⏭️ New memories created (IDs changed) - skipping Supermemory update");
          return saveResult;
        }

        // Skip if no memory IDs in old turn (no existing memories to update)
        if (oldMemoryIds.length === 0) {
          console.log("   ⏭️ No existing memories to update - skipping Supermemory update");
          return saveResult;
        }

        // Only update Supermemory if content has changed
        if (!contentChanged) {
          console.log("   ⏭️ Content unchanged - skipping Supermemory update");
          return saveResult;
        }

        // At this point we know:
        // - Memory IDs exist and are the same (editing existing memories)
        // - Content has changed (actual edit)
        // Proceed with Supermemory update
        if (newMemoryIds.length > 0) {
          console.log(`   ✅ Updating ${newMemoryIds.length} existing Supermemory entries...`);

          const { updateMemory } = await import("@/modules/supermemory/roleplay-memory");

          // Extract updated metadata from Turn's dataStore
          const gameTimeField = turn.dataStore.find((f) => f.name === "game_time");
          const gameTimeIntervalField = turn.dataStore.find((f) => f.name === "game_time_interval");
          const participantsField = turn.dataStore.find((f) => f.name === "participants");

          const updatedGameTime = gameTimeField?.value ? parseInt(String(gameTimeField.value), 10) : undefined;
          const updatedGameTimeInterval = gameTimeIntervalField?.value ? String(gameTimeIntervalField.value) : undefined;
          const updatedParticipants = participantsField?.value ? JSON.parse(participantsField.value) : undefined;

          console.log("   Extracted metadata from dataStore:");
          console.log("     game_time:", updatedGameTime);
          console.log("     game_time_interval:", updatedGameTimeInterval);
          console.log("     participants:", updatedParticipants);

          // Update all associated Supermemory entries
          // Note: We don't fetch existing memories because they may still be processing (status: "queued")
          // Instead, we format updates based on the Turn's metadata

          // We need to determine which memories are world vs character based on their position
          // Memory IDs order: [world, character1, character2, ...]
          // The first ID is always the world container

          const updatePromises = newMemoryIds.map(async (memoryId, index) => {
              try {
                const isWorldContainer = (index === 0); // First ID is world container

                // Reformat content based on container type
                let newContent: string;
                const speakerName = turn.characterName || "Unknown";
                const gameTime = updatedGameTime ?? 0;
                const gameTimeInterval = updatedGameTimeInterval ?? "Day";

                if (isWorldContainer) {
                  // World container format: "Message: {name}: {content} GameTime: {time} {interval}"
                  const { formatMessageWithGameTime } = await import("@/modules/supermemory/shared/utils");
                  newContent = formatMessageWithGameTime(
                    speakerName,
                    turn.content,
                    gameTime,
                    gameTimeInterval
                  );
                } else {
                  // Character container format: enriched with sections
                  const { formatMessageWithGameTime } = await import("@/modules/supermemory/shared/utils");
                  const worldMessageContent = formatMessageWithGameTime(speakerName, turn.content, gameTime, gameTimeInterval);

                  const currentTimeSection = `###Current time###\nGameTime: ${gameTime} ${gameTimeInterval}`;
                  const messageSection = `###Message###\n${worldMessageContent}`;

                  // Don't include world context section when updating (we can't retrieve it without fetching)
                  // This is acceptable - the world context is typically from World Agent output specific to this turn
                  const worldContextSection = undefined;

                  const { buildEnrichedMessage } = await import("@/modules/supermemory/roleplay-memory/core/memory-storage");
                  newContent = buildEnrichedMessage({
                    currentTime: currentTimeSection,
                    message: messageSection,
                    worldContext: worldContextSection,
                  });
                }

                // Build updated metadata with only the fields we know
                const updatedMetadata: any = {};
                if (gameTime !== undefined) {
                  updatedMetadata.game_time = gameTime;
                }
                if (gameTimeInterval !== undefined) {
                  updatedMetadata.game_time_interval = gameTimeInterval;
                }

                console.log(`   Updating memory ${memoryId} (${isWorldContainer ? 'world' : 'character'} container)`);

                return await updateMemory(memoryId, newContent, updatedMetadata);
              } catch (error) {
                logger.error(`[UpdateTurn] Failed to update Supermemory ${memoryId}:`, error);
                return null;
              }
            });

          await Promise.all(updatePromises);

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("✅ SUPERMEMORY UPDATE COMPLETE");
          console.log(`   Turn ID: ${turn.id.toString()}`);
          console.log(`   Updated Content: "${turn.content.substring(0, 100)}..."`);
          console.log(`   Memory IDs (${newMemoryIds.length}): ${newMemoryIds.join(', ')}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

          logger.info(`[UpdateTurn] Updated ${newMemoryIds.length} Supermemory entries`);
        }
      } catch (error) {
        // Log error but don't fail the turn update (graceful degradation)
        logger.error("[UpdateTurn] Failed to update Supermemory:", error);
      }

      return saveResult;
    } catch (error) {
      return formatFail("Failed to save turn", error);
    }
  }
}
