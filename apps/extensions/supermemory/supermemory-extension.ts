/**
 * Supermemory Extension
 *
 * Manages semantic memory storage and retrieval for roleplay sessions.
 * Stores message history in Supermemory service for long-term context recall.
 */

import {
  IExtension,
  IExtensionClient,
  ExtensionMetadata,
  HookContext,
  CardListItem,
  DataStoreSavedField,
  Message,
} from "../../pwa/src/modules/extensions/core/types";
// Note: Extension should NOT import from pwa except for extension types
// All other access must go through client.api

/**
 * Supermemory Extension
 *
 * This extension integrates the Supermemory semantic memory system with Astrsk sessions
 * using a **lazy initialization** architecture.
 *
 * ## Architecture: Lazy Initialization
 *
 * **Containers are implicit** - They're just string tags (e.g., "sessionId::characterId").
 * No explicit creation needed. They exist logically when first used.
 *
 * **Edge cases handled:**
 * ✅ Session created without scenario → Works (containers created when first needed)
 * ✅ Characters added later → Works (new containers created on-demand)
 * ✅ Imported sessions → Works (no initialization required)
 * ✅ Scenario deleted → Works (scenario storage is optional)
 * ✅ Legacy sessions → Works (containers created on first memory operation)
 *
 * ## Hook Responsibilities:
 *
 * - **scenario:afterAdd**: Stores scenario messages as initial memories (optional)
 * - **prompt:afterRender**: Recalls memories (containers created if needed)
 * - **turn:afterCreate**: Distributes memories (containers created if needed)
 * - **turn:afterCreate** (with isRegeneration: true): Updates existing memories (same as Regenerate)
 * - **turn:afterDelete**: Deletes memories
 */
export class SupermemoryExtension implements IExtension {
  metadata: ExtensionMetadata = {
    id: "supermemory",
    name: "Supermemory Semantic Memory",
    version: "1.0.0",
    description:
      "Manages semantic memory storage and retrieval for long-term roleplay context",
    author: "Astrsk",
  };

  private client: IExtensionClient | null = null;

  async onLoad(client: IExtensionClient): Promise<void> {
    // Remove existing listeners first to prevent memory leaks on hot reload
    if (this.client) {
      this.client.off("session:afterCreate", this.handleSessionAfterCreate);
      this.client.off("scenario:afterAdd", this.handleScenarioAfterAdd);
      this.client.off("prompt:afterRender", this.handlePromptAfterRender);
      this.client.off("turn:afterCreate", this.handleTurnAfterCreate);
      this.client.off("turn:afterDelete", this.handleTurnAfterDelete);
    }

    this.client = client;

    // Register hooks
    client.on("session:afterCreate", this.handleSessionAfterCreate);
    client.on("scenario:afterAdd", this.handleScenarioAfterAdd);
    client.on("prompt:afterRender", this.handlePromptAfterRender);
    client.on("turn:afterCreate", this.handleTurnAfterCreate);
    client.on("turn:afterDelete", this.handleTurnAfterDelete);

    console.log("🧠 [Supermemory Extension] Loaded successfully - semantic memory active");
  }

  async onUnload(): Promise<void> {
    if (this.client) {
      this.client.off("session:afterCreate", this.handleSessionAfterCreate);
      this.client.off("scenario:afterAdd", this.handleScenarioAfterAdd);
      this.client.off("prompt:afterRender", this.handlePromptAfterRender);
      this.client.off("turn:afterCreate", this.handleTurnAfterCreate);
      this.client.off("turn:afterDelete", this.handleTurnAfterDelete);
    }

    console.log("🧠 [Supermemory Extension] Unloaded successfully");
  }

  /**
   * Handle session:afterCreate hook
   * Register data schema fields for the session
   */
  private handleSessionAfterCreate = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { session } = context;

      if (!session || !this.client) {
        console.warn("[Supermemory Extension] Missing session or client in context");
        return;
      }

      console.log(`🧠 [Supermemory Extension] Registering data schema fields for session ${session.id.toString()}`);

