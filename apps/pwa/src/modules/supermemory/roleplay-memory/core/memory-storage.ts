/**
 * Roleplay Memory System - Memory Storage
 *
 * Storage operations for world and character memory containers
 * with enrichment and metadata support.
 *
 * Based on contracts/memory-storage.contract.md
 */

import { memoryClient } from "../../shared/client";
import type {
  MemoryMetadata,
  EnrichedMessageSections,
  StorageResult,
} from "../../shared/types";
import {
  validateCharacterContainer,
  validateWorldContainer,
  validateNpcContainer,
} from "./containers";
import { logger } from "@/shared/utils/logger";
import {
  recordCharacterMemoryAdd,
  recordWorldMemoryAdd,
} from "../debug/debug-helpers";

/**
 * Build enriched message content from sections
 * Format: Three-section structure with optional world context
 *
 * @param sections - Message sections (currentTime, message, worldContext)
 * @returns Formatted enriched message string
 */
export function buildEnrichedMessage(
  sections: EnrichedMessageSections,
): string {
  const parts: string[] = [];

  // Section 1: Current time (required)
  parts.push(sections.currentTime);

  // Section 2: Message (required)
  parts.push(sections.message);

  // Section 3: World context (optional - omit if empty)
  if (sections.worldContext && sections.worldContext.trim()) {
    parts.push(sections.worldContext);
  }

  return parts.join("\n\n");
}

/**
 * Store raw message in world container
 *
 * Contract: Store unenriched message for World Agent context
 * Format: "Message: {name}: {content} GameTime: {gameTime} {interval}"
 *
 * @param containerTag - World container tag ({sessionId}-world)
 * @param content - Raw message content
 * @param metadata - Message metadata
 * @returns Storage result with id and success status
 */
