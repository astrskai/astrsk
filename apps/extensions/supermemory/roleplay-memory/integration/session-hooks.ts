/**
 * Roleplay Memory System - Session Integration Hooks
 *
 * Integration hooks for session lifecycle:
 * - Session initialization (container creation, init content storage)
 * - START node (memory recall)
 * - END node (World Agent execution, memory distribution)
 *
 * Based on quickstart.md integration guide
 */

import { formatMessageWithGameTime } from "../../shared/utils";
import type {
  SessionInitInput,
  MemoryRecallInput,
  MemoryDistributionInput,
  UpdateStorageResult,
  DeleteStorageResult,
  GetMemoryResponse,
  MemoryMetadata,
} from "../../shared/types";
import {
  createCharacterContainer,
  createWorldContainer,
} from "../core/containers";
import {
  storeInitContent,
  storeWorldMessage,
  storeCharacterMessage,
  buildEnrichedMessage,
  getMemoryById,
  updateMemoryById,
  deleteMemoryById,
  updateCharacterMessage,
  updateWorldMessage,
  deleteCharacterMessage,
  deleteWorldMessage,
  deleteByContainer,
  bulkDeleteByIds,
} from "../core/memory-storage";
import { retrieveCharacterMemories } from "../core/memory-retrieval";
import { UniqueEntityID } from "../../shared/domain-types";
import { executeWorldAgent, type CallAIFunction } from "../core/world-agent";
import { logger } from "../../shared/logger";
import {
  recordSessionInit,
  recordMemoryRecall,
  recordWorldMemoryAdd,
} from "../debug/debug-helpers";
import { memoryClient } from "../../shared/client";

/**
 * Store scenario messages for a session
 *
 * Stores scenario messages to world and character containers.
 * Containers are created implicitly (lazy initialization).
 * This is called when a scenario is added to a session.
 *
 * @param input - Scenario storage input
 */
export async function storeScenarioMessages(input: {
  sessionId: string;
  participants: string[];
  characterIds: string[];
  scenario: {
    messages: Array<{ content: string; role: "system" | "user" | "assistant" }>;
  };
}): Promise<string[]> {
  try {
    const { sessionId, participants, characterIds, scenario } = input;

    logger.info(`[Scenario Storage] Storing scenario for session: ${sessionId}`);

    // Create world container tag
    const worldContainer = createWorldContainer(sessionId);

    // Store scenario messages in world container
    const worldStorePromises = scenario.messages.map((message) => {
      const content = `[Scenario] ${message.content}`;
      return memoryClient.memories.add({
        containerTag: worldContainer,
        content,
        metadata: {
          type: "scenario",
          permanent: true,
          game_time: 0,
          game_time_interval: "Day",
        },
      }).then((result) => {
        // Record debug event
        recordWorldMemoryAdd({
          containerTag: worldContainer,
          content,
          metadata: {
            speaker: "system",
            participants,
            game_time: 0,
            game_time_interval: "Day",
            type: "scenario",
          },
          storageId: result.id,
        });
        return result.id;
      });
    });

    // Store scenario messages in each character container
    const characterStorePromises = characterIds.flatMap((characterId) => {
      const characterContainer = createCharacterContainer(sessionId, characterId);

      return scenario.messages.map((message) =>
        storeInitContent(characterContainer, message.content, {
          speaker: characterId,
          participants,
          game_time: 0,
          game_time_interval: "Day",
          type: "scenario",
          permanent: true,
        })
      );
    });

    // Execute all storage operations in parallel
    const results = await Promise.all([...worldStorePromises, ...characterStorePromises]);

    // Flatten and collect all memory IDs
    // NOTE: worldStorePromises returns string IDs, characterStorePromises returns StorageResult objects
    const memoryIds = results.flat()
      .map(result => {
        // Handle string IDs (from world container)
        if (typeof result === 'string') {
          return result;
        }
        // Handle StorageResult objects (from character containers)
        if (result && typeof result === 'object' && result.success && result.id) {
          return result.id;
        }
        return null;
      })
      .filter((id): id is string => id !== null);

    logger.info(
      `[Scenario Storage] Successfully stored scenario messages for ${characterIds.length} characters (${memoryIds.length} memories)`
    );

    return memoryIds;
  } catch (error) {
    logger.error("[Scenario Storage] Failed to store scenario messages:", error);
    throw error;
  }
}

