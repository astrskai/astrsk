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

// Type definitions for Supermemory API responses
type MemoryResultItem = {
  memory?: string;
  content?: string;
  id?: string; // Document ID for v3 GET
  metadata?: { game_time?: number; type?: string; participants?: string[] };
};

type MemorySearchResponse = {
  results: MemoryResultItem[];
};

/**
 * Format character memory query with current time and recent messages
 *
 * Contract: Query format with three sections
 * 1. Current time: "###Current time###\nGameTime: {game_time} {interval}"
 * 2. Recent messages: "###Recent messages###\n{formatted messages}"
 * 3. Query instruction: "What are relevant memories..."
 *
 * @param game_time - Current game time
 * @param interval - Time interval (default: "Day")
 * @param recentMessages - Recent message strings
 * @param characterName - Character name for context
 * @returns Formatted query string
 */
export function formatCharacterQuery(
  game_time: number,
  interval: string,
  recentMessages: string[],
  characterName: string,
): string {
  const parts: string[] = [];

  // Section 1: Current time
  parts.push("###Current time###");
  parts.push(`GameTime: ${game_time} ${interval}`);
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
      input.current_game_time,
      input.current_game_time_interval,
      input.recentMessages,
      input.characterName,
    );

    // TODO: Implement proper filters once Supermemory API filter structure is documented
    // Currently, filters are not supported in the query (Supermemory expects Or | And structure)
    // For POC, we rely on semantic search and content filtering

    // Query Supermemory v4 (with knowledge graph)
    const v4Results = await memoryClient.search.memories({
      q: query,
      containerTag: input.containerTag,
      limit: input.limit,
      rewriteQuery: true,
    });

    // Also query v3 (raw documents) for comparison
    // v3 uses containerTags (plural, array) instead of containerTag (singular, string)
    const v3Results = await memoryClient.search.documents({
      q: query,
      containerTags: [input.containerTag],
      limit: input.limit,
    }).catch((error) => {
      console.warn("[Memory Retrieval] v3 search failed:", error);
      return { results: [] };
    });

    const v4Typed = v4Results as unknown as MemorySearchResponse;
    const v3Typed = v3Results as unknown as any; // v3 has different structure

    console.log("🔍 [DEBUG] v3 raw response:", JSON.stringify(v3Typed, null, 2).substring(0, 500));

    // Log comparison
    console.log("\n━━━━━━━━ CHARACTER MEMORY RETRIEVAL COMPARISON ━━━━━━━━");
    console.log(`Container: ${input.containerTag}`);
    console.log(`Query: ${query.substring(0, 100)}...`);
    console.log(`\n📊 v4 Memory Search (Knowledge Graph): ${v4Typed.results.length} results`);
    v4Typed.results.forEach((r, i) => {
      const preview = (r.memory ?? r.content ?? '').substring(0, 80).replace(/\n/g, ' ');
      console.log(`  ${i+1}. ${preview}...`);
    });

    // v3 has nested chunks array structure: results[].chunks[].content
    const v3Results_array = v3Typed.results || [];
    console.log(`\n📄 v3 Document Search (Raw): ${v3Results_array.length} results`);
    console.log(`   Response structure: ${Object.keys(v3Typed).join(', ')}`);
    v3Results_array.forEach((r: any, i: number) => {
      // v3 structure: each result has chunks[] array with content
      const chunks = r.chunks || [];
      const allChunksText = chunks.map((c: any) => c.content || '').join(' ');
      const preview = allChunksText.substring(0, 80).replace(/\n/g, ' ');
      const documentId = r.documentId || r.id || 'unknown';
      console.log(`  ${i+1}. [${documentId}] ${preview}...`);
      if (i === 0) {
        console.log(`     [DEBUG] Chunks count: ${chunks.length}, First result fields:`, Object.keys(r).join(', '));
      }
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Return v4 results (current behavior)
    return {
      memories: v4Typed.results.map((r) => r.memory ?? r.content ?? ''),
      count: v4Typed.results.length,
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

    // TODO: Implement proper filters once Supermemory API filter structure is documented
    // Currently, filters are not supported in the query (Supermemory expects Or | And structure)
    // For POC, we rely on semantic search and content filtering

    // Query Supermemory v4 (with knowledge graph)
    const v4Results = await memoryClient.search.memories({
      q: input.query,
      containerTag: input.containerTag,
      limit: input.limit,
      rewriteQuery: true,
    });

    // Also query v3 (raw documents) for comparison
    // v3 uses containerTags (plural, array) instead of containerTag (singular, string)
    const v3Results = await memoryClient.search.documents({
      q: input.query,
      containerTags: [input.containerTag],
      limit: input.limit,
    }).catch((error) => {
      console.warn("[Memory Retrieval] v3 world search failed:", error);
      return { results: [] };
    });

    const v4Typed = v4Results as unknown as MemorySearchResponse;
    const v3Typed = v3Results as unknown as any; // v3 has different structure

    console.log("🔍 [DEBUG] v3 world raw response:", JSON.stringify(v3Typed, null, 2).substring(0, 500));

    // Log comparison
    console.log("\n━━━━━━━━ WORLD MEMORY RETRIEVAL COMPARISON ━━━━━━━━");
    console.log(`Container: ${input.containerTag}`);
    console.log(`Query: ${input.query.substring(0, 100)}...`);
    console.log(`\n📊 v4 Memory Search (Knowledge Graph): ${v4Typed.results.length} results`);
    v4Typed.results.forEach((r, i) => {
      const preview = (r.memory ?? r.content ?? '').substring(0, 80).replace(/\n/g, ' ');
      console.log(`  ${i+1}. ${preview}...`);
    });

    // v3 has nested chunks array structure: results[].chunks[].content
    const v3Results_array = v3Typed.results || [];
    console.log(`\n📄 v3 Document Search (Raw): ${v3Results_array.length} results`);
    console.log(`   Response structure: ${Object.keys(v3Typed).join(', ')}`);
    v3Results_array.forEach((r: any, i: number) => {
      // v3 structure: each result has chunks[] array with content
      const chunks = r.chunks || [];
      const allChunksText = chunks.map((c: any) => c.content || '').join(' ');
      const preview = allChunksText.substring(0, 80).replace(/\n/g, ' ');
      const documentId = r.documentId || r.id || 'unknown';
      console.log(`  ${i+1}. [${documentId}] ${preview}...`);
      if (i === 0) {
        console.log(`     [DEBUG] Chunks count: ${chunks.length}, First result fields:`, Object.keys(r).join(', '));
      }
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Extract metadata if requested (from v4 results)
    const metadata = v4Typed.results.map((r) => ({
      game_time: r.metadata?.game_time ?? 0,
      type: r.metadata?.type ?? '',
      participants: r.metadata?.participants ?? [],
    }));

    // Return v4 results (current behavior)
    return {
      memories: v4Typed.results.map((r) => r.memory ?? r.content ?? ''),
      count: v4Typed.results.length,
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
