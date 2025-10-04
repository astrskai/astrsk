/**
 * Roleplay Memory System - World Agent
 *
 * Analyzes generated messages to detect actual participants and extract
 * character-specific world knowledge for memory distribution.
 *
 * Based on contracts/world-agent.contract.md and research.md
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type { WorldAgentInput, WorldAgentOutput } from './types'
import { ApiSource } from '@/modules/api/domain'
import { logger } from '@/shared/utils/logger'
import { useAppStore } from '@/app/stores/app-store'

/**
 * Default World Agent configuration
 * Uses AstrskAi provider with Gemini 2.5 Flash (lightweight, cost-efficient)
 */
const DEFAULT_WORLD_AGENT_MODEL = 'openai-compatible:google/gemini-2.5-flash'
const WORLD_AGENT_TIMEOUT_MS = 2000 // 2 seconds per contract

/**
 * World Agent prompt template with few-shot examples
 * Based on research.md Section 5: World Agent Prompt Engineering
 */
function buildWorldAgentPrompt(input: WorldAgentInput): string {
  const { generatedMessage, recentMessages, dataStore, speakerCharacterId } = input

  // Format recent messages for context
  const recentMessagesText = recentMessages
    .map((msg) => `${msg.role}: ${msg.content} (GameTime: ${msg.gameTime})`)
    .join('\n')

  // Format all participants for context
  const allParticipants = dataStore.participants.join(', ')

  // Get world memory context if available
  const worldMemoryContext = input.worldMemoryContext || 'No recent world events'

  return `You are the World Agent for a multi-character roleplay session. Your task is to:
1. Analyze the message and determine which characters participated in this conversation
2. Extract character-specific world knowledge from world memory

## Context
### World Memory (recent events)
${worldMemoryContext}

### Recent Messages
${recentMessagesText}

### Generated Message
Speaker ID: ${speakerCharacterId}
Content: ${generatedMessage}

### Session Data
- Current Scene: ${dataStore.currentScene}
- All Participants: ${allParticipants}
- Game Time: ${dataStore.gameTime} ${dataStore.gameTimeInterval}

## Task
Determine:
1. actualParticipants: Which characters were ACTUALLY in this conversation? (not just mentioned)
   - Use character IDs from the participants list
   - Speaker is ALWAYS included as minimum
2. worldKnowledge: What world updates should each participant receive?
   - Each participant gets DIFFERENT knowledge based on their perspective
   - Use character IDs as keys

## Examples
Example 1:
Message: "Alice and I agreed to search for the sword together!"
Speaker: bob-id
All Participants: alice-id, bob-id, charlie-id
actualParticipants: ["alice-id", "bob-id"]
worldKnowledge: {
  "alice-id": "Bob confirmed your agreement to search for the Sacred Sword together",
  "bob-id": "You agreed with Alice to search for the Sacred Sword"
}

Example 2:
Message: "I'm heading to the tavern alone to think."
Speaker: charlie-id
actualParticipants: ["charlie-id"]
worldKnowledge: {
  "charlie-id": "You decided to go to the tavern alone to reflect"
}

Example 3:
Message: "Hey everyone, let's meet at the Dragon's Lair!"
Speaker: alice-id
All Participants: alice-id, bob-id, charlie-id
actualParticipants: ["alice-id", "bob-id", "charlie-id"]
worldKnowledge: {
  "alice-id": "You proposed meeting at the Dragon's Lair to everyone",
  "bob-id": "Alice invited everyone to meet at the Dragon's Lair",
  "charlie-id": "Alice called for a meeting at the Dragon's Lair"
}

## Output Format
Return JSON only:
{
  "actualParticipants": ["character_id_1", "character_id_2"],
  "worldKnowledge": {
    "character_id_1": "knowledge specific to this character",
    "character_id_2": "knowledge specific to this character"
  }
}

IMPORTANT:
- Use exact character IDs from the participants list
- actualParticipants MUST include at least the speaker
- worldKnowledge keys MUST match actualParticipants
- Respond with JSON only, no other text.`
}