/**
 * Initialize roleplay memory system for a new session
 *
 * Creates containers and stores initialization content:
 * - World container: {sessionId}-world
 * - Character containers: {sessionId}-{charascterId} (one per character)
 * - Stores scenario messages, character cards, lorebook entries
 * - All init content marked with permanent: true
 *
 * NOTE: This function is mostly deprecated in favor of lazy initialization.
 * Use storeScenarioMessages() for scenario storage instead.
 *
 * @param input - Session initialization input
 */
export async function initializeRoleplayMemory(
  input: SessionInitInput,
): Promise<void> {
  try {
    const { sessionId, participants, characters, scenario } = input;

    logger.info(
      `[Session Init] Initializing roleplay memory for session: ${sessionId}`,
    );

    // Create world container
    const worldContainer = createWorldContainer(sessionId);
    logger.info(`[Session Init] Created world container: ${worldContainer}`);

    // Collect all world container init promises
    const worldInitPromises: Promise<any>[] = [];

    // Store scenario messages in world container (if scenario exists)
    if (scenario?.messages && scenario.messages.length > 0) {
      worldInitPromises.push(
        ...scenario.messages.map((message) => {
          const content = `[Scenario] ${message.content}`;
          return memoryClient.memories.add({
            containerTag: worldContainer,
            content,
            metadata: {
              type: "scenario",
              permanent: true,
              game_time: 0,
              game_time_interval: "Day",
            },
          }).then((result) => {
            // Record debug event for world memory
            recordWorldMemoryAdd({
              containerTag: worldContainer,
              content,
              metadata: {
                speaker: "system",
                participants: participants,
                game_time: 0,
                game_time_interval: "Day",
                type: "scenario",
              },
              storageId: result.id,
            });
            return result;
          });
        }),
      );
    }

    // NOTE: Character cards and lorebook entries are NO LONGER stored at initialization
    // They will be fetched fresh during memory recall to ensure up-to-date data
    // Only scenario messages are stored as they represent actual narrative content

    // Initialize each character's memory container and collect all storage operations
    const initPromises = characters.flatMap((character) => {
      const characterContainer = createCharacterContainer(
        sessionId,
        character.characterId,
      );
      logger.info(
        `[Session Init] Created character container: ${characterContainer}`,
      );

      const promises: Promise<any>[] = [];

      // Store scenario messages (if scenario exists)
      if (scenario?.messages && scenario.messages.length > 0) {
        promises.push(
          ...scenario.messages.map((message) =>
            storeInitContent(characterContainer, message.content, {
              speaker: character.characterId,
              participants: participants,
              game_time: 0,
              game_time_interval: "Day",
              type: "scenario",
              permanent: true,
            }),
          ),
        );
      }

      // NOTE: Character cards and lorebook are NO LONGER stored here
      // They will be fetched fresh during memory recall

      return promises;
    });

    // Execute all storage operations in parallel (world + character init)
    await Promise.all([...worldInitPromises, ...initPromises]);

    logger.info(
      `[Session Init] Successfully initialized world container with ${worldInitPromises.length} items and ${characters.length} character containers`,
    );

    // Record debug event
    recordSessionInit({
      sessionId,
      characters: characters.map((char) => ({
        characterId: char.characterId,
        characterName: char.characterName,
        containerTag: createCharacterContainer(sessionId, char.characterId),
        scenarioMessages: scenario?.messages?.length || 0,
        // NOTE: Character cards and lorebooks are no longer stored at init
        // They are fetched fresh during memory recall
      })),
      worldContainerTag: worldContainer,
    });

    // NOTE: scenario:initialized hook should be triggered by core code, not extension code
    // Removed to avoid circular dependency (extension importing from core to trigger hooks)
  } catch (error) {
    logger.error("[Session Init] Failed to initialize roleplay memory:", error);
    throw error;
  }
}