      // Register Supermemory data schema fields
      const existingOrder = session.dataSchemaOrder || [];
      const newFields = ['memory_ids', 'participants', 'world_context'];

      // Add fields that don't already exist
      const updatedOrder = [...existingOrder];
      for (const field of newFields) {
        if (!updatedOrder.includes(field)) {
          updatedOrder.push(field);
        }
      }

      // Update session if any new fields were added
      if (updatedOrder.length > existingOrder.length) {
        session.setDataSchemaOrder(updatedOrder);
        await this.client.api.saveSession(session);
        console.log(`🧠 [Supermemory Extension] Registered ${updatedOrder.length - existingOrder.length} new data schema fields`);
      }

    } catch (error) {
      console.error("[Supermemory Extension] Failed to register data schema fields:", error);
    }
  };

  /**
   * Handle scenario:afterAdd hook
   * Store scenario messages as initial memories (containers created implicitly)
   */
  private handleScenarioAfterAdd = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { session, turn, scenarioDescription } = context;

      if (!session || !turn || !this.client) {
        console.warn("[Supermemory Extension] Missing session, turn, or client in context");
        return;
      }

      if (!scenarioDescription) {
        console.log("🧠 [Supermemory Extension] No scenario description provided, skipping");
        return;
      }

      const sessionId = session.id.toString();
      console.log(`🧠 [Supermemory Extension] Storing scenario for session ${sessionId}`);

      // Import storage function
      const { storeScenarioMessages } = await import("./roleplay-memory/integration/session-hooks");

      // Get character participants from session
      const characterCards = session.characterCards;
      if (!characterCards || characterCards.length === 0) {
        console.log("🧠 [Supermemory Extension] No characters in session, skipping scenario storage");
        return;
      }

      // Build participant IDs
      const participantIds = characterCards.map((c: CardListItem) => c.id.toString());

      // Build scenario structure
      const scenario = {
        messages: [
          {
            content: scenarioDescription,
            role: "system" as const,
          },
        ],
      };

      console.log(`🧠 [Supermemory Extension] Storing scenario: ${scenarioDescription.substring(0, 100)}...`);

      // Store scenario messages and capture memory IDs
      const memoryIds = await storeScenarioMessages({
        sessionId,
        participants: participantIds,
        characterIds: participantIds,
        scenario,
      });

      console.log(`🧠 [Supermemory Extension] Scenario stored successfully (${memoryIds.length} memories)`);

      // Store memory IDs in scenario turn's dataStore
      if (memoryIds.length > 0) {
        // Ensure dataStore is initialized
        let dataStore = turn.dataStore || [];
        if (!turn.dataStore) {
          turn.setDataStore([]);
          dataStore = [];
          console.log("🧠 [Supermemory Extension] Initialized empty dataStore for scenario turn");
        }

        const supermemoryIdsField = dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');
        if (supermemoryIdsField) {
          supermemoryIdsField.value = JSON.stringify(memoryIds);
        } else {
          turn.dataStore.push({
            id: 'memory_ids',
            name: 'memory_ids',
            type: 'string',
            value: JSON.stringify(memoryIds),
          });
        }

        // Persist updated turn with memory IDs
        const updateResult = await this.client.api.updateTurn(turn);
        if (updateResult.isSuccess) {
          console.log(`✅ [Supermemory Extension] Saved memory IDs to scenario turn`);
        } else {
          console.warn(`⚠️ [Supermemory Extension] Failed to save memory IDs:`, updateResult.getError());
        }
      }

    } catch (error) {
      console.error("[Supermemory Extension] Failed to store scenario:", error);
    }
  };

  /**
   * Handle prompt:afterRender hook
   * Find ###ROLEPLAY_MEMORY### tag and inject recalled memories
   *
   * ## Context Data Structure:
   *
   * **messages** - Complete array that will be sent to LLM:
   * - Fixed agent messages (system prompts, character cards, etc.)
   * - History messages (conversation turns)
   * - Can have history positioned anywhere (not always at end)
   * - Role (system/user/assistant) does NOT distinguish fixed vs history
   *
   * **context.history** - ONLY conversation turns (HistoryItem[]):
   * - Actual user/assistant conversation
   * - Each item has: { char_id?, char_name?, content, variables? }
   * - Use this to get recent conversation context
   * - Separate from fixed agent prompts
   *
   * ## What This Hook Does:
   * 1. Find ###ROLEPLAY_MEMORY### tag in messages array
   * 2. Use context.history to get last conversation turn (semantic context)
   * 3. Query Supermemory with conversation context
   * 4. Replace tag with recalled memories
   */
  private handlePromptAfterRender = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { session, messages, context: renderContext, flow, card } = context;

      if (!session || !this.client) {
        console.warn("[Supermemory Extension] Missing session or client in context");
        return;
      }

      if (!messages || messages.length === 0) {
        console.warn("[Supermemory Extension] No messages to process");
        return;
      }

      // Find the message with ONLY the ###ROLEPLAY_MEMORY### tag
      let tagMessageIndex = -1;
      for (let i = 0; i < messages.length; i++) {
        const trimmedContent = messages[i].content?.trim();
        if (trimmedContent === "###ROLEPLAY_MEMORY###") {
          tagMessageIndex = i;
          break;
        }
      }

      // If no tag found, nothing to do
      if (tagMessageIndex === -1) {
        return;
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔄 [Supermemory Extension] Memory tag detected, recalling memories...");

      // Get speaker (the character whose response is being generated)
      const speakerChar = renderContext?.char;
      const speakerId = speakerChar?.id?.toString();
      const speakerName = speakerChar?.name || "Unknown";

      if (!speakerId) {
        console.warn("[Supermemory Extension] No speaker character found in context, skipping memory recall");
        return;
      }

      console.log(`🎭 [Supermemory Extension] Recalling memories for speaker: ${speakerName} (${speakerId})`);

      const sessionId = session.id.toString();

      // Use context.history to get actual conversation history (not fixed agent messages)
      // History items are the actual turns in the conversation
      const history = renderContext?.history || [];

      // Only search memories if there are at least 5 messages in the conversation
      // Early conversation doesn't need memory search - not enough context yet
      if (history.length < 5) {
        console.log(`⏭️ [Supermemory Extension] Skipping memory search - only ${history.length} messages (need 5+)`);
        // Remove the memory tag (replace with empty string)
        messages[tagMessageIndex].content = "";
        return;
      }

      console.log(`📊 [Supermemory Extension] History has ${history.length} messages - proceeding with memory search`);

      // Import recall function
      const { recallCharacterMemories } = await import("./roleplay-memory/integration/session-hooks");

      const lastHistoryItem = history.length > 0 ? history[history.length - 1] : null;

      // Use last history message for semantic context
      // If no conversation history yet, use empty array (will recall based on character/world only)
      const recentMessages = lastHistoryItem ? [{
        role: lastHistoryItem.char_id ? "assistant" : "user",
        content: lastHistoryItem.content,
      }] : [];

      // Get current scene and world context from last turn in database
      // We only need the LAST turn to get current state, not all history
      const turnHistory = await this.client.api.getTurnHistory(sessionId, { limit: 1 });
      const lastTurn = Array.isArray(turnHistory) && turnHistory.length > 0
        ? turnHistory[turnHistory.length - 1]
        : null;

      // Try to get combined time+scene format first, fall back to scene only
      const current_scene = lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'selected_time_and_scene')?.value
        || lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'selected_scene')?.value
        || "Unknown Scene";
      const worldContext = lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'world_context')?.value as string || "";

      // Recall memories ONLY for the speaker (not all characters in session)
      let formattedMemories: string | null = null;
      try {
        formattedMemories = await recallCharacterMemories({
          sessionId,
          characterId: speakerId,
          characterName: speakerName,
          current_scene: String(current_scene),
          recentMessages,
          limit: 20,
          worldContext,
          getCard: this.client!.api.getCard.bind(this.client!.api),
        });
      } catch (error) {
        console.warn(`[Supermemory Extension] Failed to recall memories for ${speakerName}:`, error);
      }

      const validResults = formattedMemories ? [formattedMemories] : [];

      // Combine all recalled memories
      let roleplayMemories = "";
      if (validResults.length > 0) {
        roleplayMemories = validResults.join("\n\n");
        console.log(`🧠 [Supermemory Extension] Recalled memories for ${validResults.length} characters`);
      } else {
        roleplayMemories = "(No memories available)";
        console.log("🧠 [Supermemory Extension] No memories to inject");
      }

      // Inject memories by directly modifying the messages array
      messages[tagMessageIndex].content = roleplayMemories;

      console.log("✅ [Supermemory Extension] Memory injection complete");
      console.log(`   Injected content length: ${roleplayMemories.length} characters`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (error) {
      console.error("[Supermemory Extension] Failed to inject memories:", error);
      // Graceful degradation - replace with error message
      if (context.messages) {
        const tagIndex = context.messages.findIndex((m: Message) => m.content?.trim() === "###ROLEPLAY_MEMORY###");
        if (tagIndex >= 0) {
          context.messages[tagIndex].content = "(Memory system unavailable)";
        }
      }
    }
  };

  /**
   * Handle turn:afterCreate hook
   * Store new message in Supermemory
   */
  private handleTurnAfterCreate = async (
    context: HookContext,
  ): Promise<void> => {
    const { turn, session, isRegeneration } = context;

    if (!turn || !session || !this.client) {
      console.warn("[Supermemory Extension] Missing turn, session, or client in context");
      return;
    }

    const turnId = turn.id.toString();

    // Set 10-second safety timeout to force unblock if something goes wrong
    const { blockUIForTurn, unblockUI } = await import("../../pwa/src/modules/extensions/bootstrap");
    const safetyTimeout = setTimeout(() => {
      console.warn(`⏱️ [Supermemory Extension] Safety timeout reached for turn ${turnId}, force unblocking UI`);
      unblockUI();
    }, 10000);

    try {
      // Block UI interactions while creating memories
      blockUIForTurn(turnId, "Memory extension", "processing");

      const isRegenerationFlow = isRegeneration === true;
      console.log(`🧠 [Supermemory Extension] ${isRegenerationFlow ? 'Regenerating' : 'Creating'} memories for turn ${turnId}`);

      // STEP 0: Delete old memories if this is regeneration or update
      if (isRegenerationFlow) {
        const dataStore = turn.dataStore || [];
        const memoryIdsField = dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');

        if (memoryIdsField?.value) {
          try {
            const oldMemoryIds: string[] = JSON.parse(memoryIdsField.value as string);
            if (oldMemoryIds.length > 0) {
              console.log(`🗑️ [Supermemory Extension] Deleting ${oldMemoryIds.length} old memories...`);

              const { deleteMemory } = await import("./roleplay-memory/integration/session-hooks");
              const deletePromises = oldMemoryIds.map(async (memoryId: string) => {
                try {
                  await deleteMemory(memoryId);
                } catch (error) {
                  console.warn(`[Supermemory Extension] Failed to delete memory ${memoryId}:`, error);
                }
              });
              await Promise.all(deletePromises);
              console.log(`✅ [Supermemory Extension] Deleted ${oldMemoryIds.length} old memories`);
            }
          } catch (error) {
            console.warn("[Supermemory Extension] Failed to parse/delete old memory IDs:", error);
          }
        }
      }

      // Import distribution function
      const { distributeMemories } = await import("./roleplay-memory/integration/session-hooks");
      const { executeWorldAgent } = await import("./roleplay-memory/core/world-agent");
      const { executeSpaceTimeAgent } = await import("./roleplay-memory/core/space-time-agent");

      const sessionId = session.id.toString();
      const speakerCharacterId = turn.characterCardId?.toString() || "user";
      const speakerName = turn.characterName || "User";
      const message = turn.content;

      // Ensure dataStore is initialized
      if (!turn.dataStore) {
        turn.setDataStore([]);
        console.log("🧠 [Supermemory Extension] Initialized empty dataStore for turn");
      }
      const dataStore = turn.dataStore;

      // Get current scene pool from dataStore (inherits from previous turn)
      const scenePoolField = dataStore.find((f: DataStoreSavedField) => f.name === 'scene_pool');
      const currentScenePool: string[] = scenePoolField?.value
        ? JSON.parse(scenePoolField.value as string)
        : [];

      // Get current scene from dataStore (inherits from previous turn)
      const currentSceneField = dataStore.find((f: DataStoreSavedField) => f.name === 'selected_scene');
      const currentScene = currentSceneField?.value as string | undefined;

      // Get recent turn history for agent context
      const turnHistory = await this.client.api.getTurnHistory(sessionId, { limit: 5 });
      const recentMessages = Array.isArray(turnHistory)
        ? turnHistory.slice(-5).map((t: any) => ({
            role: (t.characterCardId ? "assistant" : "user") as "assistant" | "user",
            content: t.content,
          }))
        : [];

      // STEP 1: Execute Space-Time Agent to determine scene
      console.log(`🌍 [Supermemory Extension] Executing Space-Time Agent...`);
      if (currentScene) {
        console.log(`   Current Scene: "${currentScene}"`);
      }

      // Create adapter for Space-Time Agent's callAI signature
      const spaceTimeCallAI = async (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        response_format?: { type: string; schema: any };
      }) => {
        // Convert to World Agent's callAI signature
        const userMessage = params.messages.find(m => m.role === 'user');
        if (!userMessage) throw new Error('No user message found');

        // Convert raw model name to provider-prefixed format if needed
        const modelId = params.model.includes(':')
          ? params.model
          : `anthropic:${params.model}`;

        // Extension client returns { object: ... }, but Space-Time Agent expects raw object
        const result = await this.client!.api.callAI(userMessage.content, {
          modelId,
          schema: params.response_format?.schema,
          sessionId,
          feature: 'space-time-agent',
        });

        // Unwrap the object
        return result.object || result;
      };

      const spaceTimeOutput = await executeSpaceTimeAgent(
        {
          generatedMessage: message,
          recentMessages,
          scenePool: currentScenePool,
          speakerName,
          currentScene, // Pass current scene so agent knows where characters are
        },
        spaceTimeCallAI
      );

      // Extract time and scene from Space-Time Agent output
      const selectedTime = spaceTimeOutput.selected_time;
      const selectedScene = spaceTimeOutput.selected_scene;

      // Combine time and scene into full format
      const selectedTimeAndScene = `${selectedTime} ${selectedScene}`;

      console.log(`⏰ [Supermemory Extension] Selected Time: "${selectedTime}"`);
      console.log(`📍 [Supermemory Extension] Selected Scene: "${selectedScene}"`);
      console.log(`🎬 [Supermemory Extension] Combined: "${selectedTimeAndScene}"`);

      // Update scene pool based on Space-Time Agent output
      // Scene pool stores unique scene names only (not time+scene combinations)
      let updatedScenePool = [...currentScenePool];

      if (spaceTimeOutput.action === "new") {
        // New scene - add to pool (scene name only)
        console.log(`🆕 [Supermemory Extension] Creating new scene: "${selectedScene}"`);
        if (!updatedScenePool.includes(selectedScene)) {
          updatedScenePool.push(selectedScene);

          // Keep only last 20 scenes (FIFO)
          if (updatedScenePool.length > 20) {
            updatedScenePool = updatedScenePool.slice(-20);
            console.log(`🗑️ [Supermemory Extension] Scene pool full, removed oldest scene`);
          }
        }
      } else {
        console.log(`✅ [Supermemory Extension] Selected existing scene: "${selectedScene}"`);
      }

      // Get character_scenes from dataStore (will be updated by World Agent)
      const characterScenesField = dataStore.find((f: DataStoreSavedField) => f.name === 'character_scenes');
      const characterScenes = characterScenesField?.value
        ? JSON.parse(characterScenesField.value as string)
        : {};

      // Get world_context from dataStore (accumulated context from previous turns)
      const worldContextField = dataStore.find((f: DataStoreSavedField) => f.name === 'world_context');
      const currentWorldContext = (worldContextField?.value as string) || "";
      if (currentWorldContext) {
        console.log(`📚 [Supermemory Extension] Found accumulated world context (${currentWorldContext.length} chars)`);
      }

      // Get all session character names (includes NPCs added by NPC extension)
      // IMPORTANT: Fetch fresh session to get NPCs added by NPC extension
      // The session object passed to this hook is stale (from before NPC extension ran)
      const allSessionCharacterNames: string[] = [];

      const freshSessionResult = await this.client.api.getSession(sessionId);
      const freshSession = freshSessionResult.isSuccess ? freshSessionResult.getValue() : session;

      console.log(`📋 [Supermemory Extension] Fetched fresh session data`);
      console.log(`   User card ID: ${freshSession.userCharacterCardId}`);
      console.log(`   AI card IDs (${freshSession.aiCharacterCardIds?.length || 0}): ${freshSession.aiCharacterCardIds?.join(", ") || "none"}`);

      // Add user character if exists
      if (freshSession.userCharacterCardId) {
        try {
          const userCardResult = await this.client.api.getCard(freshSession.userCharacterCardId);
          if (userCardResult.isSuccess) {
            const userCard = userCardResult.getValue();
            const userName = userCard.name || userCard.props?.name || "User";
            allSessionCharacterNames.push(userName);
          }
        } catch (error) {
          console.warn(`Failed to fetch user card`);
        }
      }

      // Add all AI characters (includes NPCs)
      const aiCardIds = freshSession.aiCharacterCardIds || [];
      for (const cardId of aiCardIds) {
        try {
          const cardResult = await this.client.api.getCard(cardId);
          if (cardResult.isSuccess) {
            const card = cardResult.getValue();
            const name = card.name || card.props?.name || "Unknown";
            allSessionCharacterNames.push(name);
          }
        } catch (error) {
          console.warn(`Failed to fetch character card`);
        }
      }

      console.log(`   All session characters (${allSessionCharacterNames.length} total): ${allSessionCharacterNames.join(", ")}`);

      // STEP 2: Execute World Agent to assign character_scenes and detect participants
      console.log(`🌍 [Supermemory Extension] Executing World Agent...`);
      console.log(`   Input selectedScene: "${selectedScene}"`);
      console.log(`   Speaker: ${speakerName}`);

      const worldAgentOutput = await executeWorldAgent(
        {
          generatedMessage: message,
          recentMessages,
          dataStore: {
            sessionId,
            selectedScene,
            characterScenes,
            participants: allSessionCharacterNames, // Pass ALL session characters
            worldContext: currentWorldContext, // Accumulated context from previous turns
          } as any,
          speakerCharacterId,
          speakerName,
          sessionId,
          characterIdToName: {}, // Will be built inside distributeMemories
          worldMemoryContext: "",
          worldMemoryQuery: "",
        },
        this.client.api.callAI.bind(this.client.api)
      );

      console.log(`   World Agent returned ${worldAgentOutput.characterSceneUpdates.length} scene updates:`,
        worldAgentOutput.characterSceneUpdates.map(u => `${u.characterName} -> ${u.scene}`));

      // Update character_scenes from World Agent output
      const updatedCharacterScenes = { ...characterScenes };
      for (const update of worldAgentOutput.characterSceneUpdates) {
        updatedCharacterScenes[update.characterName] = update.scene;
      }

      // Derive participants from characterSceneUpdates (characters in selectedScene)
      const actualParticipants = Object.entries(updatedCharacterScenes)
        .filter(([_, scene]) => scene === selectedScene)
        .map(([name, _]) => name);

      console.log(`👥 [Supermemory Extension] Participants in scene "${selectedScene}":`, actualParticipants);

      // Distribute memories to containers and capture memory IDs
      // Use the combined time+scene format for memory storage
      const memoryIds = await distributeMemories({
        sessionId,
        speakerCharacterId,
        speakerName,
        message,
        scene: selectedTimeAndScene, // Use combined format (e.g., "Morning Day 1 Classroom")
        dataStore: {
          sessionId,
          selectedScene,
          scene_pool: updatedScenePool,
          characterScenes: updatedCharacterScenes,
          participants: actualParticipants,
          worldContext: worldAgentOutput.worldContextUpdates?.[0]?.contextUpdate || "",
        } as any,
        worldAgentOutput,
        // Pass helpers from extension client API
        getCard: this.client.api.getCard.bind(this.client.api),
        session,
      });

      console.log(`🧠 [Supermemory Extension] Memory stored for turn ${turn.id.toString()}`);
      console.log(`   Memory IDs (${memoryIds.length}):`, memoryIds);

      // Update turn.dataStore with Space-Time and World Agent outputs
      let dataStoreUpdated = false;

      // 1. Save memory IDs for future update/delete operations
      if (memoryIds.length > 0) {
        const supermemoryIdsField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');
        if (supermemoryIdsField) {
          supermemoryIdsField.value = JSON.stringify(memoryIds);
        } else {
          turn.dataStore.push({
            id: 'memory_ids',
            name: 'memory_ids',
            type: 'string',
            value: JSON.stringify(memoryIds),
          });
        }
        dataStoreUpdated = true;
      }

      // 2. Update scene_pool from Space-Time Agent
      const scenePoolFieldUpdate = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'scene_pool');
      if (scenePoolFieldUpdate) {
        scenePoolFieldUpdate.value = JSON.stringify(updatedScenePool);
      } else {
        turn.dataStore.push({
          id: 'scene_pool',
          name: 'scene_pool',
          type: 'string',
          value: JSON.stringify(updatedScenePool),
        });
      }
      console.log(`🎬 Updated scene_pool (${updatedScenePool.length} scenes)`);
      dataStoreUpdated = true;

      // 3. Update selected_time from Space-Time Agent
      const selectedTimeField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'selected_time');
      if (selectedTimeField) {
        selectedTimeField.value = selectedTime;
      } else {
        turn.dataStore.push({
          id: 'selected_time',
          name: 'selected_time',
          type: 'string',
          value: selectedTime,
        });
      }
      console.log(`⏰ Updated selected_time: "${selectedTime}"`);
      dataStoreUpdated = true;

      // 4. Update selected_scene from Space-Time Agent
      const selectedSceneField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'selected_scene');
      if (selectedSceneField) {
        selectedSceneField.value = selectedScene;
      } else {
        turn.dataStore.push({
          id: 'selected_scene',
          name: 'selected_scene',
          type: 'string',
          value: selectedScene,
        });
      }
      console.log(`📍 Updated selected_scene: "${selectedScene}"`);
      dataStoreUpdated = true;

      // 4b. Update selected_time_and_scene (combined format)
      const selectedTimeAndSceneField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'selected_time_and_scene');
      if (selectedTimeAndSceneField) {
        selectedTimeAndSceneField.value = selectedTimeAndScene;
      } else {
        turn.dataStore.push({
          id: 'selected_time_and_scene',
          name: 'selected_time_and_scene',
          type: 'string',
          value: selectedTimeAndScene,
        });
      }
      console.log(`🎬 Updated selected_time_and_scene: "${selectedTimeAndScene}"`);
      dataStoreUpdated = true;

      // 5. Update character_scenes from World Agent
      const characterScenesFieldUpdate = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'character_scenes');
      if (characterScenesFieldUpdate) {
        characterScenesFieldUpdate.value = JSON.stringify(updatedCharacterScenes);
      } else {
        turn.dataStore.push({
          id: 'character_scenes',
          name: 'character_scenes',
          type: 'string',
          value: JSON.stringify(updatedCharacterScenes),
        });
      }
      console.log(`🎭 Updated character_scenes:`, updatedCharacterScenes);
      dataStoreUpdated = true;

      // 6. Update participants derived from characterScenes
      if (actualParticipants.length > 0) {
        const participantsField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'participants');
        if (participantsField) {
          participantsField.value = JSON.stringify(actualParticipants);
        } else {
          turn.dataStore.push({
            id: 'participants',
            name: 'participants',
            type: 'string',
            value: JSON.stringify(actualParticipants),
          });
        }
        console.log(`   👥 Updated participants:`, actualParticipants);
        dataStoreUpdated = true;
      }

      // 7. Update world_context from World Agent
      if (worldAgentOutput.worldContextUpdates && worldAgentOutput.worldContextUpdates.length > 0) {
        // Merge world context updates
        const { mergeWorldContext } = await import("./roleplay-memory/utils/world-context");
        const currentWorldContext = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'world_context')?.value as string || "";
        const updatedWorldContext = mergeWorldContext(currentWorldContext, worldAgentOutput.worldContextUpdates);

        const worldContextField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'world_context');
        if (worldContextField) {
          worldContextField.value = updatedWorldContext;
        } else {
          turn.dataStore.push({
            id: 'world_context',
            name: 'world_context',
            type: 'string',
            value: updatedWorldContext,
          });
        }
        console.log(`   🌍 Updated world_context (${updatedWorldContext.length} chars)`);
        dataStoreUpdated = true;
      }

      // Save dataStore updates to database
      if (dataStoreUpdated) {
        console.log(`💾 [Supermemory Extension] Saving World Agent outputs to turn dataStore...`);
        const updateResult = await this.client.api.updateTurn(turn);
        if (updateResult.isSuccess) {
          console.log(`✅ [Supermemory Extension] World Agent outputs saved to turn dataStore`);
        } else {
          console.warn(`⚠️ [Supermemory Extension] Failed to save dataStore:`, updateResult.getError());
        }
      }

    } catch (error) {
      console.error("[Supermemory Extension] Failed to store memory:", error);
    } finally {
      // Clear safety timeout
      clearTimeout(safetyTimeout);

      // Unblock UI interactions (memory creation complete)
      unblockUI();
    }
  };

  /**
   * Handle turn:afterDelete hook
   * Clean up memories when turn is deleted
   */
  private handleTurnAfterDelete = async (
    context: HookContext,
  ): Promise<void> => {
    try {
      const { turn } = context;

      if (!turn) {
        console.warn("[Supermemory Extension] Missing turn in context");
        return;
      }

      console.log(`🧠 [Supermemory Extension] Deleting memories for turn ${turn.id.toString()}`);

      // Import delete function
      const { deleteMemory } = await import("./roleplay-memory/integration/session-hooks");

      // IMPORTANT: Collect memory IDs from ALL options, not just the selected one
      // When a turn has multiple options (from regeneration), each option has its own memories
      const allMemoryIds: string[] = [];

      for (const option of turn.options) {
        const dataStore = option.dataStore || [];
        const memoryIdsField = dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');

        if (memoryIdsField?.value) {
          try {
            const memoryIds: string[] = JSON.parse(memoryIdsField.value as string);
            allMemoryIds.push(...memoryIds);
          } catch (error) {
            console.warn("[Supermemory Extension] Failed to parse memory IDs from option:", error);
          }
        }
      }

      if (allMemoryIds.length === 0) {
        console.log("🧠 [Supermemory Extension] No memory IDs found in any option, skipping deletion");
        return;
      }

      console.log(`🧠 [Supermemory Extension] Found ${allMemoryIds.length} memories across ${turn.options.length} option(s)`);

      // Delete each memory (fire and forget - don't block)
      const deletePromises = allMemoryIds.map(async (memoryId: string) => {
        try {
          await deleteMemory(memoryId);
        } catch (error) {
          // Don't fail if memory doesn't exist - it may have been already deleted
          console.warn(`[Supermemory Extension] Failed to delete memory ${memoryId}:`, error);
        }
      });

      // Fire and forget - don't block the hook waiting for deletes
      Promise.all(deletePromises).then(() => {
        console.log(`🧠 [Supermemory Extension] Deleted ${allMemoryIds.length} memories`);
      }).catch((error) => {
        console.error("[Supermemory Extension] Error in background memory delete:", error);
      });

      console.log(`🧠 [Supermemory Extension] Initiated background deletion for ${allMemoryIds.length} memories`);

    } catch (error) {
      console.error("[Supermemory Extension] Failed to delete memory:", error);
    }
  };
}
