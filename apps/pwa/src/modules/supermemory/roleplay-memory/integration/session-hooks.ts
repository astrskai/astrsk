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
} from "../core/memory-storage";
import { retrieveCharacterMemories } from "../core/memory-retrieval";
import { UniqueEntityID } from "@/shared/domain";
import { executeWorldAgent } from "../core/world-agent";
import { logger } from "@/shared/utils/logger";
import {
  recordSessionInit,
  recordMemoryRecall,
  recordWorldMemoryAdd,
} from "../debug/debug-helpers";
import { memoryClient } from "../../shared/client";

/**
 * Initialize roleplay memory system for a new session
 *
 * Creates containers and stores initialization content:
 * - World container: {sessionId}-world
 * - Character containers: {sessionId}-{charascterId} (one per character)
 * - Stores scenario messages, character cards, lorebook entries
 * - All init content marked with permanent: true
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

    // Store all character cards in world container
    for (const character of characters) {
      if (character.characterCard) {
        const content = `[Character: ${character.characterName}]\n${character.characterCard}`;
        worldInitPromises.push(
          memoryClient.memories.add({
            containerTag: worldContainer,
            content,
            metadata: {
              type: "character_card",
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
                speaker: character.characterId,
                participants: participants,
                game_time: 0,
                game_time_interval: "Day",
                type: "character_card",
              },
              storageId: result.id,
            });
            return result;
          }),
        );
      }

      // Store all lorebook entries in world container
      if (character.lorebook && character.lorebook.length > 0) {
        worldInitPromises.push(
          ...character.lorebook.map((loreEntry) => {
            const content = `[Lorebook - ${loreEntry.key}] ${loreEntry.content}`;
            return memoryClient.memories.add({
              containerTag: worldContainer,
              content,
              metadata: {
                type: "lorebook",
                permanent: true,
                lorebookKey: loreEntry.key,
                game_time: 0,
                game_time_interval: "Day",
              },
            }).then((result) => {
              // Record debug event for world memory
              recordWorldMemoryAdd({
                containerTag: worldContainer,
                content,
                metadata: {
                  speaker: character.characterId,
                  participants: participants,
                  game_time: 0,
                  game_time_interval: "Day",
                  type: "lorebook",
                },
                storageId: result.id,
              });
              return result;
            });
          }),
        );
      }
    }

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

      // Store character card
      if (character.characterCard) {
        promises.push(
          storeInitContent(characterContainer, character.characterCard, {
            speaker: character.characterId,
            participants: participants,
            game_time: 0,
            game_time_interval: "Day",
            type: "character_card",
            permanent: true,
          }),
        );
      }

      // Store lorebook entries
      if (character.lorebook && character.lorebook.length > 0) {
        promises.push(
          ...character.lorebook.map((loreEntry) =>
            storeInitContent(characterContainer, loreEntry.content, {
              speaker: character.characterId,
              participants: participants,
              game_time: 0,
              game_time_interval: "Day",
              type: "lorebook",
              permanent: true,
              lorebookKey: loreEntry.key,
            }),
          ),
        );
      }

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
        hasCharacterCard: !!char.characterCard,
        lorebookEntries: char.lorebook?.length || 0,
      })),
      worldContainerTag: worldContainer,
    });
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

    logger.info(
      `[Memory Recall] Retrieved ${result.count} memories for character: ${characterName}`,
    );

    // Format memories (simple sentences from Supermemory)
    const { formatMemoriesForPrompt } = await import(
      "../core/memory-retrieval"
    );
    let formattedMemories = formatMemoriesForPrompt(result.memories);

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

        logger.info(
          `[Memory Recall] Appended current world context for ${characterName}`,
        );
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
 */
export async function distributeMemories(
  input: MemoryDistributionInput,
): Promise<void> {
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
    } = input;

    logger.info(
      `[Memory Distribution] Processing message from ${speakerName} at GameTime: ${game_time}`,
    );

    // Use the provided World Agent output (already executed in session-play-service)
    const { actualParticipants, worldContextUpdates } = worldAgentOutput;

    logger.info(
      `[Memory Distribution] Detected ${actualParticipants.length} participants (names)`,
    );

    // Map character names to IDs for storage
    // actualParticipants contains NAMES, but we need IDs for container creation
    // Get all character IDs from dataStore.participants
    const allParticipantIds = dataStore.participants || [];

    // Build name-to-ID mapping by fetching character names
    const { CardService } = await import("@/app/services/card-service");
    const { CharacterCard } = await import(
      "@/modules/card/domain/character-card"
    );
    const nameToId: Record<string, string> = {};

    for (const participantId of allParticipantIds) {
      try {
        const card = (
          await CardService.getCard.execute(new UniqueEntityID(participantId))
        )
          .throwOnFailure()
          .getValue() as typeof CharacterCard.prototype;
        const name = card.props.name || card.props.title || "Unknown";
        nameToId[name] = participantId;
      } catch (error) {
        logger.warn(
          `[Memory Distribution] Failed to fetch card for ${participantId}`,
        );
      }
    }

    // Convert participant names to IDs
    const participantIds = actualParticipants
      .map((name) => nameToId[name])
      .filter((id) => id !== undefined);

    // If no participants were mapped but we have names, log a warning
    if (participantIds.length === 0 && actualParticipants.length > 0) {
      logger.warn(
        `[Memory Distribution] Could not map any participant names to IDs. Names: ${actualParticipants.join(", ")}`,
      );
    }

    logger.info(
      `[Memory Distribution] Mapped ${participantIds.length} participant IDs from names`,
    );

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
      const messageSection = `###Message###\n${worldMessageContent}`;

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
      });
    });

    await Promise.all(distributionPromises);

    logger.info(
      `[Memory Distribution] Successfully distributed memories to ${actualParticipants.length} participants`,
    );

    // Debug event removed - memory distribution info already shown in Character Memory Add events
    // recordMemoryDistribution({
    //   speakerName,
    //   message,
    //   participantIds,
    //   participantNames: actualParticipants,
    //   worldMessageContent,
    //   enrichedContents: enrichedContentsForDebug,
    // });
  } catch (error) {
    logger.error("[Memory Distribution] Failed to distribute memories:", error);
    // Don't throw - graceful degradation (memory distribution is enhancement, not requirement)
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
}