/**
 * Recall character memories for START node (before agent execution)
 *
 * Queries character's private container and retrieves top N relevant memories
 * based on current time and recent conversation context.
 * Returns formatted string with memories and current world context.
 *
 * @param input - Memory recall input
 * @returns Formatted memory string (empty string on error)
 */
export async function recallCharacterMemories(
  input: MemoryRecallInput,
): Promise<string> {
  try {
    const {
      sessionId,
      characterId,
      characterName,
      current_game_time,
      current_game_time_interval,
      recentMessages,
      limit = 20,
      worldContext,
    } = input;

    // Format recent messages
    const formattedMessages = recentMessages.map((msg) =>
      formatMessageWithGameTime(
        msg.role,
        msg.content,
        msg.game_time,
        current_game_time_interval,
      ),
    );

    // Query character's private container
    const containerTag = createCharacterContainer(sessionId, characterId);
    const result = await retrieveCharacterMemories({
      containerTag,
      current_game_time,
      current_game_time_interval,
      recentMessages: formattedMessages,
      characterName,
      limit,
    });

    // Get lorebook entries from character card (fetch fresh to ensure up-to-date data)
    let lorebookEntries: Array<{ content: string }> = [];
    if (input.getCard) {
      try {
        const cardResult = await input.getCard(characterId);
        if (cardResult.isSuccess) {
          const card = cardResult.getValue();
          const cardLorebook = card.props?.lorebook?.entries || card.lorebook?.entries || [];
          lorebookEntries = cardLorebook.map((entry: any) => ({
            content: entry.content || entry.text || ""
          }));
          console.log(`📚 [Memory Recall] Fetched character card fresh - found ${lorebookEntries.length} lorebook entries for ${characterName}`);
        }
      } catch (error) {
        logger.warn(`[Memory Recall] Failed to fetch character card for ${characterName}:`, error);
      }
    }

    // Format memories (simple sentences from Supermemory)
    const { formatMemoriesForPrompt } = await import(
      "../core/memory-retrieval"
    );
    const formattedMemoriesRaw = formatMemoriesForPrompt(result.memories);

    // Wrap memories in XML tags with instructions
    let formattedMemories = "";

    if (formattedMemoriesRaw) {
      // Add verbatim memories if available (for direct quotation)
      let verbatimSection = "";
      if (result.verbatimMemories && result.verbatimMemories.length > 0) {
        // Parse verbatim memories to extract only the actual message content
        // (removes game time, world context, and other metadata)
        const { parseVerbatimMemories } = await import("../../shared/utils");
        const cleanMessages = parseVerbatimMemories(result.verbatimMemories);

        if (cleanMessages.length > 0) {
          const formattedVerbatim = formatMemoriesForPrompt(cleanMessages);
          verbatimSection = `

### Verbatim Memories (for direct quotation)
Use these verbatim memories when you need to reference or quote past events directly. These are the exact original message contents, suitable for quoting snippets.

${formattedVerbatim}`;
        }
      }

      formattedMemories = `<MEMORY>
These are past memories retrieved from the conversation history. Use them to maintain continuity and recall previous events, but do NOT repeat them verbatim in your response.

${formattedMemoriesRaw}${verbatimSection}
</MEMORY>`;
    }

    // Add lorebook entries as a separate XML section
    if (lorebookEntries.length > 0) {
      // Escape XML special characters to prevent injection
      const escapeXml = (unsafe: string): string => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      };

      const lorebookContent = lorebookEntries
        .map((entry) => `- ${escapeXml(entry.content)}`)
        .join("\n");

      const lorebookSection = `<IMPORTANT_MEMORIES>
These are permanent facts about ${escapeXml(characterName)}. Use this knowledge to inform your responses and maintain character consistency. These are NOT dialogue - they are factual information for you to reference.

${lorebookContent}
</IMPORTANT_MEMORIES>`;

      if (formattedMemories) {
        formattedMemories = `${formattedMemories}\n\n${lorebookSection}`;
      } else {
        formattedMemories = lorebookSection;
      }
    }

    // Append character-specific world context if available
    let appendedWorldContext: string | undefined;
    if (worldContext) {
      const { getCharacterContext } = await import("../utils/world-context");
      const characterWorldContext = getCharacterContext(
        worldContext,
        characterName,
      );

      if (characterWorldContext) {
        // Add current character context once at the end
        const contextSection = `###Current ${characterName}'s context###\n${characterWorldContext}`;

        if (formattedMemories) {
          formattedMemories = `${formattedMemories}\n\n---\n\n${contextSection}`;
        } else {
          formattedMemories = contextSection;
        }

        appendedWorldContext = characterWorldContext;

      }
    }

    // Record debug event
    recordMemoryRecall({
      characterId,
      characterName,
      containerTag,
      query: formattedMessages.join("\n"),
      retrievedCount: result.count,
      memories: result.memories,
      worldContext: appendedWorldContext,
      lorebookCount: lorebookEntries.length,
    });

    return formattedMemories;
  } catch (error) {
    logger.error("[Memory Recall] Failed to recall memories:", error);
    // Graceful degradation: return empty string
    return "";
  }
}

