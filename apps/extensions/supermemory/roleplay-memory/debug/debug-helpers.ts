/**
 * Debug helpers for Supermemory roleplay memory system
 *
 * Helper functions to record debug events during memory operations.
 * Events are logged to console for debugging purposes.
 *
 * To enable debug logging, set localStorage.SUPERMEMORY_DEBUG = 'true'
 */

// Check if debug mode is enabled via localStorage
function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem('SUPERMEMORY_DEBUG') === 'true';
  } catch {
    return false;
  }
}

function logDebugEvent(type: string, data: any) {
  if (!isDebugEnabled()) return;

  console.debug(`[Supermemory Debug] ${type}:`, data);
}

/**
 * Record session initialization event
 */
export function recordSessionInit(data: any) {
  logDebugEvent("SESSION_INIT", data);
}

/**
 * Record memory recall event (START node)
 */
export function recordMemoryRecall(data: any) {
  logDebugEvent("MEMORY_RECALL", data);
}

/**
 * Record World Agent prompt event
 */
export function recordWorldAgentPrompt(data: any) {
  logDebugEvent("WORLD_AGENT_PROMPT", data);
}

/**
 * Record World Agent output event
 */
export function recordWorldAgentOutput(data: any) {
  logDebugEvent("WORLD_AGENT_OUTPUT", data);
}

/**
 * Record character memory add event
 */
export function recordCharacterMemoryAdd(data: any) {
  logDebugEvent("CHARACTER_MEMORY_ADD", data);
}

/**
 * Record world memory add event
 */
export function recordWorldMemoryAdd(data: any) {
  logDebugEvent("WORLD_MEMORY_ADD", data);
}

/**
 * Record datastore update event
 */
export function recordDataStoreUpdate(data: any) {
  logDebugEvent("DATASTORE_UPDATE", data);
}

/**
 * Increment turn number (call at start of each conversation turn)
 */
export function incrementTurn() {
  logDebugEvent("INCREMENT_TURN", {});
}

/**
 * Check if debug mode is enabled
 */
export function checkDebugEnabled(): boolean {
  return isDebugEnabled();
}