export async function storeWorldMessage(
  containerTag: string,
  content: string,
  metadata: MemoryMetadata,
): Promise<StorageResult> {
  try {
    // Validate world container tag
    if (!validateWorldContainer(containerTag)) {
      logger.error(
        "[Memory Storage] Invalid world container tag:",
        containerTag,
      );
      return {
        id: null,
        success: false,
        error: "Invalid world container tag format",
      };
    }

    // Validate required metadata fields
    if (
      !metadata.speaker ||
      !metadata.participants ||
      metadata.participants.length === 0 ||
      typeof metadata.game_time !== "number" ||
      !metadata.game_time_interval ||
      !metadata.type
    ) {
      logger.error("[Memory Storage] Invalid world message metadata - missing required fields");
      return {
        id: null,
        success: false,
        error: "Missing required metadata fields",
      };
    }

    // Store in Supermemory
    const result = await memoryClient.memories.add({
      containerTag,
      content,
      metadata: {
        speaker: metadata.speaker,
        participants: metadata.participants,
        game_time: metadata.game_time,
        game_time_interval: metadata.game_time_interval,
        type: metadata.type,
        ...(metadata.isSpeaker !== undefined && {
          isSpeaker: metadata.isSpeaker,
        }),
        ...(metadata.permanent !== undefined && {
          permanent: metadata.permanent,
        }),
        ...(metadata.lorebookKey && { lorebookKey: metadata.lorebookKey }),
      },
    });

    // Record debug event
    recordWorldMemoryAdd({
      containerTag,
      content,
      metadata: {
        speaker: metadata.speaker,
        participants: metadata.participants,
        game_time: metadata.game_time,
        game_time_interval: metadata.game_time_interval,
        type: metadata.type,
      },
      storageId: result.id,
    });

    return {
      id: result.id,
      success: true,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to store world message:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Store enriched message in character's private container
 *
 * Contract: Store three-section enriched message
 * Format: Current time + Message + World knowledge (optional)
 *
 * @param containerTag - Character container tag ({sessionId}-{characterId})
 * @param enrichedContent - Enriched message content (three sections)
 * @param metadata - Message metadata
 * @returns Storage result with id and success status
 */
export async function storeCharacterMessage(
  containerTag: string,
  enrichedContent: string,
  metadata: MemoryMetadata,
): Promise<StorageResult> {
  try {
    // Validate character or NPC container tag
    const isCharacter = validateCharacterContainer(containerTag);
    const isNpc = !isCharacter && validateNpcContainer(containerTag);

    if (!isCharacter && !isNpc) {
      logger.error(
        "[Memory Storage] Invalid container tag (not character or NPC):",
        containerTag,
      );
      return {
        id: null,
        success: false,
        error: "Invalid container tag format",
      };
    }

    // Validate required metadata fields
    if (
      !metadata.speaker ||
      !metadata.participants ||
      metadata.participants.length === 0 ||
      typeof metadata.game_time !== "number" ||
      !metadata.game_time_interval ||
      !metadata.type ||
      metadata.isSpeaker === undefined
    ) {
      logger.error("[Memory Storage] Missing required metadata fields");
      return {
        id: null,
        success: false,
        error: "Missing required metadata fields",
      };
    }

    // Store in Supermemory
    const result = await memoryClient.memories.add({
      containerTag,
      content: enrichedContent,
      metadata: {
        speaker: metadata.speaker,
        participants: metadata.participants,
        game_time: metadata.game_time,
        game_time_interval: metadata.game_time_interval,
        type: metadata.type,
        isSpeaker: metadata.isSpeaker,
        ...(metadata.permanent !== undefined && {
          permanent: metadata.permanent,
        }),
        ...(metadata.lorebookKey && { lorebookKey: metadata.lorebookKey }),
      },
    });

    // Record debug event
    // Extract character ID and name from containerTag (format: sessionId::characterId)
    const characterId = containerTag.split("::")[1] || "unknown";
    recordCharacterMemoryAdd({
      characterId,
      characterName: "Character", // Name not available here, will be shown in panel by ID
      containerTag,
      content: enrichedContent,
      metadata: {
        speaker: metadata.speaker,
        participants: metadata.participants,
        isSpeaker: metadata.isSpeaker,
        game_time: metadata.game_time,
        game_time_interval: metadata.game_time_interval,
        type: metadata.type,
      },
      storageId: result.id,
    });

    return {
      id: result.id,
      success: true,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to store character message:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Store initialization content (scenario, character card, lorebook)
 *
 * Contract: Store permanent content with permanent flag
 * Types: 'scenario' | 'character_card' | 'lorebook'
 *
 * @param containerTag - Character container tag
 * @param content - Initialization content
 * @param metadata - Content metadata with permanent: true
 * @returns Storage result with id and success status
 */
export async function storeInitContent(
  containerTag: string,
  content: string,
  metadata: MemoryMetadata,
): Promise<StorageResult> {
  try {
    // Validate character container tag
    if (!validateCharacterContainer(containerTag)) {
      logger.error(
        "[Memory Storage] Invalid character container tag:",
        containerTag,
      );
      return {
        id: null,
        success: false,
        error: "Invalid character container tag format",
      };
    }

    // Validate metadata for init content
    if (!metadata.type || !metadata.permanent) {
      logger.error(
        "[Memory Storage] Init content must have type and permanent=true",
      );
      return {
        id: null,
        success: false,
        error: "Init content requires type and permanent flag",
      };
    }

    // Validate type-specific requirements
    if (metadata.type === "lorebook" && !metadata.lorebookKey) {
      logger.error("[Memory Storage] Lorebook entries require lorebookKey");
      return {
        id: null,
        success: false,
        error: "Lorebook entries require lorebookKey",
      };
    }

    // Store in Supermemory
    const result = await memoryClient.memories.add({
      containerTag,
      content,
      metadata: {
        type: metadata.type,
        permanent: metadata.permanent,
        ...(metadata.lorebookKey && { lorebookKey: metadata.lorebookKey }),
        ...(metadata.game_time !== undefined && { game_time: metadata.game_time }),
        ...(metadata.game_time_interval && {
          game_time_interval: metadata.game_time_interval,
        }),
      },
    });

    logger.info(`[Memory Storage] Stored init content: ${result.id} | Type: ${metadata.type} | Container: ${containerTag}`);

    // Record debug event
    // Extract character ID from containerTag (format: sessionId::characterId)
    const characterId = containerTag.split("::")[1] || "unknown";
    logger.info(`[Memory Storage] Recording debug event for character: ${characterId} | Type: ${metadata.type}`);
    recordCharacterMemoryAdd({
      characterId,
      characterName: `Character ${characterId}`, // Name not available here, will show by ID
      containerTag,
      content,
      metadata: {
        speaker: metadata.speaker || "system",
        participants: metadata.participants || [],
        isSpeaker: false,
        game_time: metadata.game_time || 0,
        game_time_interval: metadata.game_time_interval || "Day",
        type: metadata.type,
      },
      storageId: result.id,
    });

    return {
      id: result.id,
      success: true,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to store init content:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Store world state update in world container
 *
 * Contract: Store world events/changes
 * Format: "{description}. GameTime: {game_time} {interval}"
 * Type: 'world_state_update'
 *
 * @param containerTag - World container tag
 * @param update - State change description
 * @param metadata - Update metadata
 * @returns Storage result with id and success status
 */
export async function storeWorldStateUpdate(
  containerTag: string,
  update: string,
  metadata: MemoryMetadata,
): Promise<StorageResult> {
  try {
    // Validate world container tag
    if (!validateWorldContainer(containerTag)) {
      logger.error(
        "[Memory Storage] Invalid world container tag:",
        containerTag,
      );
      return {
        id: null,
        success: false,
        error: "Invalid world container tag format",
      };
    }

    // Validate metadata
    if (
      metadata.type !== "world_state_update" ||
      typeof metadata.game_time !== "number" ||
      !metadata.game_time_interval
    ) {
      logger.error("[Memory Storage] Invalid world state update metadata");
      return {
        id: null,
        success: false,
        error: "Invalid world state update metadata",
      };
    }

    // Store in Supermemory
    const result = await memoryClient.memories.add({
      containerTag,
      content: update,
      metadata: {
        type: metadata.type,
        game_time: metadata.game_time,
        game_time_interval: metadata.game_time_interval,
      },
    });

    logger.info("[Memory Storage] Stored world state update:", result.id);
    return {
      id: result.id,
      success: true,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to store world state update:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
