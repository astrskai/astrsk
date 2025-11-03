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
  UpdateStorageResult,
  DeleteStorageResult,
  GetMemoryResponse,
} from "../../shared/types";
import {
  validateCharacterContainer,
  validateWorldContainer,
} from "./containers";
import { logger } from "../../shared/logger";
import {
  recordCharacterMemoryAdd,
  recordWorldMemoryAdd,
} from "../debug/debug-helpers";

/**
 * Build enriched message content from sections
 * Format: Multi-section structure with optional participants and world context
 *
 * @param sections - Message sections (currentTime, participants, message, worldContext)
 * @returns Formatted enriched message string
 */
export function buildEnrichedMessage(
  sections: EnrichedMessageSections,
): string {
  const parts: string[] = [];

  // Section 1: Current time (required)
  parts.push(sections.currentTime);

  // Section 2: Participants (optional - shows who was present)
  if (sections.participants && sections.participants.trim()) {
    parts.push(sections.participants);
  }

  // Section 3: Message (required)
  parts.push(sections.message);

  // Section 4: World context (optional - character-specific context update)
  if (sections.worldContext && sections.worldContext.trim()) {
    parts.push(sections.worldContext);
  }

  return parts.join("\n\n");
}

/**
 * Store raw message in world container
 *
 * Contract: Store unenriched message for World Agent context
 * Format: "Message: {name}: {content} Scene: {scene}"
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
      !metadata.scene ||
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
        scene: metadata.scene,
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

    console.log("🆔 [Memory Storage] World memory API response:", JSON.stringify(result, null, 2));
    console.log("🆔 [Memory Storage] Extracted ID:", result.id);

    // Record debug event
    recordWorldMemoryAdd({
      containerTag,
      content,
      metadata: {
        speaker: metadata.speaker,
        participants: metadata.participants,
        scene: metadata.scene,
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
 * Contract: Store enriched message with scene context
 * Format: Scene + Participants + Message + World knowledge (optional)
 *
 * @param containerTag - Character container tag ({sessionId}-{characterId})
 * @param enrichedContent - Enriched message content (multiple sections)
 * @param metadata - Message metadata
 * @returns Storage result with id and success status
 */
export async function storeCharacterMessage(
  containerTag: string,
  enrichedContent: string,
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

    // Validate required metadata fields
    if (
      !metadata.speaker ||
      !metadata.participants ||
      metadata.participants.length === 0 ||
      !metadata.scene ||
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
        scene: metadata.scene,
        type: metadata.type,
        isSpeaker: metadata.isSpeaker,
        ...(metadata.permanent !== undefined && {
          permanent: metadata.permanent,
        }),
        ...(metadata.lorebookKey && { lorebookKey: metadata.lorebookKey }),
      },
    });

    console.log("🆔 [Memory Storage] Character memory API response:", JSON.stringify(result, null, 2));
    console.log("🆔 [Memory Storage] Extracted ID:", result.id);

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
        scene: metadata.scene,
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
        ...(metadata.scene && { scene: metadata.scene }),
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
        scene: metadata.scene || "Unknown Scene",
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
 * Format: "{description}. Scene: {scene}"
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
      !metadata.scene
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
        scene: metadata.scene,
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

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Wait for memory to become available (indexed and queryable)
 * Polls until memory exists or timeout
 *
 * @param memoryId - Memory ID to wait for
 * @param maxWaitMs - Maximum wait time in milliseconds (default: 100 seconds)
 * @param pollIntervalMs - Polling interval in milliseconds (default: 10 seconds)
 * @returns True if memory is available, false if timeout
 */