/**
 * Create fallback output when World Agent fails
 * Contract: Always include speaker, empty world knowledge
 */
function createFallbackOutput(speakerCharacterId: string): WorldAgentOutput {
  return {
    actualParticipants: [speakerCharacterId],
    worldKnowledge: {
      [speakerCharacterId]: ''
    }
  }
}

/**
 * Validate World Agent output structure
 */
function validateWorldAgentOutput(
  output: any,
  speakerCharacterId: string
): output is WorldAgentOutput {
  // Check required fields
  if (!output || typeof output !== 'object') return false
  if (!Array.isArray(output.actualParticipants)) return false
  if (typeof output.worldKnowledge !== 'object') return false

  // actualParticipants must be non-empty
  if (output.actualParticipants.length === 0) return false

  // actualParticipants must include speaker
  if (!output.actualParticipants.includes(speakerCharacterId)) return false

  // worldKnowledge keys must match actualParticipants
  const knowledgeKeys = Object.keys(output.worldKnowledge)
  for (const participant of output.actualParticipants) {
    if (!knowledgeKeys.includes(participant)) return false
  }

  return true
}

/**
 * Execute World Agent to analyze message and detect participants
 *
 * Contract: contracts/world-agent.contract.md
 * - MUST return non-empty actualParticipants (minimum: speaker)
 * - MUST provide character-specific world knowledge
 * - MUST fallback gracefully on errors (no throws)
 *
 * @param input - World Agent input with message context
 * @returns World Agent output with participants and knowledge
 */
export async function executeWorldAgent(
  input: WorldAgentInput
): Promise<WorldAgentOutput> {
  try {
    // Build prompt with few-shot examples
    const prompt = buildWorldAgentPrompt(input)

    // Use default AstrskAi provider with Gemini Flash
    // Model format: "ApiSource:modelId" (e.g., "openai-compatible:google/gemini-2.5-flash")
    const [providerSource, modelId] = DEFAULT_WORLD_AGENT_MODEL.split(':')
    const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${providerSource}`

    // Create OpenAI-compatible provider pointing to AstrskAi endpoint
    const provider = createOpenAI({
      apiKey: 'DUMMY', // AstrskAi uses JWT from headers
      baseURL: astrskBaseUrl
    })

    // Create model instance
    const model = provider(modelId)

    // Get JWT for AstrskAi authentication
    const jwt = useAppStore.getState().jwt
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          'x-astrsk-credit-log': JSON.stringify({
            feature: 'world-agent',
            sessionId: input.sessionId
          })
        }
      : undefined

    // Execute LLM call with timeout (2 seconds max per contract)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), WORLD_AGENT_TIMEOUT_MS)

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        abortSignal: abortController.signal,
        temperature: 0.7,
        maxTokens: 500,
        ...(headers && { headers })
      })

      clearTimeout(timeoutId)

      // Parse JSON response
      let parsed: any
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          logger.warn('[World Agent] No JSON found in response, using fallback')
          return createFallbackOutput(input.speakerCharacterId)
        }
        parsed = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        logger.warn('[World Agent] JSON parse error:', parseError)
        return createFallbackOutput(input.speakerCharacterId)
      }

      // Validate output structure
      if (!validateWorldAgentOutput(parsed, input.speakerCharacterId)) {
        logger.warn('[World Agent] Invalid output structure, using fallback')
        return createFallbackOutput(input.speakerCharacterId)
      }

      logger.info(
        `[World Agent] Successfully detected ${parsed.actualParticipants.length} participants`
      )
      return parsed as WorldAgentOutput
    } catch (llmError) {
      clearTimeout(timeoutId)

      // Check if timeout
      if (abortController.signal.aborted) {
        logger.warn('[World Agent] LLM timeout (>2s), using fallback')
      } else {
        logger.warn('[World Agent] LLM error:', llmError)
      }

      return createFallbackOutput(input.speakerCharacterId)
    }
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error('[World Agent] Unexpected error:', error)
    return createFallbackOutput(input.speakerCharacterId)
  }
}
