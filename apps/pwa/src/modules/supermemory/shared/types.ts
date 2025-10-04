/**
 * Shared types for Supermemory integration
 * Used by both simple-memory and roleplay-memory systems
 */

// Container tag types
export type CharacterContainerTag = `${string}-${string}` // {sessionId}-{characterId}
export type WorldContainerTag = `${string}-world` // {sessionId}-world
export type ContainerTag = CharacterContainerTag | WorldContainerTag

// Memory types
export type MemoryType =
  | 'message'              // Character message
  | 'world_state_update'   // Location change, event
  | 'character_update'     // Status change, item acquired
  | 'scenario'             // First scenario messages (if session has scenario)
  | 'character_card'       // Character description
  | 'lorebook'             // Lorebook entries (from character or plot card)

// Memory metadata interface
export interface MemoryMetadata {
  // Required fields
  speaker: string           // Character ID who spoke/acted
  participants: string[]    // Character IDs who participated
  gameTime: number         // Temporal marker (numeric for filtering)
  gameTimeInterval: string // Interval unit (default: "Day", can be customized later)
  type: MemoryType         // Memory category

  // Optional fields (context-dependent)
  isSpeaker?: boolean      // True if this container's character spoke
  permanent?: boolean      // True for initialization content (scenario, character_card, lorebook)
  lorebookKey?: string     // Key for lorebook entries
}

// Memory entry interface
export interface MemoryEntry {
  id: string                    // Supermemory-generated ID
  containerTag: string          // Container this memory belongs to
  content: string               // Message text with embedded gameDay
  metadata: MemoryMetadata
}