/**
 * Process user message for roleplay memory system
 *
 * Handles user messages sent directly (not through flows):
 * - Retrieves world memories for context
 * - Executes World Agent to detect participants and extract context
 * - Distributes memories to all detected participants
 * - Stores in world container and character containers
 *
 * @param input - User message memory input
 */
export async function processUserMessage(
  input: UserMessageMemoryInput,
): Promise<void> {
  try {
    const { sessionId, messageContent, session, flow } = input;

    const dataStore = session.dataStore || [];
    const gameTimeField = dataStore.find((field: any) => field.name === "game_time");
    const gameTimeIntervalField = dataStore.find((field: any) => field.name === "game_time_interval");

    // DataStore values are always strings, convert to number
    const gameTime = gameTimeField?.value ? parseInt(String(gameTimeField.value), 10) : 0;
    const gameTimeInterval = gameTimeIntervalField?.value ? String(gameTimeIntervalField.value) : "Day";

    // Get user character ID and name first
    let speakerName = "User";
    let speakerCharacterId = "user"; // Fallback

    if (session.userCharacterCardId) {
      try {
        const { CardService } = await import("@/app/services/card-service");
        const { CharacterCard } = await import("@/modules/card/domain/character-card");
        const userCardResult = await CardService.getCard.execute(session.userCharacterCardId);
        if (userCardResult.isSuccess) {
          const userCard = userCardResult.getValue() as typeof CharacterCard.prototype;
          speakerName = userCard.props.name || userCard.props.title || "User";
          speakerCharacterId = session.userCharacterCardId.toString();
        }
      } catch (error) {
        logger.warn(`[User Message] Failed to get user character card, using defaults`);
      }
    }

    // Get all character names including user and AI characters
    const allParticipantNames: string[] = [speakerName]; // Include user character
    const allParticipantIds: string[] = [speakerCharacterId];

    const { CardService } = await import("@/app/services/card-service");
    const { CharacterCard } = await import("@/modules/card/domain/character-card");
    for (const charCardId of session.aiCharacterCardIds) {
      try {
        const cardResult = await CardService.getCard.execute(charCardId);
        if (cardResult.isSuccess) {
          const card = cardResult.getValue() as typeof CharacterCard.prototype;
          const name = card.props.name || card.props.title || "Unknown";
          allParticipantNames.push(name);
          allParticipantIds.push(charCardId.toString());
        }
      } catch (error) {
        logger.warn(`[User Message] Failed to get character name for ${charCardId.toString()}`);
      }
    }

    // Get agent's apiSource and modelId from flow to use for World Agent
    let apiSource: any;
    let modelId: string | undefined;

    if (flow && flow.agentIds.length > 0) {
      try {
        const { AgentService } = await import("@/app/services/agent-service");
        const firstAgentId = flow.agentIds[0];
        const agentResult = await AgentService.getAgent.execute(firstAgentId);
        if (agentResult.isSuccess) {
          const agent = agentResult.getValue();
          apiSource = agent.props.apiSource;
          modelId = agent.props.modelId;
        }
      } catch (error) {
        logger.warn(`[User Message] Failed to get agent for World Agent: ${error}`);
      }
    }

    // Build character ID to name mapping for World Agent
    const characterIdToName: Record<string, string> = {};
    for (let i = 0; i < allParticipantIds.length; i++) {
      characterIdToName[allParticipantIds[i]] = allParticipantNames[i];
    }

    // Get recent messages for world memory query context
    const recentMessageStrings: string[] = [];
    if (session.turnIds && session.turnIds.length > 0) {
      const { TurnService } = await import("@/app/services/turn-service");
      // Get last 3 turns for context
      const recentTurnIds = session.turnIds.slice(-3);
      for (const turnId of recentTurnIds) {
        try {
          const turnResult = await TurnService.getTurn.execute(turnId);
          if (turnResult.isSuccess) {
            const turn = turnResult.getValue();
            const role = turn.characterName || "Unknown";
            const content = turn.content || "";

            // Get gameTime from turn's dataStore if available
            let turnGameTime = gameTime;
            const turnDataStore = turn.selectedOption?.dataStore;
            if (turnDataStore) {
              const turnGameTimeField = turnDataStore.find((field: any) => field.name === "game_time");
              if (turnGameTimeField && typeof turnGameTimeField.value === "number") {
                turnGameTime = turnGameTimeField.value;
              }
            }

            recentMessageStrings.push(`Message: ${role}: ${content} GameTime: ${turnGameTime} ${gameTimeInterval}`);
          }
        } catch (error) {
          logger.warn(`[User Message] Failed to get turn ${turnId.toString()} for context`);
        }
      }
    }

    // Retrieve recent world memories from Supermemory world container
    const worldContainer = createWorldContainer(sessionId);
    let worldMemoryContext = "";
    let worldMemoryQuery = "";
    try {
      logger.info(`[User Message] Querying world container: ${worldContainer}`);

      // Format world memory query with structure similar to character queries
      // This helps semantic search match initialization content (character cards, scenario, lorebook)
      const queryParts = [
        "###Current time###",
        `GameTime: ${gameTime} ${gameTimeInterval}`,
        ""
      ];

      // Add recent messages if available
      if (recentMessageStrings.length > 0) {
        queryParts.push("###Recent messages###");
        queryParts.push(recentMessageStrings.join("\n"));
        queryParts.push("");
      }

      // Add current user message
      queryParts.push("###User message###");
      queryParts.push(messageContent);
      queryParts.push("");
      queryParts.push("What are the character information, scenario details, and world context that would help understand this situation?");

      worldMemoryQuery = queryParts.join("\n");

      const { retrieveWorldMemories } = await import("../core/memory-retrieval");
      const worldMemoriesResult = await retrieveWorldMemories({
        query: worldMemoryQuery,
        containerTag: worldContainer,
        limit: 20,
      });

      logger.info(`[User Message] World memory search: found ${worldMemoriesResult.count} memories`);

      if (worldMemoriesResult.memories && worldMemoriesResult.memories.length > 0) {
        worldMemoryContext = worldMemoriesResult.memories.join("\n\n");
        logger.info(`[User Message] Retrieved ${worldMemoriesResult.count} world memories`);
      } else {
        logger.info(`[User Message] No world memories found in container ${worldContainer}`);
      }

      // Record debug event for world memory retrieval
      const { useSupermemoryDebugStore } = await import("@/app/stores/supermemory-debug-store");
      useSupermemoryDebugStore.getState().addEvent("world_memory_retrieval", {
        containerTag: worldContainer,
        query: worldMemoryQuery,
        retrievedCount: worldMemoriesResult.count,
        memories: worldMemoriesResult.memories,
      });
    } catch (error) {
      logger.error(`[User Message] Failed to retrieve world memories:`, error);
      // Record failed retrieval
      const { useSupermemoryDebugStore } = await import("@/app/stores/supermemory-debug-store");
      useSupermemoryDebugStore.getState().addEvent("world_memory_retrieval", {
        containerTag: worldContainer,
        query: worldMemoryQuery,
        retrievedCount: 0,
        memories: [],
        error: String(error),
      });
    }

    // Format dataStore for World Agent
    // Extract previous participants from dataStore (if exists)
    const participantsField = dataStore.find((field: any) => field.name === "participants");
    const previousParticipants = Array.isArray(participantsField?.value) ? participantsField.value : [];

    // Get other dataStore fields
    const worldContextField = dataStore.find((field: any) => field.name === "world_context");
    const currentSceneField = dataStore.find((field: any) => field.name === "current_scene");

    const formattedDataStore = {
      sessionId,
      participants: allParticipantIds, // All session characters (who COULD participate)
      previousParticipants, // Who WAS participating before (from dataStore)
      game_time: gameTime,
      game_time_interval: gameTimeInterval,
      currentScene: currentSceneField?.value || "Unknown", // Default to "Unknown" if not set
      worldContext: worldContextField?.value, // Accumulated context from World Agent
    };

    // Execute World Agent to detect participants and extract context
    const worldAgentOutput = await executeWorldAgent({
      sessionId,
      speakerCharacterId,
      speakerName,
      generatedMessage: messageContent,
      recentMessages: [], // User messages don't have recent context
      dataStore: formattedDataStore,
      characterIdToName,
      worldMemoryContext, // Recent events from Supermemory world container
      worldMemoryQuery, // Query used to retrieve world memories
      apiSource,
      modelId,
    });

    // Distribute user message to all participants
    await distributeMemories({
      sessionId,
      speakerCharacterId,
      speakerName,
      message: messageContent,
      game_time: gameTime,
      game_time_interval: gameTimeInterval,
      dataStore: dataStore,
      worldAgentOutput,
    });

    logger.info(`[User Message] Successfully stored in supermemory for ${allParticipantNames.length} participants`);
  } catch (error) {
    // Don't fail the entire operation if supermemory fails
    logger.error("[User Message] Failed to store in supermemory:", error);
  }
}

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
