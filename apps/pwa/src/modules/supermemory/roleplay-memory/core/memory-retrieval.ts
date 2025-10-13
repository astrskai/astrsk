/**
 * Roleplay Memory System - Memory Retrieval
 *
 * Memory query operations for character recall (START node)
 * and World Agent context (END node).
 *
 * Based on contracts/memory-retrieval.contract.md
 */

import { memoryClient } from "../../shared/client";
import type {
  CharacterMemoryQueryInput,
  CharacterMemoryQueryOutput,
  WorldMemoryQueryInput,
  WorldMemoryQueryOutput,
} from "../../shared/types";
import {
  validateCharacterContainer,
  validateWorldContainer,
} from "./containers";
import { logger } from "@/shared/utils/logger";

/**
 * Format character memory query with current time and recent messages
 *
 * Contract: Query format with three sections
 * 1. Current time: "###Current time###\nGameTime: {gameTime} {interval}"
 * 2. Recent messages: "###Recent messages###\n{formatted messages}"
 * 3. Query instruction: "What are relevant memories..."
 *
 * @param gameTime - Current game time
 * @param interval - Time interval (default: "Day")
 * @param recentMessages - Recent message strings
 * @param characterName - Character name for context
 * @returns Formatted query string
 */
export function formatCharacterQuery(
  gameTime: number,
  interval: string,
  recentMessages: string[],
  characterName: string,
): string {
  const parts: string[] = [];

  // Section 1: Current time
  parts.push("###Current time###");
  parts.push(`GameTime: ${gameTime} ${interval}`);
  parts.push("");

  // Section 2: Recent messages
  if (recentMessages.length > 0) {
    parts.push("###Recent messages###");
    parts.push(recentMessages.join("\n"));
    parts.push("");
  }

  // Section 3: Query instruction
  parts.push(
    `What are the relevant memories that are not in the recent messages to construct ${characterName}'s next message?`,
  );

  return parts.join("\n");
}

/**
 * Retrieve character memories for recall (START node)
 *
 * Contract: Query character's private container
 * - Semantic search with current time + recent messages
 * - Default limit: 5 memories
 * - Graceful degradation: return empty on error
 *
 * @param input - Character memory query input
 * @returns Character memory query output with memories and count
 */
export async function retrieveCharacterMemories(
  input: CharacterMemoryQueryInput,
): Promise<CharacterMemoryQueryOutput> {
  try {
    // Validate character container tag
    if (!validateCharacterContainer(input.containerTag)) {
      logger.error(
        "[Memory Retrieval] Invalid character container tag:",
        input.containerTag,
      );
      return { memories: [], count: 0 };
    }

    // Format query with current time and recent messages
    const query = formatCharacterQuery(
      input.currentGameTime,
      input.currentGameTimeInterval,
      input.recentMessages,
      input.characterName,
    );

    // Build filters if provided
    const filters: any = {};
    if (input.filters?.gameTime) {
      filters.gameTime = input.filters.gameTime;
    }
    if (input.filters?.type) {
      filters.type = input.filters.type;
    }

    // Query Supermemory
    const results = await memoryClient.search.memories({
      q: query,
      containerTag: input.containerTag,
      limit: input.limit,
      ...(Object.keys(filters).length > 0 && { filters }),
    });

    return {
      memories: results.results.map((r: any) => r.memory || r.content),
      count: results.results.length,
    };
  } catch (error) {
    logger.error(
      "[Memory Retrieval] Failed to retrieve character memories:",
      error,
    );
    // Graceful degradation: return empty array
    return { memories: [], count: 0 };
  }
}

/**
 * Retrieve world memories for World Agent context (END node)
 *
 * Contract: Query world container for context
 * - Semantic search with query string
 * - Default limit: 10 memories
 * - Optionally return metadata for analysis
 * - Graceful degradation: return empty on error
 *
 * @param input - World memory query input
 * @returns World memory query output with memories, count, and optional metadata
 */
export async function retrieveWorldMemories(
  input: WorldMemoryQueryInput,
): Promise<WorldMemoryQueryOutput> {
  try {
    // Validate world container tag
    if (!validateWorldContainer(input.containerTag)) {
      logger.error(
        "[Memory Retrieval] Invalid world container tag:",
        input.containerTag,
      );
      return { memories: [], count: 0 };
    }

    // Build filters if provided
    const filters: any = {};
    if (input.filters?.gameTime) {
      filters.gameTime = input.filters.gameTime;
    }
    if (input.filters?.type) {
      filters.type = input.filters.type;
    }

    // Query Supermemory
    const results = await memoryClient.search.memories({
      q: input.query,
      containerTag: input.containerTag,
      limit: input.limit,
      ...(Object.keys(filters).length > 0 && { filters }),
    });

    logger.info(
      `[Memory Retrieval] Retrieved ${results.results.length} world memories`,
    );

    // Extract metadata if requested
    const metadata = results.results.map((r: any) => ({
      gameTime: r.metadata?.gameTime,
      type: r.metadata?.type,
      participants: r.metadata?.participants,
    }));

    return {
      memories: results.results.map((r: any) => r.memory || r.content),
      count: results.results.length,
      metadata,
    };
  } catch (error) {
    logger.error(
      "[Memory Retrieval] Failed to retrieve world memories:",
      error,
    );
    // Graceful degradation: return empty array
    return { memories: [], count: 0 };
  }
}

/**
 * Format retrieved memories for injection into agent prompt
 *
 * Helper function to join memories with clear separators
 *
 * @param memories - Array of memory strings
 * @returns Formatted string for prompt injection
 */
export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return "";
  }

  return memories
    .map((memory, index) => `[Memory ${index + 1}]\n${memory}`)
    .join("\n\n---\n\n");
}