/**
 * Format memories for prompt injection
 * Re-exported from memory-retrieval for convenience
 */
export { formatMemoriesForPrompt } from "../core/memory-retrieval";

/**
 * Distribute memories after message generation (END node)
 *
 * Executes World Agent to detect participants, then:
 * 1. Stores raw message in world container
 * 2. Builds and stores enriched messages for each participant
 *
 * @param input - Memory distribution input
 * @returns Array of all memory IDs created (world + all character memories)
 */
export async function distributeMemories(
  input: MemoryDistributionInput,
): Promise<string[]> {
  try {
    const {
      sessionId,
      speakerCharacterId,
      speakerName,
      message,
      game_time,
      game_time_interval,
      dataStore,
      worldAgentOutput,
      getCard,
      session,
    } = input;

    // Use the provided World Agent output (already executed in session-play-service)
    const { actualParticipants, worldContextUpdates } = worldAgentOutput;

    // dataStore.participants now contains NAMES (not IDs)
    // We need to get character IDs from session.characterCards for creating containers
    const allParticipantNames = dataStore.participants || [];

    // Build name-to-ID mapping by looking up session's character cards
    const nameToId: Record<string, string> = {};

    // If session and getCard are provided, use them to build name-to-ID mapping
    if (session && getCard) {
      // Add user character if it exists
      if (session.userCharacterCardId) {
        try {
          const userCardResult = await getCard(session.userCharacterCardId);
          if (userCardResult.isSuccess) {
            const userCard = userCardResult.getValue();
            const userName = userCard.name || userCard.props?.name || userCard.props?.title || "User";
            nameToId[userName] = session.userCharacterCardId.toString();
          }
        } catch (error) {
          logger.warn(
            `[Memory Distribution] Failed to fetch user card for ${session.userCharacterCardId.toString()}`,
          );
        }
      }

      // Add AI character cards
      const aiCardIds = session.aiCharacterCardIds || session.characterCards?.map((c: any) => c.id) || [];
      for (const charCardId of aiCardIds) {
        try {
          const cardResult = await getCard(charCardId);
          if (cardResult.isSuccess) {
            const card = cardResult.getValue();
            const name = card.name || card.props?.name || card.props?.title || "Unknown";
            const idString = typeof charCardId === 'string' ? charCardId : charCardId.toString();
            nameToId[name] = idString;
          }
        } catch (error) {
          logger.warn(
            `[Memory Distribution] Failed to fetch card`,
          );
        }
      }
    }

    // Convert participant names to IDs for container creation
    const participantIds = actualParticipants
      .map((name) => nameToId[name])
      .filter((id) => id !== undefined);

    // If no participants were mapped but we have names, log a warning
    if (participantIds.length === 0 && actualParticipants.length > 0) {
      logger.warn(
        `[Memory Distribution] Could not map any participant names to IDs. Names: ${actualParticipants.join(", ")}`,
      );
    }

    // IMPORTANT: Ensure speaker is always included in participants
    // World memory requires at least 1 participant to be valid
    if (!participantIds.includes(speakerCharacterId)) {
      participantIds.push(speakerCharacterId);
      logger.info(`[Memory Distribution] Added speaker ${speakerName} (${speakerCharacterId}) to participants`);
    }

    // If still no participants after adding speaker, this is an error
    if (participantIds.length === 0) {
      logger.error(`[Memory Distribution] No participants detected and speaker ID is invalid`);
    }

    logger.info(`[Memory Distribution] Final participant IDs for world memory: ${participantIds.length} participants`);
    logger.info(`   Speaker: ${speakerName} (${speakerCharacterId})`);
    logger.info(`   Participants: ${participantIds.join(", ")}`);

    // Store raw message in world container
    const worldContainer = createWorldContainer(sessionId);
    const worldMessageContent = formatMessageWithGameTime(
      speakerName,
      message,
      game_time,
      game_time_interval,
    );

    const worldStoreResult = await storeWorldMessage(worldContainer, worldMessageContent, {
      speaker: speakerCharacterId,
      participants: participantIds,
      game_time,
      game_time_interval,
      type: "message",
    });

    if (!worldStoreResult.success) {
      logger.error("[Memory Distribution] Failed to store world message:", worldStoreResult.error);
      logger.error(`   Container: ${worldContainer}`);
      logger.error(`   Speaker: ${speakerCharacterId}`);
      logger.error(`   Participants: ${participantIds.join(", ")}`);
    } else if (worldStoreResult.id) {
      logger.info(`[Memory Distribution] World memory created with ID: ${worldStoreResult.id}`);
    }

    // Build context update map by character name
    const contextByName: Record<string, string> = {};
    if (worldContextUpdates) {
      for (const update of worldContextUpdates) {
        contextByName[update.characterName] = update.contextUpdate;
      }
    }

    // Get character name from ID helper
    const idToName: Record<string, string> = {};
    for (const [name, id] of Object.entries(nameToId)) {
      idToName[id] = name;
    }

    // Distribute enriched memories to participants in parallel
    const enrichedContentsForDebug: Array<{
      characterName: string;
      characterId: string;
      content: string;
      worldContext?: string;
    }> = [];

    const distributionPromises = participantIds.map((participantId) => {
      // Build enriched message sections
      const currentTimeSection = `###Current time###\nGameTime: ${game_time} ${game_time_interval}`;
      // For character containers, use message WITHOUT embedded game time (since we have separate ###Current time### section)
      const characterMessageContent = `Message: ${speakerName}: ${message}`;
      const messageSection = `###Message###\n${characterMessageContent}`;

      // Get participant-specific world context by name
      const participantName = idToName[participantId] || "Unknown";
      const contextUpdate = contextByName[participantName] || "";

      // Only use World Agent's character-specific context update
      // If no update available, don't add world context section
      // (accumulated context will be available on next turn via world_context in dataStore)
      const worldContextSection = contextUpdate
        ? `###World context###\n${contextUpdate}`
        : undefined;

      // Build enriched message
      const enrichedContent = buildEnrichedMessage({
        currentTime: currentTimeSection,
        message: messageSection,
        worldContext: worldContextSection,
      });

      // Track for debug event
      enrichedContentsForDebug.push({
        characterName: participantName,
        characterId: participantId,
        content: enrichedContent,
        worldContext: contextUpdate || undefined,
      });

      // Store in participant's container
      const participantContainer = createCharacterContainer(
        sessionId,
        participantId,
      );

      return storeCharacterMessage(participantContainer, enrichedContent, {
        speaker: speakerCharacterId,
        participants: participantIds,
        isSpeaker: participantId === speakerCharacterId,
        game_time,
        game_time_interval,
        type: "message",
      }).then(result => ({ participantId, result }));
    });

    const characterResults = await Promise.all(distributionPromises);

    // Collect all memory IDs (world + character)
    const allMemoryIds: string[] = [];

    // Add world memory ID
    if (worldStoreResult.id) {
      allMemoryIds.push(worldStoreResult.id);
    }

    // Add character memory IDs
    for (const { participantId, result } of characterResults) {
      if (result.success && result.id) {
        allMemoryIds.push(result.id);
      }
    }

    // Debug event removed - memory distribution info already shown in Character Memory Add events
    // recordMemoryDistribution({
    //   speakerName,
    //   message,
    //   participantIds,
    //   participantNames: actualParticipants,
    //   worldMessageContent,
    //   enrichedContents: enrichedContentsForDebug,
    // });

    return allMemoryIds;
  } catch (error) {
    logger.error("[Memory Distribution] Failed to distribute memories:", error);
    // Don't throw - graceful degradation (memory distribution is enhancement, not requirement)
    return [];
  }
}