async function waitForMemoryAvailable(
  memoryId: string,
  maxWaitMs: number = 100000, // 100 seconds
  pollIntervalMs: number = 10000  // 10 seconds
): Promise<boolean> {
  const startTime = Date.now();
  let attemptCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attemptCount++;
    try {
      const memory = await memoryClient.memories.get(memoryId);
      // If we got a response, memory is available
      logger.info(`[Memory Polling] Memory ${memoryId} is available (attempt ${attemptCount})`);
      return true;
    } catch (error) {
      const is404 = error instanceof Error && error.message.includes('404');
      if (is404) {
        // 404 means still indexing - keep polling
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        logger.info(
          `[Memory Polling] Memory ${memoryId} not yet available (404) - attempt ${attemptCount} after ${elapsedSeconds}s, waiting...`
        );

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } else {
        // Other errors - assume permanent failure
        logger.error(`[Memory Polling] Unexpected error for ${memoryId}, giving up:`, error);
        return false;
      }
    }
  }

  // Timeout reached
  const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
  logger.warn(
    `[Memory Polling] Timeout after ${totalSeconds}s waiting for memory ${memoryId} (${attemptCount} attempts)`
  );
  return false;
}

/**
 * Get memory by ID
 *
 * @param memoryId - Memory ID to retrieve
 * @returns Memory data or null if not found
 */
export async function getMemoryById(
  memoryId: string,
): Promise<GetMemoryResponse | null> {
  try {
    const result = await memoryClient.memories.get(memoryId);
    logger.info("[Memory Storage] Retrieved memory:", memoryId);
    return result;
  } catch (error) {
    logger.error("[Memory Storage] Failed to get memory:", error);
    return null;
  }
}

/**
 * Update memory by ID
 * Generic update that works for any memory type
 * Waits for memory to be available before updating (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to update
 * @param content - New content (optional)
 * @param metadata - New metadata (optional, merged with existing)
 * @returns Update result with status
 */
