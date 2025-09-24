import Supermemory from "supermemory";
import { logger } from "@/shared/utils/logger";

// Initialize Supermemory client
const memoryClient = new Supermemory({
  apiKey: import.meta.env.VITE_SUPERMEMORY_API_KEY,
});

// Check if memory service is configured
export const isMemoryServiceEnabled = (): boolean => {
  return !!import.meta.env.VITE_SUPERMEMORY_API_KEY;
};

/**
 * Store conversation turns to Supermemory
 * @param sessionId - The session ID
 * @param turns - Array of conversation turns (messages)
 * @param agentId - Optional agent ID for metadata
 */
export async function storeConversationMemory(
  sessionId: string,
  turns: Array<{ role: string; content: string }>,
  agentId?: string,
): Promise<void> {
  if (!isMemoryServiceEnabled()) {
    console.log("🔴 [Supermemory] Service not configured, skipping storage");
    logger.debug("[Supermemory] Service not configured, skipping storage");
    return;
  }

  try {
    // Format turns as conversation pairs (take last 2 messages)
    if (turns.length < 2) {
      console.log("⚠️ [Supermemory] Not enough turns to store");
      logger.debug("[Supermemory] Not enough turns to store");
      return;
    }

    const lastTwoTurns = turns.slice(-2);
    // Include session ID in the content for better retrieval
    const memoryContent =
      `Session ${sessionId} conversation:\n` +
      lastTwoTurns.map((turn) => `[${turn.role}]: ${turn.content}`).join("\n");

    console.log("📝 [Supermemory] Storing memory for session:", sessionId);
    console.log(
      "📝 [Supermemory] Memory content:",
      memoryContent.substring(0, 100) + "...",
    );
    if (agentId) {
      console.log("📝 [Supermemory] Agent ID:", agentId);
    }

    // Store to Supermemory using the correct API
    const response = await memoryClient.memories.add({
      content: memoryContent,
      containerTag: `session-${sessionId}`,
      metadata: {
        sessionId,
        agentId: agentId || "unknown",
        timestamp: Date.now(),
        turnCount: turns.length,
      },
    });

    console.log(
      "✅ [Supermemory] Successfully stored memory for agent",
      agentId,
      "with ID:",
      response.id,
    );
    logger.info(`[Supermemory] Stored memory for agent ${agentId}`);
  } catch (error) {
    console.error("❌ [Supermemory] Failed to store memory:", error);
    logger.error("[Supermemory] Failed to store memory:", error);
    // Don't throw - graceful degradation
  }
}

/**
 * Retrieve relevant memories for a session
 * @param sessionId - The session ID
 * @param query - Optional search query (defaults to recent memories)
 * @param limit - Maximum number of memories to retrieve
 */
export async function retrieveSessionMemories(
  sessionId: string,
  query?: string,
  limit: number = 5,
): Promise<string[]> {
  if (!isMemoryServiceEnabled()) {
    console.log(
      "🔴 [Supermemory] Service not configured, returning empty memories",
    );
    logger.debug(
      "[Supermemory] Service not configured, returning empty memories",
    );
    return [];
  }

  try {
    console.log("🔍 [Supermemory] Retrieving memories for session:", sessionId);
    console.log("🔍 [Supermemory] Query:", query || "No specific query");
    console.log("🔍 [Supermemory] Limit:", limit);

    // Build search query - if user provides a query, combine it with session context
    let searchQuery: string;
    if (query) {
      // User provided a specific query - search for it within this session's context
      searchQuery = `${query} session ${sessionId}`;
      console.log(
        "🔍 [Supermemory] Searching with user query in session context",
      );
    } else {
      // No specific query - just get all memories for this session
      searchQuery = `Session ${sessionId}`;
      console.log("🔍 [Supermemory] Searching for all session conversations");
    }

    console.log("🔍 [Supermemory] Search query:", searchQuery);

    // First, let's try to get ALL memories to see what's there
    console.log(
      "🔍 [Supermemory] First attempting to retrieve all memories...",
    );
    const allMemoriesResults = await memoryClient.search.memories({
      q: "What were we doing?", // Search for common terms we store
      limit: 100, // Get many results
    });

    console.log("🔍 [Supermemory] All memories search response:", {
      count: allMemoriesResults.results?.length || 0,
      timing: allMemoriesResults.timing,
      total: allMemoriesResults.total,
    });

    // Now do the actual search
    const searchResults = await memoryClient.search.memories({
      q: searchQuery,
      limit: 20, // Increase limit to see more results
    });

    console.log("🔍 [Supermemory] Full search response:", searchResults);

    const results = searchResults.results || [];

    console.log(
      `📊 [Supermemory] Raw search returned ${results.length} results`,
    );

    // Log first few results to debug
    if (results.length > 0) {
      console.log("📊 [Supermemory] Sample results:");
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`  Result ${index + 1}:`, {
          memory: result.memory?.substring(0, 100) + "...",
          metadata: result.metadata,
          similarity: result.similarity,
        });
      });
    }

    if (!results || results.length === 0) {
      console.log("📭 [Supermemory] No memories found for session", sessionId);
      logger.debug(`[Supermemory] No memories found for session ${sessionId}`);
      return [];
    }

    // Extract memory content and filter for this session
    const memories = results
      .map((result: any) => result.memory || "")
      .filter(Boolean)
      .filter((memory: string) => {
        // When a specific query is provided, be more lenient with filtering
        // to allow semantic search to work properly
        if (query) {
          // For specific queries, include any result that seems relevant
          // The search engine already filtered by relevance
          return true;
        } else {
          // For session-only queries, strictly filter to this session
          const isForThisSession = memory.includes(`Session ${sessionId}`);
          if (!isForThisSession && memory.length > 0) {
            console.log(
              `🔍 [Supermemory] Filtering out memory not for this session:`,
              memory.substring(0, 50) + "...",
            );
          }
          return isForThisSession;
        }
      })
      .slice(0, limit); // Apply limit after filtering
    console.log(
      `📚 [Supermemory] Retrieved ${memories.length} memories for session ${sessionId}`,
    );
    memories.forEach((memory, index) => {
      console.log(
        `📚 [Supermemory] Memory ${index + 1}:`,
        memory.substring(0, 100) + "...",
      );
    });
    logger.info(
      `[Supermemory] Retrieved ${memories.length} memories for session ${sessionId}`,
    );

    return memories;
  } catch (error) {
    console.error("❌ [Supermemory] Failed to retrieve memories:", error);
    logger.error("[Supermemory] Failed to retrieve memories:", error);
    // Don't throw - graceful degradation
    return [];
  }
}

/**
 * Format memories for injection into agent prompt
 * @param memories - Array of memory strings
 */
export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return "";
  }

  const header = "=== Previous Conversation Context ===\n";
  const content = memories.join("\n---\n");
  const footer = "\n=== End Context ===\n";

  return header + content + footer;
}
