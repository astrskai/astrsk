/**
 * Roleplay Memory System - Public API
 *
 * Public interface for roleplay memory system integration.
 * Exports session hooks, World Agent, container utilities, and types.
 */

// Session lifecycle hooks (START/END node integration)
export {
  initializeRoleplayMemory,
  recallCharacterMemories,
  formatMemoriesForPrompt,
  distributeMemories,
  processUserMessage,
  hasRoleplayMemoryTag,
  injectMemoriesIntoPrompt,
  type UserMessageMemoryInput
} from './integration/session-hooks'

// World Agent execution
export { executeWorldAgent } from './core/world-agent'

// Container utilities
export {
  createCharacterContainer,
  createWorldContainer,
  validateCharacterContainer,
  validateWorldContainer
} from './core/containers'

// Core operations (for advanced use cases)
export {
  buildEnrichedMessage,
  storeWorldMessage,
  storeCharacterMessage,
  storeInitContent,
  storeWorldStateUpdate
} from './core/memory-storage'

export {
  retrieveCharacterMemories,
  retrieveWorldMemories,
  formatCharacterQuery
} from './core/memory-retrieval'

// World context utilities
export {
  parseWorldContext,
  formatWorldContext,
  mergeWorldContext,
  getCharacterContext
} from './utils/world-context'

// Public types
export type {
  // Session integration types
  SessionInitInput,
  MemoryRecallInput,
  MemoryDistributionInput,

  // World Agent types
  WorldAgentInput,
  WorldAgentOutput,
  SessionDataStore,

  // Memory query types
  CharacterMemoryQueryInput,
  CharacterMemoryQueryOutput,
  WorldMemoryQueryInput,
  WorldMemoryQueryOutput,

  // Storage types
  EnrichedMessageSections,
  StorageResult
} from '../shared/types'
