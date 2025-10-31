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
 * - **turn:beforeUpdate**: Updates existing memories
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
  private turnsBeingCreated: Set<string> = new Set(); // Track turns currently in turn:afterCreate

  async onLoad(client: IExtensionClient): Promise<void> {
    // Remove existing listeners first to prevent memory leaks on hot reload
    if (this.client) {
      this.client.off("session:afterCreate", this.handleSessionAfterCreate);
      this.client.off("scenario:afterAdd", this.handleScenarioAfterAdd);
      this.client.off("prompt:afterRender", this.handlePromptAfterRender);
      this.client.off("turn:afterCreate", this.handleTurnAfterCreate);
      this.client.off("turn:beforeUpdate", this.handleTurnBeforeUpdate);
      this.client.off("turn:afterDelete", this.handleTurnAfterDelete);
    }

    this.client = client;

    // Register hooks
    client.on("session:afterCreate", this.handleSessionAfterCreate);
    client.on("scenario:afterAdd", this.handleScenarioAfterAdd);
    client.on("prompt:afterRender", this.handlePromptAfterRender);
    client.on("turn:afterCreate", this.handleTurnAfterCreate);
    client.on("turn:beforeUpdate", this.handleTurnBeforeUpdate);
    client.on("turn:afterDelete", this.handleTurnAfterDelete);

    console.log("🧠 [Supermemory Extension] Loaded successfully - semantic memory active");
  }

  async onUnload(): Promise<void> {
    if (this.client) {
      this.client.off("session:afterCreate", this.handleSessionAfterCreate);
      this.client.off("scenario:afterAdd", this.handleScenarioAfterAdd);
      this.client.off("prompt:afterRender", this.handlePromptAfterRender);
      this.client.off("turn:afterCreate", this.handleTurnAfterCreate);
      this.client.off("turn:beforeUpdate", this.handleTurnBeforeUpdate);
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
        if (!turn.dataStore) {
          turn.dataStore = [];
          console.log("🧠 [Supermemory Extension] Initialized empty dataStore for scenario turn");
        }

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

        // Persist updated turn with memory IDs
        // The turn:beforeUpdate hook will check if this is a new memory ID save vs content edit
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
        game_time: 0, // Not available in context, but not critical for query context
      }] : [];

      // Get current game time and world context from last turn in database
      // We only need the LAST turn to get current state, not all history
      const turnHistory = await this.client.api.getTurnHistory(sessionId, { limit: 1 });
      const lastTurn = Array.isArray(turnHistory) && turnHistory.length > 0
        ? turnHistory[turnHistory.length - 1]
        : null;
      const current_game_time = lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'game_time')?.value || 0;
      const current_game_time_interval = lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'game_time_interval')?.value || "Day";
      const worldContext = lastTurn?.dataStore?.find((f: DataStoreSavedField) => f.name === 'world_context')?.value as string || "";

      // Recall memories ONLY for the speaker (not all characters in session)
      let formattedMemories: string | null = null;
      try {
        formattedMemories = await recallCharacterMemories({
          sessionId,
          characterId: speakerId,
          characterName: speakerName,
          current_game_time: Number(current_game_time),
          current_game_time_interval: String(current_game_time_interval),
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
    const { turn, session } = context;

    if (!turn || !session || !this.client) {
      console.warn("[Supermemory Extension] Missing turn, session, or client in context");
      return;
    }

    // Mark this turn as being created to prevent turn:beforeUpdate from updating memories
    const turnId = turn.id.toString();
    this.turnsBeingCreated.add(turnId);

    // Set 10-second safety timeout to force unblock if something goes wrong
    const { blockUIForTurn, unblockUI } = await import("../../pwa/src/modules/extensions/bootstrap");
    const safetyTimeout = setTimeout(() => {
      console.warn(`⏱️ [Supermemory Extension] Safety timeout reached for turn ${turnId}, force unblocking UI`);
      unblockUI();
    }, 10000);

    try {
      // Block UI interactions while creating memories
      blockUIForTurn(turnId, "Memory extension", "processing");

      console.log(`🧠 [Supermemory Extension] Creating new memories for turn ${turnId}`);

      // Check if turn dataStore has old memory IDs (copied from previous turn during regeneration)
      // These belong to the OLD turn and should be cleaned up by turn:afterDelete on that turn
      // Just clear them here and proceed with creating NEW memories for THIS turn
      const existingMemoryIdsField = turn.dataStore?.find(
        (f: DataStoreSavedField) => f.name === 'memory_ids'
      );

      if (existingMemoryIdsField?.value) {
        try {
          const existingMemoryIds: string[] = JSON.parse(existingMemoryIdsField.value);
          if (existingMemoryIds.length > 0) {
            console.log(`🧹 [Supermemory Extension] Clearing ${existingMemoryIds.length} old memory IDs from dataStore (copied from previous turn)`);
            console.log(`   Old memory IDs:`, existingMemoryIds);
            console.log(`   These will be cleaned up by turn:afterDelete on the old turn`);

            // Clear the old memory IDs - don't try to delete them
            existingMemoryIdsField.value = JSON.stringify([]);
          }
        } catch (error) {
          console.warn(`   ⚠️ Failed to parse existing memory IDs:`, error);
          // Continue anyway - proceed with new memory creation
        }
      }

      // Import distribution function
      const { distributeMemories } = await import("./roleplay-memory/integration/session-hooks");
      const { executeWorldAgent } = await import("./roleplay-memory/core/world-agent");

      const sessionId = session.id.toString();
      const speakerCharacterId = turn.characterCardId?.toString() || "user";
      const speakerName = turn.characterName || "User";
      const message = turn.content;

      // Ensure dataStore is initialized (IMPORTANT: modify turn.dataStore directly!)
      if (!turn.dataStore) {
        turn.dataStore = [];
        console.log("🧠 [Supermemory Extension] Initialized empty dataStore for turn");
      }
      const dataStore = turn.dataStore;
      const gameTimeField = dataStore.find((f: DataStoreSavedField) => f.name === 'game_time');
      const gameTimeIntervalField = dataStore.find((f: DataStoreSavedField) => f.name === 'game_time_interval');
      const game_time = gameTimeField?.value ? Number(gameTimeField.value) : 0;
      const game_time_interval = (gameTimeIntervalField?.value as string) || "Day";

      // Get recent turn history for World Agent context
      const turnHistory = await this.client.api.getTurnHistory(sessionId, { limit: 5 });
      const recentMessages = Array.isArray(turnHistory)
        ? turnHistory.slice(-5).map((t: any) => ({
            role: t.characterCardId ? "assistant" : "user",
            content: t.content,
            game_time: t.dataStore?.find((f: DataStoreSavedField) => f.name === 'game_time')?.value || 0,
          }))
        : [];

      // Get all character IDs for participant mapping
      // const characterCards = session.characterCards.map(c => c.id.toString());

      // Execute World Agent to detect participants and extract context
      const worldAgentOutput = await executeWorldAgent(
        {
          generatedMessage: message,
          recentMessages,
          dataStore: {
            sessionId,
            currentScene: "",
            participants: [],
            game_time,
            game_time_interval,
            worldContext: "", // TODO: Get from session dataStore if exists
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

      // Distribute memories to containers and capture memory IDs
      const memoryIds = await distributeMemories({
        sessionId,
        speakerCharacterId,
        speakerName,
        message,
        game_time,
        game_time_interval,
        dataStore: {
          sessionId,
          currentScene: "",
          game_time,
          game_time_interval,
          participants: worldAgentOutput.actualParticipants || [],
          worldContext: worldAgentOutput.worldContextUpdates?.[0]?.contextUpdate || "",
        } as any,
        worldAgentOutput,
        // Pass helpers from extension client API
        getCard: this.client.api.getCard.bind(this.client.api),
        session,
      });

      console.log(`🧠 [Supermemory Extension] Memory stored for turn ${turn.id.toString()}`);
      console.log(`   Memory IDs (${memoryIds.length}):`, memoryIds);

      // Update turn.dataStore with World Agent outputs
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

      // 2. Update game_time if World Agent detected time passing
      if (worldAgentOutput.delta_time > 0) {
        const newGameTime = game_time + worldAgentOutput.delta_time;
        const gameTimeField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'game_time');
        if (gameTimeField) {
          gameTimeField.value = String(newGameTime);
        } else {
          turn.dataStore.push({
            id: 'game_time',
            name: 'game_time',
            type: 'number',
            value: String(newGameTime),
          });
        }
        console.log(`   ⏰ Updated game_time: ${game_time} → ${newGameTime}`);
        dataStoreUpdated = true;
      }

      // 3. Update participants detected by World Agent
      if (worldAgentOutput.actualParticipants && worldAgentOutput.actualParticipants.length > 0) {
        const participantsField = turn.dataStore.find((f: DataStoreSavedField) => f.name === 'participants');
        if (participantsField) {
          participantsField.value = JSON.stringify(worldAgentOutput.actualParticipants);
        } else {
          turn.dataStore.push({
            id: 'participants',
            name: 'participants',
            type: 'string',
            value: JSON.stringify(worldAgentOutput.actualParticipants),
          });
        }
        console.log(`   👥 Updated participants:`, worldAgentOutput.actualParticipants);
        dataStoreUpdated = true;
      }

      // 4. Update world_context from World Agent
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
      // turn:beforeUpdate will be skipped because turnsBeingCreated.has(turnId) is true
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

      // Remove turn from creation tracking
      this.turnsBeingCreated.delete(turnId);

      // Unblock UI interactions (memory creation complete)
      unblockUI();
    }
  };

  /**
   * Handle turn:beforeUpdate hook
   *
   * NOTE: This hook is DISABLED for automatic memory updates.
   * Memory updates should only happen when user explicitly clicks an update button in the UI.
   * The UI buttons should call updateTurnMemories() directly instead of relying on this hook.
   */
  private handleTurnBeforeUpdate = async (
    _context: HookContext,
  ): Promise<void> => {
    // Disabled - memory updates should be explicit, not automatic
    console.log("🧠 [Supermemory Extension] turn:beforeUpdate fired, but automatic updates are disabled. Use explicit UI buttons instead.");
    return;
  };

  /**
   * Explicitly update memories for a turn
   * This should be called by UI buttons (Update Message, Confirm Update, etc.)
   * NOT called automatically by hooks
   */
  public async updateTurnMemories(turnId: string): Promise<void> {
    try {
      if (!this.client) {
        console.warn("[Supermemory Extension] Client not initialized");
        return;
      }

      // Fetch turn from database
      const turnResult = await this.client.api.getTurn(turnId);
      if (turnResult.isFailure) {
        console.warn("[Supermemory Extension] Failed to fetch turn from DB");
        return;
      }

      const turn = turnResult.getValue();
      const dataStore = turn.dataStore || [];

      // Extract memory IDs
      const memoryIdsField = dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');
      if (!memoryIdsField || !memoryIdsField.value) {
        console.log("🧠 [Supermemory Extension] No memory IDs found in turn");
        return;
      }

      // Parse memory IDs
      let memoryIds: string[] = [];
      try {
        memoryIds = JSON.parse(memoryIdsField.value as string);
      } catch (error) {
        console.warn("[Supermemory Extension] Failed to parse memory IDs:", error);
        return;
      }

      if (memoryIds.length === 0) {
        console.log("🧠 [Supermemory Extension] No memory IDs to update");
        return;
      }

      console.log(`🧠 [Supermemory Extension] Explicitly updating ${memoryIds.length} memories for turn ${turnId}`);

      // Import update functions
      const { updateMemory } = await import("./roleplay-memory/integration/session-hooks");

      // Extract metadata from dataStore
      const gameTime = Number(dataStore.find((f: DataStoreSavedField) => f.name === 'game_time')?.value || 0);
      const gameTimeInterval = dataStore.find((f: DataStoreSavedField) => f.name === 'game_time_interval')?.value || "Day";
      const participantsField = dataStore.find((f: DataStoreSavedField) => f.name === 'participants')?.value;

      // Parse participants
      let participants: string[] = [];
      if (participantsField) {
        try {
          participants = JSON.parse(participantsField as string);
        } catch (error) {
          console.warn("[Supermemory Extension] Failed to parse participants:", error);
        }
      }

      console.log(`   Metadata: game_time=${gameTime}, participants=${participants.length}, content_length=${turn.content?.length || 0}`);

      // Update each memory with new content and metadata
      const updatePromises = memoryIds.map(async (memoryId: string) => {
        try {
          const metadata: any = {
            game_time: gameTime,
            game_time_interval: gameTimeInterval as string,
          };

          if (participants.length > 0) {
            metadata.participants = participants;
          }

          await updateMemory(
            memoryId,
            turn.content, // Update content
            metadata      // Update metadata
          );
        } catch (error) {
          console.warn(`[Supermemory Extension] Failed to update memory ${memoryId}:`, error);
        }
      });

      await Promise.all(updatePromises);
      console.log(`✅ [Supermemory Extension] Updated ${memoryIds.length} memories for turn ${turnId}`);

    } catch (error) {
      console.error("[Supermemory Extension] Failed to update turn memories:", error);
      throw error;
    }
  }

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

      console.log(`🧠 [Supermemory Extension] Deleting memory for turn ${turn.id.toString()}`);

      // Import delete function
      const { deleteMemory } = await import("./roleplay-memory/integration/session-hooks");

      // Extract memory IDs from turn dataStore
      const dataStore = turn.dataStore || [];
      const memoryIdsField = dataStore.find((f: DataStoreSavedField) => f.name === 'memory_ids');

      if (!memoryIdsField || !memoryIdsField.value) {
        console.log("🧠 [Supermemory Extension] No memory IDs found in turn, skipping deletion");
        return;
      }

      // Parse memory IDs (stored as JSON array)
      let memoryIds: string[] = [];
      try {
        memoryIds = JSON.parse(memoryIdsField.value as string);
      } catch (error) {
        console.warn("[Supermemory Extension] Failed to parse memory IDs:", error);
        return;
      }

      if (memoryIds.length === 0) {
        console.log("🧠 [Supermemory Extension] No memory IDs to delete");
        return;
      }

      // Delete each memory (fire and forget - don't block)
      const deletePromises = memoryIds.map(async (memoryId: string) => {
        try {
          await deleteMemory(memoryId);
        } catch (error) {
          // Don't fail if memory doesn't exist - it may have been already deleted
          console.warn(`[Supermemory Extension] Failed to delete memory ${memoryId}:`, error);
        }
      });

      // Fire and forget - don't block the hook waiting for deletes
      Promise.all(deletePromises).then(() => {
        console.log(`🧠 [Supermemory Extension] Deleted ${memoryIds.length} memories`);
      }).catch((error) => {
        console.error("[Supermemory Extension] Error in background memory delete:", error);
      });

      console.log(`🧠 [Supermemory Extension] Initiated background deletion for ${memoryIds.length} memories`);

    } catch (error) {
      console.error("[Supermemory Extension] Failed to delete memory:", error);
    }
  };
}
