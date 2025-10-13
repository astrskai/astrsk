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

/**
 * Initialize roleplay memory system for a new session
 *
 * Creates containers and stores initialization content:
 * - World container: {sessionId}-world
 * - Character containers: {sessionId}-{characterId} (one per character)
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

    // Execute all storage operations in parallel
    await Promise.all(initPromises);

    logger.info(
      `[Session Init] Successfully initialized ${characters.length} character containers`,
    );
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

        logger.info(
          `[Memory Recall] Appended current world context for ${characterName}`,
        );
      }
    }

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

    await storeWorldMessage(worldContainer, worldMessageContent, {
      speaker: speakerCharacterId,
      participants: participantIds,
      game_time,
      game_time_interval,
      type: "message",
    });

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
  } catch (error) {
    logger.error("[Memory Distribution] Failed to distribute memories:", error);
    // Don't throw - graceful degradation (memory distribution is enhancement, not requirement)
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