export async function updateMemoryById(
  memoryId: string,
  content?: string,
  metadata?: Partial<MemoryMetadata>,
): Promise<UpdateStorageResult> {
  try {
    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for memory ${memoryId} to be available before updating...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] Memory ${memoryId} not available after timeout, cannot update`);
      return {
        id: null,
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.update(memoryId, {
      content,
      metadata,
    });

    logger.info("[Memory Storage] Updated memory:", memoryId);
    return {
      id: result.id,
      success: true,
      status: result.status,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to update memory:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update character message
 * Updates enriched message in character's private container
 * Waits for memory to be available before updating (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to update
 * @param enrichedContent - New enriched content (optional)
 * @param metadata - New metadata (optional)
 * @returns Update result with status
 */
export async function updateCharacterMessage(
  memoryId: string,
  enrichedContent?: string,
  metadata?: Partial<MemoryMetadata>,
): Promise<UpdateStorageResult> {
  try {
    // Validate metadata if provided
    if (metadata) {
      // If isSpeaker is being updated, it must be defined
      if (metadata.isSpeaker === undefined && metadata.type === "message") {
        logger.warn(
          "[Memory Storage] Character message updates should include isSpeaker",
        );
      }
    }

    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for character message ${memoryId} to be available before updating...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] Character message ${memoryId} not available after timeout, cannot update`);
      return {
        id: null,
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.update(memoryId, {
      content: enrichedContent,
      metadata,
    });

    logger.info("[Memory Storage] Updated character message:", memoryId);
    return {
      id: result.id,
      success: true,
      status: result.status,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to update character message:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update world message
 * Updates raw message in world container
 * Waits for memory to be available before updating (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to update
 * @param content - New message content (optional)
 * @param metadata - New metadata (optional)
 * @returns Update result with status
 */
export async function updateWorldMessage(
  memoryId: string,
  content?: string,
  metadata?: Partial<MemoryMetadata>,
): Promise<UpdateStorageResult> {
  try {
    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for world message ${memoryId} to be available before updating...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] World message ${memoryId} not available after timeout, cannot update`);
      return {
        id: null,
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.update(memoryId, {
      content,
      metadata,
    });

    logger.info("[Memory Storage] Updated world message:", memoryId);
    return {
      id: result.id,
      success: true,
      status: result.status,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to update world message:", error);
    return {
      id: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete memory by ID
 * Permanently deletes a single memory (hard delete)
 * Waits for memory to be available before deleting (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to delete
 * @returns Delete result with success status
 */
export async function deleteMemoryById(
  memoryId: string,
): Promise<DeleteStorageResult> {
  try {
    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for memory ${memoryId} to be available before deleting...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] Memory ${memoryId} not available after timeout, cannot delete`);
      return {
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.delete(memoryId);
    logger.info("[Memory Storage] Deleted memory:", memoryId);
    return {
      success: result.success,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to delete memory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete character message
 * Deletes a message from character's private container
 * Waits for memory to be available before deleting (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to delete
 * @returns Delete result with success status
 */
export async function deleteCharacterMessage(
  memoryId: string,
): Promise<DeleteStorageResult> {
  try {
    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for character message ${memoryId} to be available before deleting...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] Character message ${memoryId} not available after timeout, cannot delete`);
      return {
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.delete(memoryId);
    logger.info("[Memory Storage] Deleted character message:", memoryId);
    return {
      success: result.success,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to delete character message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete world message
 * Deletes a message from world container
 * Waits for memory to be available before deleting (polls for up to 100 seconds)
 *
 * @param memoryId - Memory ID to delete
 * @returns Delete result with success status
 */
export async function deleteWorldMessage(
  memoryId: string,
): Promise<DeleteStorageResult> {
  try {
    // Wait for memory to be available (indexed and queryable)
    logger.info(`[Memory Storage] Waiting for world message ${memoryId} to be available before deleting...`);
    const isAvailable = await waitForMemoryAvailable(memoryId);

    if (!isAvailable) {
      logger.error(`[Memory Storage] World message ${memoryId} not available after timeout, cannot delete`);
      return {
        success: false,
        error: "Memory not available after timeout (still indexing or does not exist)",
      };
    }

    const result = await memoryClient.memories.delete(memoryId);
    logger.info("[Memory Storage] Deleted world message:", memoryId);
    return {
      success: result.success,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to delete world message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete all memories in a container
 * Uses bulk delete to remove all memories by container tag
 *
 * @param containerTag - Character or world container tag
 * @returns Delete result with count of deleted memories
 */
export async function deleteByContainer(
  containerTag: string,
): Promise<DeleteStorageResult> {
  try {
    // Validate container tag
    const isCharacterContainer = validateCharacterContainer(containerTag);
    const isWorldContainer = validateWorldContainer(containerTag);

    if (!isCharacterContainer && !isWorldContainer) {
      logger.error(
        "[Memory Storage] Invalid container tag:",
        containerTag,
      );
      return {
        success: false,
        error: "Invalid container tag format",
      };
    }

    const result = await memoryClient.memories.bulkDelete({
      containerTags: [containerTag],
    });

    logger.info(
      `[Memory Storage] Deleted ${result.deletedCount} memories from container:`,
      containerTag,
    );
    return {
      success: result.success,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed to delete by container:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bulk delete memories by IDs
 * Deletes multiple memories at once (max 100 per request)
 *
 * @param memoryIds - Array of memory IDs to delete
 * @returns Delete result with count and any errors
 */
export async function bulkDeleteByIds(
  memoryIds: string[],
): Promise<DeleteStorageResult> {
  try {
    if (memoryIds.length === 0) {
      return {
        success: true,
        deletedCount: 0,
      };
    }

    if (memoryIds.length > 100) {
      logger.warn(
        "[Memory Storage] Bulk delete limited to 100 IDs, truncating",
      );
      memoryIds = memoryIds.slice(0, 100);
    }

    const result = await memoryClient.memories.bulkDelete({
      ids: memoryIds,
    });

    logger.info(
      `[Memory Storage] Bulk deleted ${result.deletedCount} memories`,
    );
    return {
      success: result.success,
      deletedCount: result.deletedCount,
      error: result.errors?.length
        ? `${result.errors.length} memories failed to delete`
        : undefined,
    };
  } catch (error) {
    logger.error("[Memory Storage] Failed bulk delete:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
