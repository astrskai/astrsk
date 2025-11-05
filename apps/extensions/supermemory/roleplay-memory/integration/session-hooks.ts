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

import { formatMessageWithScene } from "../../shared/utils";
import type {
  SessionInitInput,
  MemoryRecallInput,
  MemoryDistributionInput,
  UpdateStorageResult,
  DeleteStorageResult,
  GetMemoryResponse,
  MemoryMetadata,
  CharacterMemoryQueryOutput,
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
          scene: "Initial Scene",
        },
      }).then((result) => {
        // Record debug event
        recordWorldMemoryAdd({
          containerTag: worldContainer,
          content,
          metadata: {
            speaker: "system",
            participants,
            scene: "Initial Scene",
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
          scene: "Initial Scene",
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
              scene: "Initial Scene",
            },
          }).then((result) => {
            // Record debug event for world memory
            recordWorldMemoryAdd({
              containerTag: worldContainer,
              content,
              metadata: {
                speaker: "system",
                participants: participants,
                scene: "Initial Scene",
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
              scene: "Initial Scene",
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
 * OPTIMIZATION: For the first 5 turns, skips v4/v3 memory search since the
 * memory database is still being populated. Instead, only injects lorebook
 * entries and dataStore values (worldContext). This improves performance
 * and avoids empty search results during the early conversation.
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
      current_scene,
      recentMessages,
      limit = 20,
      worldContext,
      turnCount,
      dataStoreState,
    } = input;

    // Format recent messages - simply format as "{role}: {content}"
    const formattedMessages = recentMessages.map((msg) =>
      `${msg.role}: ${msg.content}`
    );

    // Create container tag (needed for both cases)
    const containerTag = createCharacterContainer(sessionId, characterId);

    // OPTIMIZATION: Skip v4/v3 memory search for first 5 turns
    // Memory database is still being populated, so search would return empty results
    // Still inject lorebook entries and dataStore values (worldContext)
    let result: CharacterMemoryQueryOutput;

    if (turnCount !== undefined && turnCount <= 5) {
      console.log(`⏩ [Memory Recall] Turn ${turnCount}/5 - Skipping v4/v3 memory search (database still populating)`);
      console.log(`   Will still inject lorebook entries and world context from dataStore`);
      result = { memories: [], count: 0 };
    } else {
      console.log(`🔍 [Memory Recall] Turn ${turnCount || 'unknown'} - Performing v4/v3 memory search`);
      // Query character's private container
      result = await retrieveCharacterMemories({
        containerTag,
        current_scene,
        recentMessages: formattedMessages,
        characterName,
        limit,
      });
    }

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

    // Format memories with time/location metadata (simple sentences from Supermemory)
    const { formatMemoriesForPrompt } = await import(
      "../core/memory-retrieval"
    );
    const formattedMemoriesRaw = formatMemoriesForPrompt(result.memories, result.metadata);

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
          // Verbatim memories don't have metadata, so pass undefined
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

    // Build dataStore world state section (CRITICAL for first 5 turns)
    let worldStateSection = "";
    if (dataStoreState) {
      try {
        const { selectedTime, selectedScene, scenePool, characterScenes } = dataStoreState;

        // CRITICAL: Get THIS CHARACTER's location from characterScenes
        // Don't use selectedScene (which is the global scene from most recent message)
        // Use the character's actual location so each character sees their own location
        let characterLocation = selectedScene || "Unknown"; // Fallback to selectedScene
        if (characterScenes && typeof characterScenes === 'object') {
          const locationFromScenes = characterScenes[characterName];
          if (locationFromScenes) {
            characterLocation = locationFromScenes;
          }
        }

        // Format character locations
        let locationInfo = "";
        if (characterScenes && typeof characterScenes === 'object') {
          const characterList = Object.entries(characterScenes)
            .map(([name, location]) => `  - ${name}: ${location}`)
            .join("\n");
          if (characterList) {
            locationInfo = `\n### Character Locations:\n${characterList}`;
          }
        }

        // Format available scenes
        let sceneInfo = "";
        if (scenePool && Array.isArray(scenePool) && scenePool.length > 0) {
          sceneInfo = `\n### Available Scenes:\n  ${scenePool.join(", ")}`;
        }

        // Build list of characters who ARE in this location and who are NOT
        let charactersHere: string[] = [];
        let charactersElsewhere: string[] = [];
        if (characterScenes && typeof characterScenes === 'object') {
          Object.entries(characterScenes).forEach(([name, location]) => {
            if (location === characterLocation) {
              charactersHere.push(name);
            } else {
              charactersElsewhere.push(name);
            }
          });
        }

        const presentList = charactersHere.length > 0
          ? charactersHere.join(", ")
          : "Only you";
        const absentList = charactersElsewhere.length > 0
          ? charactersElsewhere.join(", ")
          : "None";

        worldStateSection = `<WORLD_STATE>
### Current Time: ${selectedTime || "Unknown"}
### Your Location: ${characterLocation}
### Your Character: ${characterName}${sceneInfo}

**WHO IS PHYSICALLY PRESENT IN ${characterLocation} WITH YOU:**
${presentList}

**WHO IS NOT PRESENT (they are elsewhere - DO NOT interact with them):**
${absentList}

**CRITICAL - READ CAREFULLY BEFORE WRITING YOUR RESPONSE:**

1. **YOU CAN ONLY SEE AND INTERACT WITH: ${presentList}**
   - These are the ONLY characters physically present in ${characterLocation}
   - You can see them, talk to them, touch them, interact with them

2. **DO NOT INTERACT WITH THESE CHARACTERS (they are elsewhere): ${absentList}**
   - These characters are in DIFFERENT locations (NOT in ${characterLocation})
   - They are PHYSICALLY ABSENT from your scene
   - **YOU DO NOT KNOW WHERE THEY ARE** - you are not omniscient

3. **ABSOLUTE PROHIBITIONS - DO NOT WRITE ABOUT: ${absentList}**
   - WRONG: "I see ${absentList}" - You cannot see them (they're elsewhere)
   - WRONG: "I watch ${absentList}" - You cannot watch them (they're elsewhere)
   - WRONG: "I catch a glimpse of ${absentList}" - You cannot glimpse them (they're elsewhere)
   - WRONG: "I hear ${absentList} talking" - You cannot hear them (they're elsewhere)
   - WRONG: "I observe ${absentList}" - You cannot observe them (they're elsewhere)
   - WRONG: "${absentList} walks past" - They cannot (they're elsewhere)
   - **IF YOU WRITE ANY OF THE ABOVE ABOUT ${absentList}, YOU ARE BREAKING THE RULES**

4. **WHAT YOU CAN WRITE ABOUT ABSENT CHARACTERS:**
   - CORRECT: "I wonder where [character] is" (internal thought/speculation)
   - CORRECT: "I hope [character] is okay" (internal thought/concern)
   - CORRECT: "I remember when [character] did [action]" (past memory)
   - **You can think about them, but you CANNOT see, hear, or interact with them**

5. **WHAT YOU CAN WRITE:**
   - Interact with characters in the present list: ${presentList}
   - Describe what YOU are doing in ${characterLocation}
   - Think about or remember absent characters
   - Move to a different location (by explicitly describing movement)

**ABSOLUTE RULE: Write ONLY what ${characterName} can physically see and do in ${characterLocation}. Characters not in the present list do NOT exist in your current scene.**
</WORLD_STATE>`;
      } catch (error) {
        console.error(`❌ [Memory Recall] Failed to build world state section:`, error);
        // Continue without world state section
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

    // Prepend world state section to the final prompt (should come first)
    if (worldStateSection) {
      if (formattedMemories) {
        formattedMemories = `${worldStateSection}\n\n${formattedMemories}`;
      } else {
        formattedMemories = worldStateSection;
      }
    }

    // DEBUG: Print exact memory injection prompt (always, even for first 5 turns)
    console.log("\n━━━━━━━━ MEMORY INJECTION DEBUG ━━━━━━━━");
    console.log(`Character: ${characterName}`);
    console.log(`Turn: ${turnCount !== undefined ? turnCount : 'unknown'}`);
    console.log(`Memory Count (v4/v3): ${result.memories.length}`);
    console.log(`Verbatim Count: ${result.verbatimMemories?.length || 0}`);
    console.log(`Lorebook Entries: ${lorebookEntries.length}`);
    console.log(`World State: ${worldStateSection ? 'Yes (Time, Location, Character Positions)' : 'No'}`);
    console.log(`World Context: ${appendedWorldContext ? 'Yes' : 'No'}`);
    console.log("\nFinal Injected Prompt:");
    if (formattedMemories) {
      console.log(formattedMemories);
    } else {
      console.log("(empty - no memories, lorebooks, or context to inject)");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 [DEBUG] DISTRIBUTE MEMORIES - FUNCTION ENTRY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   Session ID: ${input.sessionId}`);
  console.log(`   Speaker: ${input.speakerName} (${input.speakerCharacterId})`);
  console.log(`   Scene: ${input.scene}`);
  console.log(`   Message length: ${typeof input.message === 'string' ? input.message.length : 0} chars`);

  try {
    const {
      sessionId,
      speakerCharacterId,
      speakerName,
      message,
      scene,
      dataStore,
      worldAgentOutput,
      getCard,
      session,
    } = input;

    console.log(`📊 [DEBUG] Extracting input parameters...`);
    console.log(`   worldAgentOutput present: ${!!worldAgentOutput}`);
    console.log(`   getCard function present: ${!!getCard}`);
    console.log(`   session present: ${!!session}`);
    console.log(`   dataStore present: ${!!dataStore}`);

    // Use the provided World Agent output (already executed in session-play-service)
    const { characterSceneUpdates, worldContextUpdates } = worldAgentOutput;
    console.log(`✅ [DEBUG] Extracted World Agent output`);
    console.log(`   characterSceneUpdates count: ${characterSceneUpdates?.length || 0}`);
    console.log(`   worldContextUpdates count: ${worldContextUpdates?.length || 0}`);

    // Derive participants from characterSceneUpdates (characters in the current scene)
    const selectedScene = dataStore.selectedScene || scene;
    console.log(`🎬 [DEBUG] Selected scene: "${selectedScene}"`);

    const actualParticipants = characterSceneUpdates
      .filter(update => update.scene === selectedScene)
      .map(update => update.characterName);

    console.log(`👥 [DEBUG] Extracted participants from scene`);
    console.log(`   Participants count: ${actualParticipants.length}`);
    console.log(`   Participants: ${actualParticipants.join(", ")}`);

    logger.info(`[Memory Distribution] Scene: "${selectedScene}"`);
    logger.info(`[Memory Distribution] Characters in scene: ${actualParticipants.join(", ")}`);

    // dataStore.participants now contains NAMES (not IDs)
    // We need to get character IDs from session.characterCards for creating containers
    const allParticipantNames = actualParticipants;

    console.log(`🔑 [DEBUG] Building name-to-ID mapping...`);

    // Build name-to-ID mapping by looking up session's character cards
    const nameToId: Record<string, string> = {};

    // If session and getCard are provided, use them to build name-to-ID mapping
    if (session && getCard) {
      console.log(`   Session and getCard available, fetching character cards...`);
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

    console.log(`✅ [DEBUG] Name-to-ID mapping complete`);
    console.log(`   Mapped ${Object.keys(nameToId).length} names to IDs`);
    console.log(`   Mapping:`, JSON.stringify(nameToId, null, 2));

    // Convert participant names to IDs for container creation
    const participantIds = actualParticipants
      .map((name) => nameToId[name])
      .filter((id) => id !== undefined);

    console.log(`🆔 [DEBUG] Converted participant names to IDs`);
    console.log(`   Participant IDs count: ${participantIds.length}`);
    console.log(`   Participant IDs: ${participantIds.join(", ")}`);

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

    console.log(`\n🌍 [DEBUG] STORING WORLD MEMORY`);
    console.log(`   Container: world:${sessionId}`);
    console.log(`   Speaker: ${speakerName} (${speakerCharacterId})`);
    console.log(`   Participants: ${participantIds.join(", ")}`);
    console.log(`   Scene: ${selectedScene}`);

    // Store raw message in world container
    const worldContainer = createWorldContainer(sessionId);
    const worldMessageContent = formatMessageWithScene(
      speakerName,
      message,
      selectedScene,
    );

    console.log(`📤 [DEBUG] Calling storeWorldMessage...`);
    const worldStoreResult = await storeWorldMessage(worldContainer, worldMessageContent, {
      speaker: speakerCharacterId,
      participants: participantIds,
      scene: selectedScene,
      type: "message",
    });
    console.log(`✅ [DEBUG] storeWorldMessage completed`);
    console.log(`   Success: ${worldStoreResult.success}`);
    console.log(`   Memory ID: ${worldStoreResult.id || 'none'}`);
    console.log(`   Error: ${worldStoreResult.error || 'none'}`);

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

    console.log(`\n👥 [DEBUG] DISTRIBUTING TO CHARACTER CONTAINERS`);
    console.log(`   Participant count: ${participantIds.length}`);
    console.log(`   Participant IDs: ${participantIds.join(", ")}`);

    // Distribute enriched memories to participants in parallel
    const enrichedContentsForDebug: Array<{
      characterName: string;
      characterId: string;
      content: string;
      worldContext?: string;
    }> = [];

    console.log(`📝 [DEBUG] Building distribution promises...`);
    const distributionPromises = participantIds.map((participantId) => {
      // Build enriched message sections
      const currentTimeSection = `###Scene###\n${selectedScene}`;

      // Add participants section so LLM knows who was present during this message
      const participantsSection = actualParticipants.length > 0
        ? `###Participants###\n${actualParticipants.join(", ")}`
        : undefined;

      // For character containers, explicitly state who generated the message
      // CRITICAL: This ensures AI knowledge extraction understands who "I" refers to
      const characterMessageContent = `This message was generated by ${speakerName} (speaker):\n${message}`;
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
        participants: participantsSection,
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
        scene: selectedScene,
        type: "message",
      }).then(result => ({ participantId, result }));
    });

    console.log(`⏳ [DEBUG] Awaiting ${distributionPromises.length} character memory storage operations...`);
    const characterResults = await Promise.all(distributionPromises);
    console.log(`✅ [DEBUG] All character memory storage operations completed`);
    console.log(`   Results count: ${characterResults.length}`);

    // Collect all memory IDs (world + character)
    const allMemoryIds: string[] = [];

    console.log(`\n📊 [DEBUG] COLLECTING MEMORY IDS`);

    // Add world memory ID
    if (worldStoreResult.id) {
      allMemoryIds.push(worldStoreResult.id);
      console.log(`   World memory ID: ${worldStoreResult.id}`);
    }

    // Add character memory IDs
    for (const { participantId, result } of characterResults) {
      if (result.success && result.id) {
        allMemoryIds.push(result.id);
        console.log(`   Character memory ID (${participantId}): ${result.id}`);
      } else {
        console.log(`   Character memory FAILED for ${participantId}: ${result.error || 'unknown error'}`);
      }
    }

    console.log(`\n✅ [DEBUG] DISTRIBUTE MEMORIES - RETURNING`);
    console.log(`   Total memory IDs: ${allMemoryIds.length}`);
    console.log(`   Memory IDs: ${allMemoryIds.join(", ")}`);

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
    console.error(`\n❌ [DEBUG] DISTRIBUTE MEMORIES - EXCEPTION CAUGHT`);
    console.error(`   Error:`, error);
    console.error(`   Stack:`, error instanceof Error ? error.stack : 'no stack');
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
