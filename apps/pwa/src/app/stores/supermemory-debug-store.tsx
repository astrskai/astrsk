/**
 * Supermemory Debug Store
 *
 * Tracks debug events for roleplay memory system to visualize data flow.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "@/shared/utils/zustand-utils";
import { LocalPersistStorage } from "@/app/stores/local-persist-storage";

// Event types
export type SupermemoryDebugEventType =
  | "session_init"
  | "memory_recall"
  | "world_memory_retrieval"
  | "world_agent_prompt"
  | "world_agent_output"
  | "memory_distribution"
  | "character_memory_add"
  | "world_memory_add"
  | "datastore_update"
  | "agent_prompt_with_memories";

export interface SupermemoryDebugEvent {
  id: string; // Unique event ID
  timestamp: number; // Unix timestamp
  turnNumber: number; // Conversation turn number
  type: SupermemoryDebugEventType;
  data: any; // Event-specific data
}

// Specific event data types
export interface SessionInitEventData {
  sessionId: string;
  characters: Array<{
    characterId: string;
    characterName: string;
    containerTag: string;
    scenarioMessages: number;
    hasCharacterCard: boolean;
    lorebookEntries: number;
  }>;
  worldContainerTag: string;
}

export interface MemoryRecallEventData {
  characterId: string;
  characterName: string;
  containerTag: string;
  query: string; // Formatted query sent to Supermemory
  retrievedCount: number;
  memories: string[]; // Retrieved memory strings
  worldContext?: string; // Character-specific world context appended
}

export interface WorldAgentPromptEventData {
  speakerName: string;
  generatedMessage: string;
  prompt: string; // Full prompt with examples
  recentMessages: Array<{
    role: string;
    content: string;
    game_time: number;
  }>;
  dataStore: any; // SessionDataStore snapshot
  worldMemoryContext?: string; // World memories retrieved for context
  worldMemoryQuery?: string; // Query used to retrieve world memories
}

export interface WorldAgentOutputEventData {
  actualParticipants: string[]; // Detected participant names
  worldContextUpdates: Array<{
    characterName: string;
    contextUpdate: string;
  }>;
  delta_time: number;
  rawOutput?: any; // Raw AI output
}

export interface MemoryDistributionEventData {
  speakerName: string;
  message: string;
  participantIds: string[]; // Character IDs receiving memories
  participantNames: string[]; // Character names for display
  worldMessageContent: string; // Raw message stored in world container
  enrichedContents: Array<{
    characterName: string;
    characterId: string;
    content: string; // Full enriched content sent to this character
    worldContext?: string; // Character-specific world context (extracted)
  }>;
}

export interface CharacterMemoryAddEventData {
  characterId: string;
  characterName: string;
  containerTag: string;
  content: string; // Enriched message content (3 sections)
  metadata: {
    speaker: string;
    participants: string[];
    isSpeaker: boolean;
    game_time: number;
    game_time_interval: string;
    type: string;
  };
  storageId?: string; // Supermemory-generated ID
}

export interface WorldMemoryAddEventData {
  containerTag: string;
  content: string; // Raw message content
  metadata: {
    speaker: string;
    participants: string[];
    game_time: number;
    game_time_interval: string;
    type: string;
  };
  storageId?: string;
}

export interface DataStoreUpdateEventData {
  updates: {
    game_time?: number;
    participants?: string[];
    worldContext?: string;
  };
  before: any; // DataStore snapshot before update
  after: any; // DataStore snapshot after update
}

interface SupermemoryDebugState {
  // Debug mode toggle
  isDebugEnabled: boolean;
  setIsDebugEnabled: (enabled: boolean) => void;

  // Debug events
  events: SupermemoryDebugEvent[];
  currentTurnNumber: number;

  // Actions
  addEvent: (
    type: SupermemoryDebugEventType,
    data: any,
  ) => void;
  clearEvents: () => void;
  incrementTurn: () => void;

  // Panel visibility
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

const useSupermemoryDebugStoreBase = create<SupermemoryDebugState>()(
  persist(
    immer((set, get) => ({
      isDebugEnabled: false,
      setIsDebugEnabled: (enabled) =>
        set((state) => {
          state.isDebugEnabled = enabled;
        }),

      events: [],
      currentTurnNumber: 0,

      addEvent: (type, data) =>
        set((state) => {
          if (!state.isDebugEnabled) return; // Only record if debug enabled

          const event: SupermemoryDebugEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            turnNumber: state.currentTurnNumber,
            type,
            data,
          };

          state.events.push(event);

          // Keep only last 50 events to prevent memory issues
          if (state.events.length > 50) {
            state.events = state.events.slice(-50);
          }
        }),

      clearEvents: () =>
        set((state) => {
          state.events = [];
          state.currentTurnNumber = 0;
        }),

      incrementTurn: () =>
        set((state) => {
          state.currentTurnNumber += 1;
        }),

      isPanelOpen: false,
      setIsPanelOpen: (open) =>
        set((state) => {
          state.isPanelOpen = open;
        }),
    })),
    {
      name: "supermemory-debug-storage",
      storage: new LocalPersistStorage<SupermemoryDebugState>(),
    },
  ),
);

export const useSupermemoryDebugStore = createSelectors(
  useSupermemoryDebugStoreBase,
);
