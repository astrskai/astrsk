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

import { formatMessageWithGameTime } from '../../shared/utils'
import type {
  SessionInitInput,
  MemoryRecallInput,
  MemoryDistributionInput
} from '../core/types'
import {
  createCharacterContainer,
  createWorldContainer
} from '../core/containers'
import {
  storeInitContent,
  storeWorldMessage,
  storeCharacterMessage,
  buildEnrichedMessage
} from '../core/memory-storage'
import { retrieveCharacterMemories } from '../core/memory-retrieval'
import { executeWorldAgent } from '../core/world-agent'
import { logger } from '@/shared/utils/logger'

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
  input: SessionInitInput
): Promise<void> {
  try {
    const { sessionId, participants, characters, scenario } = input

    logger.info(
      `[Session Init] Initializing roleplay memory for session: ${sessionId}`
    )

    // Create world container
    const worldContainer = createWorldContainer(sessionId)
    logger.info(`[Session Init] Created world container: ${worldContainer}`)

    // Initialize each character's memory container
    const initPromises: Promise<any>[] = []

    for (const character of characters) {
      const characterContainer = createCharacterContainer(
        sessionId,
        character.characterId
      )
      logger.info(
        `[Session Init] Created character container: ${characterContainer}`
      )

      // Store scenario messages (if scenario exists)
      if (scenario?.messages && scenario.messages.length > 0) {
        for (const message of scenario.messages) {
          initPromises.push(
            storeInitContent(characterContainer, message.content, {
              speaker: character.characterId,
              participants: participants,
              gameTime: 0,
              gameTimeInterval: 'Day',
              type: 'scenario',
              permanent: true
            })
          )
        }
      }

      // Store character card
      if (character.characterCard) {
        initPromises.push(
          storeInitContent(characterContainer, character.characterCard, {
            speaker: character.characterId,
            participants: participants,
            gameTime: 0,
            gameTimeInterval: 'Day',
            type: 'character_card',
            permanent: true
          })
        )
      }

      // Store lorebook entries
      if (character.lorebook && character.lorebook.length > 0) {
        for (const loreEntry of character.lorebook) {
          initPromises.push(
            storeInitContent(characterContainer, loreEntry.content, {
              speaker: character.characterId,
              participants: participants,
              gameTime: 0,
              gameTimeInterval: 'Day',
              type: 'lorebook',
              permanent: true,
              lorebookKey: loreEntry.key
            })
          )
        }
      }
    }

    // Execute all storage operations in parallel
    await Promise.all(initPromises)

    logger.info(
      `[Session Init] Successfully initialized ${characters.length} character containers`
    )
  } catch (error) {
    logger.error('[Session Init] Failed to initialize roleplay memory:', error)
    throw error
  }
}

/**
 * Recall character memories for START node (before agent execution)
 *
 * Queries character's private container and retrieves top N relevant memories
 * based on current time and recent conversation context.
 *
 * @param input - Memory recall input
 * @returns Array of memory strings (empty array on error)
 */
export async function recallCharacterMemories(
  input: MemoryRecallInput
): Promise<string[]> {
  try {
    const {
      sessionId,
      characterId,
      characterName,
      currentGameTime,
      currentGameTimeInterval,
      recentMessages,
      limit = 5
    } = input

    // Format recent messages
    const formattedMessages = recentMessages.map((msg) =>
      formatMessageWithGameTime(
        msg.role,
        msg.content,
        msg.gameTime,
        currentGameTimeInterval
      )
    )

    // Query character's private container
    const containerTag = createCharacterContainer(sessionId, characterId)
    const result = await retrieveCharacterMemories({
      containerTag,
      currentGameTime,
      currentGameTimeInterval,
      recentMessages: formattedMessages,
      characterName,
      limit
    })

    logger.info(
      `[Memory Recall] Retrieved ${result.count} memories for character: ${characterName}`
    )

    return result.memories
  } catch (error) {
    logger.error('[Memory Recall] Failed to recall memories:', error)
    // Graceful degradation: return empty array
    return []
  }
}

/**
 * Format retrieved memories for prompt injection
 *
 * Joins memories with clear separators for agent prompt injection.
 *
 * @param memories - Array of memory strings
 * @returns Formatted string for prompt (empty string if no memories)
 */
export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return '(No relevant memories found)'
  }

  return memories
    .map((memory, index) => `[Memory ${index + 1}]\n${memory}`)
    .join('\n\n---\n\n')
}

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
  input: MemoryDistributionInput
): Promise<void> {
  try {
    const {
      sessionId,
      speakerCharacterId,
      speakerName,
      message,
      gameTime,
      gameTimeInterval,
      dataStore,
      worldMemoryContext
    } = input

    logger.info(
      `[Memory Distribution] Processing message from ${speakerName} at GameTime: ${gameTime}`
    )

    // Execute World Agent to detect participants
    const worldAgentOutput = await executeWorldAgent({
      sessionId,
      speakerCharacterId,
      generatedMessage: message,
      recentMessages: [], // TODO: Pass recent messages if available
      dataStore,
      worldMemoryContext
    })

    const { actualParticipants, worldKnowledge } = worldAgentOutput

    logger.info(
      `[Memory Distribution] Detected ${actualParticipants.length} participants`
    )

    // Store raw message in world container
    const worldContainer = createWorldContainer(sessionId)
    const worldMessageContent = formatMessageWithGameTime(
      speakerName,
      message,
      gameTime,
      gameTimeInterval
    )

    await storeWorldMessage(worldContainer, worldMessageContent, {
      speaker: speakerCharacterId,
      participants: actualParticipants,
      gameTime,
      gameTimeInterval,
      type: 'message'
    })

    // Distribute enriched memories to participants in parallel
    const distributionPromises = actualParticipants.map((participantId) => {
      // Build enriched message sections
      const currentTimeSection = `###Current time###\nGameTime: ${gameTime} ${gameTimeInterval}`
      const messageSection = `###Message###\n${worldMessageContent}`

      // Get participant-specific world knowledge
      const knowledge = worldKnowledge[participantId] || ''
      const worldKnowledgeSection = knowledge
        ? `###Newly discovered world knowledge###\n${knowledge}`
        : undefined

      // Build enriched message
      const enrichedContent = buildEnrichedMessage({
        currentTime: currentTimeSection,
        message: messageSection,
        worldKnowledge: worldKnowledgeSection
      })

      // Store in participant's container
      const participantContainer = createCharacterContainer(
        sessionId,
        participantId
      )

      return storeCharacterMessage(participantContainer, enrichedContent, {
        speaker: speakerCharacterId,
        participants: actualParticipants,
        isSpeaker: participantId === speakerCharacterId,
        gameTime,
        gameTimeInterval,
        type: 'message'
      })
    })

    await Promise.all(distributionPromises)

    logger.info(
      `[Memory Distribution] Successfully distributed memories to ${actualParticipants.length} participants`
    )
  } catch (error) {
    logger.error('[Memory Distribution] Failed to distribute memories:', error)
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
  return prompt.includes('###ROLEPLAY_MEMORY###')
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
  memories: string
): string {
  return prompt.replace('###ROLEPLAY_MEMORY###', memories)
}
