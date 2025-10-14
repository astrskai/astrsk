/**
 * Debug helpers for Supermemory roleplay memory system
 *
 * Helper functions to record debug events during memory operations.
 * Events are only recorded when debug mode is enabled.
 */

import type {
  SupermemoryDebugEventType,
  SessionInitEventData,
  MemoryRecallEventData,
  WorldAgentPromptEventData,
  WorldAgentOutputEventData,
  MemoryDistributionEventData,
  CharacterMemoryAddEventData,
  WorldMemoryAddEventData,
  DataStoreUpdateEventData,
} from "@/app/stores/supermemory-debug-store";

// Import the store dynamically to avoid circular dependencies
let debugStore: any = null;

function getDebugStore() {
  if (!debugStore) {
    // Dynamic import to avoid circular dependencies
    import("@/app/stores/supermemory-debug-store").then((module) => {
      debugStore = module.useSupermemoryDebugStore;
    });
  }
  return debugStore;
}

function isDebugEnabled(): boolean {
  const store = getDebugStore();
  if (!store) return false;
  return store.getState().isDebugEnabled;
}

function addEvent(type: SupermemoryDebugEventType, data: any) {
  if (!isDebugEnabled()) return;

  const store = getDebugStore();
  if (!store) return;

  store.getState().addEvent(type, data);
}

/**
 * Record session initialization event
 */
export function recordSessionInit(data: SessionInitEventData) {
  addEvent("session_init", data);
}

/**
 * Record memory recall event (START node)
 */
export function recordMemoryRecall(data: MemoryRecallEventData) {
  addEvent("memory_recall", data);
}

/**
 * Record World Agent prompt event
 */
export function recordWorldAgentPrompt(data: WorldAgentPromptEventData) {
  addEvent("world_agent_prompt", data);
}

/**
 * Record World Agent output event
 */
export function recordWorldAgentOutput(data: WorldAgentOutputEventData) {
  addEvent("world_agent_output", data);
}

/**
 * Record memory distribution event
 * DEPRECATED: Memory distribution events are no longer recorded.
 * Information is shown in Character Memory Add events instead.
 */
// export function recordMemoryDistribution(data: MemoryDistributionEventData) {
//   addEvent("memory_distribution", data);
// }

/**
 * Record character memory add event
 */
export function recordCharacterMemoryAdd(data: CharacterMemoryAddEventData) {
  addEvent("character_memory_add", data);
}

/**
 * Record world memory add event
 */
export function recordWorldMemoryAdd(data: WorldMemoryAddEventData) {
  addEvent("world_memory_add", data);
}

/**
 * Record datastore update event
 */
export function recordDataStoreUpdate(data: DataStoreUpdateEventData) {
  addEvent("datastore_update", data);
}

/**
 * Increment turn number (call at start of each conversation turn)
 */
export function incrementTurn() {
  if (!isDebugEnabled()) return;

  const store = getDebugStore();
  if (!store) return;

  store.getState().incrementTurn();
}

/**
 * Check if debug mode is enabled
 */
export function checkDebugEnabled(): boolean {
  return isDebugEnabled();
}