/**
 * User message memory processing input
 */
export interface UserMessageMemoryInput {
  sessionId: string;
  messageContent: string;
  session: any; // Session entity
  flow?: any; // Flow entity (optional)
  previousDataStore?: any[]; // Previous turn's dataStore to use as baseline
}

/**
 * Process user message for roleplay memory system
 *
 * Handles user messages sent directly (not through flows):
 * - Retrieves world memories for context
 * - Executes World Agent to detect participants and extract context
 * - Distributes memories to all detected participants
 * - Stores in world container and character containers
 * - Returns suggested dataStore updates (gameTime, participants, worldContext)
 *
 * @param input - User message memory input
 * @returns Suggested dataStore updates or null
 */
/**
 * NOTE: processUserMessage has been removed from the extension version.
 * It is only called by core code and exists in apps/pwa/src/modules/supermemory/roleplay-memory/integration/session-hooks.ts
 * Keeping it here would create build errors due to @/ imports that cannot be resolved in the extension context.
 *
 * If you need to call this function, import it from the core module instead.
 */

// ============================================================================
// Memory Update & Delete Operations
// ============================================================================

/**
 * Get memory by ID
 * Retrieves a specific memory from any container
 *
 * @param memoryId - Memory ID to retrieve
 * @returns Memory data or null if not found
 */
