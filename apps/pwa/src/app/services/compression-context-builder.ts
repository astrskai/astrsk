import { UniqueEntityID } from "@/shared/domain";
import { sanitizeToXmlTag } from "@/shared/lib";
import { fetchSessionCharacterRegistry } from "@/entities/session/api/query-factory";
import { CompressionSystem } from "@/entities/compression";
import { useCompressionStore } from "@/entities/compression/stores/compression-store";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { RenderContext, HistoryItem } from "@/shared/prompt/domain";

/**
 * Context enriched with compression data for chat completion
 */
export interface ContextWithCompression extends RenderContext {
  compressionContext?: string;
}

/**
 * Convert history items to XML format
 * Format: <characterName>\nmessage\n</characterName>\n\n
 */
function buildXmlFromHistory(messages: HistoryItem[]): string {
  return messages
    .map((msg) => {
      const rawName = msg.char_name || (msg.char_id ? 'user' : 'scenario');
      const msgCharacterName = sanitizeToXmlTag(rawName);
      const content = msg.content || '';
      return `<${msgCharacterName}>\n${content}\n</${msgCharacterName}>`;
    })
    .join('\n\n');
}

/**
 * Build compressed or uncompressed context for chat completion agents
 *
 * Rules:
 * - If ≤4 messages: inject last 4 uncompressed messages
 * - If >4 messages (e.g., 7 messages):
 *   - Old messages (1-3): Compressed XML with relevant anchors decompressed inline
 *   - Recent messages (4-7): Fully uncompressed
 *   - Retrieval agent analyzes BOTH compressed (1-3) AND uncompressed (4-7) to identify relevant anchors
 *   - Final context: Hybrid compressed (with relevant anchors decompressed) + Fully uncompressed last 4
 * - If compression fails/unavailable and >20 messages: use last 20 uncompressed (safety limit)
 *
 * Compression is always enabled by default (90% size reduction).
 */
export async function buildCompressionContext(params: {
  sessionId: UniqueEntityID;
  fullContext: RenderContext;
  userQuery?: string;
  characterName?: string;
}): Promise<ContextWithCompression> {
  const { sessionId, fullContext } = params;
  // Extract userQuery from last message in history (user's latest input)
  const userQuery = params.userQuery || fullContext.history?.[fullContext.history.length - 1]?.content;

  // Extract characterName from speaking character
  const characterName = params.characterName || fullContext.char?.name;

  if (!fullContext.history) {
    return fullContext;
  }

  const messageCount = fullContext.history.length;

  if (messageCount > 4) {
    // Use hybrid compressed + uncompressed context
    // Example for 7 messages: messages 1-3 compressed, messages 4-7 uncompressed
    const compressedMessageCount = messageCount - 4;
    console.log(`[Compression] Session has ${messageCount} messages: ${compressedMessageCount} compressed + last 4 uncompressed`);

    try {
      // Get character registry from TanStack Query cache (or DB if not cached)
      const characterRegistry = await fetchSessionCharacterRegistry(sessionId.toString());

      // Initialize compression system with turnRepo for fetching stored compressedText
      const compressionSystem = new CompressionSystem();
      const turnRepo = new DrizzleTurnRepo();
      compressionSystem.initialize({
        sessionId: sessionId.toString(),
        characterRegistry,
        turnRepo,
      });

      // Build compressed XML context from ONLY the old messages (not last 4)
      // This fetches stored compressedText for the first compressedMessageCount turns
      // Filter by characterName to only include anchors accessible to the speaking character
      // includeFirstN=compressedMessageCount ensures only the first N messages are compressed
      const compressedContext = await compressionSystem.buildCompressedContext(characterName, compressedMessageCount);

      if (!compressedContext || !userQuery || !characterName) {
        // If no compressed context or missing required params, fall back to uncompressed
        console.warn("[Compression] Missing required params for retrieval, using uncompressed context");
        return fullContext;
      }

      // Build uncompressed context for last 4 messages
      const last4Messages = fullContext.history.slice(-4);
      const last4Uncompressed = buildXmlFromHistory(last4Messages);

      // Retrieve relevant anchors and decompress them inline (hybrid format)
      // Pass BOTH compressed context AND recent uncompressed messages to retrieval agent
      // This gives the LLM full context to make informed decisions about which anchors are relevant
      const hybridCompressedContext = await compressionSystem.retrieveContext(
        userQuery,
        characterName,
        compressedContext,
        last4Uncompressed,  // Retrieval agent analyzes both compressed AND uncompressed
      );

      // Combine: hybrid compressed context + last 4 uncompressed
      const finalContext = `${hybridCompressedContext}\n\n${last4Uncompressed}`;

      // Store the hybrid compressed context (without last 4) in the compression store
      // This will be used by compressTurn as previousContext for the compression agent
      useCompressionStore.getState().setCompressionContext(hybridCompressedContext);

      // Inject combined context
      const contextWithCompression = {
        ...fullContext,
        compressionContext: finalContext,
      };

      console.log(`[Compression] Built hybrid context: ${compressedMessageCount} compressed (${hybridCompressedContext.length} chars) + 4 uncompressed (${last4Uncompressed.length} chars) = ${finalContext.length} total chars`);

      // Emit context event for debug panel
      const contextEvent = new CustomEvent("compression-context-built", {
        detail: {
          sessionId: sessionId.toString(),
          messageCount,
          type: "compressed",
          context: finalContext,
          compressedContextXML: compressedContext,
          characterName,
          userQuery,
        },
      });
      window.dispatchEvent(contextEvent);

      return contextWithCompression;
    } catch (error) {
      console.error("[Compression] Failed to build compressed context:", error);
      console.error("[Compression] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: sessionId.toString(),
        userQuery,
        characterName,
      });
      // Fall back to uncompressed on error
      return fullContext;
    }
  } else {
    // Use last 4 uncompressed messages
    console.log(`[Compression] Session has ${messageCount} messages (≤4), using uncompressed context`);

    // Take last 4 messages from history and build uncompressed XML context
    const last4Messages = fullContext.history.slice(-4);
    const uncompressedContext = buildXmlFromHistory(last4Messages);

    // Inject as additional context
    const contextWithCompression = {
      ...fullContext,
      compressionContext: uncompressedContext,
    };

    console.log(`[Compression] Injected ${last4Messages.length} uncompressed messages as context`);

    // Emit context event for debug panel
    // Extract character names from the last 4 messages
    const characterNames = last4Messages
      .map((msg: any) => msg.char_name || (msg.char_id ? 'user' : 'scenario'))
      .join(", ");

    const contextEvent = new CustomEvent("compression-context-built", {
      detail: {
        sessionId: sessionId.toString(),
        messageCount,
        type: "uncompressed",
        context: uncompressedContext,
        characterName: characterNames,
      },
    });
    window.dispatchEvent(contextEvent);

    return contextWithCompression;
  }
}