export async function getMemory(
  memoryId: string,
): Promise<GetMemoryResponse | null> {
  return getMemoryById(memoryId);
}

/**
 * Update memory by ID
 * Generic update that works for any memory type
 *
 * @param memoryId - Memory ID to update
 * @param content - New content (optional)
 * @param metadata - New metadata (optional, merged with existing)
 * @returns Update result with status
 */
export async function updateMemory(
  memoryId: string,
  content?: string,
  metadata?: Partial<MemoryMetadata>,
): Promise<UpdateStorageResult> {
  return updateMemoryById(memoryId, content, metadata);
}

/**
 * Delete memory by ID
 * Permanently deletes a single memory (hard delete)
 *
 * @param memoryId - Memory ID to delete
 * @returns Delete result with success status
 */
export async function deleteMemory(
  memoryId: string,
): Promise<DeleteStorageResult> {
  return deleteMemoryById(memoryId);
}

/**
 * Delete all memories in a container
 * Uses bulk delete to remove all memories by container tag
 *
 * @param sessionId - Session ID
 * @param characterId - Character ID (optional - if not provided, deletes world container)
 * @returns Delete result with count of deleted memories
 */
export async function deleteContainerMemories(
  sessionId: string,
  characterId?: string,
): Promise<DeleteStorageResult> {
  const containerTag = characterId
    ? createCharacterContainer(sessionId, characterId)
    : createWorldContainer(sessionId);

  return deleteByContainer(containerTag);
}

/**
 * Bulk delete memories by IDs
 * Deletes multiple memories at once (max 100 per request)
 *
 * @param memoryIds - Array of memory IDs to delete
 * @returns Delete result with count and any errors
 */
export async function bulkDeleteMemories(
  memoryIds: string[],
): Promise<DeleteStorageResult> {
  return bulkDeleteByIds(memoryIds);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper: Detect if agent prompt contains roleplay memory tag
 *
 * @param prompt - Agent prompt string
 * @returns True if tag is present
 */
export function hasRoleplayMemoryTag(prompt: string): boolean {
  return prompt.includes("###ROLEPLAY_MEMORY###");
}

/**
 * Helper: Replace memory tag with formatted memories
 *
 * @param prompt - Agent prompt with tag
 * @param memories - Formatted memory string
 * @returns Prompt with memories injected
 */
export function injectMemoriesIntoPrompt(
  prompt: string,
  memories: string,
): string {
  return prompt.replace("###ROLEPLAY_MEMORY###", memories);
}
