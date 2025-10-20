/**
 * Shared types for Supermemory integration
 * Used by roleplay-memory system
 */

// ============================================================================
// Container Tag Types
// ============================================================================

export type CharacterContainerTag = `${string}::${string}` // {sessionId}::{characterId}
export type WorldContainerTag = `${string}::world` // {sessionId}::world
export type ContainerTag = CharacterContainerTag | WorldContainerTag

// ============================================================================
// Memory Types
// ============================================================================

export type MemoryType =
  | 'message'              // Character message
  | 'world_state_update'   // Location change, event
  | 'character_update'     // Status change, item acquired
  | 'scenario'             // First scenario messages (if session has scenario)
  | 'character_card'       // Character description
  | 'lorebook'             // Lorebook entries (from character or plot card)

// ============================================================================
// Memory Metadata and Entry
// ============================================================================

export interface MemoryMetadata {
  // Required fields
  speaker: string           // Character ID who spoke/acted (or 'system' for world events)
  participants: string[]    // Character IDs who participated (or all characters for world events)
  game_time: number         // Temporal marker (numeric for filtering)
  game_time_interval: string // Interval unit (default: "Day", can be customized later)
  type: MemoryType         // Memory category

  // Optional fields (context-dependent)
  isSpeaker?: boolean      // True if this container's character spoke
  permanent?: boolean      // True for initialization content (scenario, character_card, lorebook)
  lorebookKey?: string     // Key for lorebook entries
}

export interface MemoryEntry {
  id: string                    // Supermemory-generated ID
  containerTag: string          // Container this memory belongs to
  content: string               // Message text with embedded gameDay
  metadata: MemoryMetadata
}

// ============================================================================
// World Agent Types
// ============================================================================

export interface WorldAgentInput {
  // Identifiers
  sessionId: string
  speakerCharacterId: string
  speakerName: string // Character name for speaker

  // Message Context
  generatedMessage: string

  // Conversation Context
  recentMessages: Array<{
    role: string // Character name or ID
    content: string
    game_time: number
  }>

  // Session State
  dataStore: SessionDataStore

  // Character ID to Name mapping
  characterIdToName?: Record<string, string>

  // Optional: World memory context (for knowledge extraction)
  worldMemoryContext?: string
  worldMemoryQuery?: string // Query used to retrieve world memories
}

export interface WorldAgentOutput {
  // Participant Detection (using character NAMES, not IDs)
  actualParticipants: string[] // Non-empty array of character NAMES (e.g., ["Yui", "Ren"])

  // World Context Updates (per character)
  worldContextUpdates: Array<{
    characterName: string // Character name (e.g., "Yui", "Ren")
    contextUpdate: string // Brief context update
  }>

  // Time Progression
  delta_time: number // How much time passed (0 = no time change, 1 = one interval, etc.)

  // Optional: Future optimization
  confidence?: number // 0-1 scale for detection confidence
}

// ============================================================================
// Enriched Message Types
// ============================================================================

export interface EnrichedMessageSections {
  currentTime: string // "###Current time###\nGameTime: {gameTime} {interval}"
  message: string // "###Message###\nMessage: {char}: {content} GameTime: {gameTime} {interval}"
  worldContext?: string // "###World context###\n{context}"
}

export interface EnrichedMessage {
  sections: EnrichedMessageSections
}

// ============================================================================
// Memory Query Types
// ============================================================================

export interface CharacterMemoryQueryInput {
  // Container
  containerTag: string // Format: {sessionId}::{characterId}

  // Temporal Context
  current_game_time: number
  current_game_time_interval: string // Default: "Day"

  // Conversation Context
  recentMessages: string[] // Last 1-3 messages (formatted)

  // Character name for query formatting
  characterName: string

  // Retrieval Parameters
  limit: number // Default: 5

  // Optional Filters
  filters?: {
    game_time?: {
      gte?: number
      lte?: number
    }
    type?: string // Exact match ('message', 'lorebook', etc.)
  }
}

export interface WorldMemoryQueryInput {
  // Container
  containerTag: string // Format: {sessionId}::world

  // Search Query
  query: string

  // Retrieval Parameters
  limit: number // Default: 10

  // Optional Filters
  filters?: {
    game_time?: {
      gte?: number
      lte?: number
    }
    type?: string
  }
}

export interface CharacterMemoryQueryOutput {
  memories: string[]
  count: number
}

export interface WorldMemoryQueryOutput {
  memories: string[]
  count: number
  metadata?: Array<{
    game_time: number
    type: string
    participants?: string[]
  }>
}

// ============================================================================
// Session Data Store Types
// ============================================================================

export interface SessionDataStore {
  // Required State
  sessionId: string
  currentScene: string // Location/scene name
  participants: string[] // All character NAMES in session (e.g., ["Yui", "Ren"])
  game_time: number // Current game time (numeric)
  game_time_interval: string // Time interval unit (default: "Day")

  // Optional State
  timeOfDay?: string // Morning, evening, night
  activeQuest?: string // Current objective
  worldFlags?: Record<string, boolean> // State flags
  relationships?: Record<string, number> // Character relationship scores
  worldContext?: string // Accumulated world context string (format: "[Name]\nContext...\n\n[Name2]...")

  // Metadata (optional - may not be available in all contexts)
  createdAt?: number
  updatedAt?: number
}

// ============================================================================
// Retrieval Configuration
// ============================================================================

export interface RetrievalConfig {
  defaultCharacterLimit: number // Default: 20
  defaultWorldLimit: number // Default: 10
  temporalWindowDays: number // Time window for filtering (default: 30)
  includePermanentMemories: boolean // Auto-include init content (future)
}

// ============================================================================
// Storage Operation Results
// ============================================================================

export interface StorageResult {
  id: string | null
  success: boolean
  error?: string
}

// ============================================================================
// Initialization Types
// ============================================================================

export interface SessionInitInput {
  sessionId: string
  participants: string[] // Character IDs
  characters: CharacterInitData[]
  scenario?: ScenarioData // Optional: first messages
}

export interface CharacterInitData {
  characterId: string
  characterName: string
  characterCard: string // Character description
  lorebook?: LorebookEntry[] // Lore entries
}

export interface LorebookEntry {
  key: string // Lorebook key for matching
  content: string // Lore text
}

export interface ScenarioData {
  messages: Array<{
    role: string
    content: string
  }>
}

// ============================================================================
// Session Hook Types
// ============================================================================

export interface MemoryRecallInput {
  sessionId: string
  characterId: string
  characterName: string
  current_game_time: number
  current_game_time_interval: string
  recentMessages: Array<{
    role: string
    content: string
    game_time: number
  }>
  limit?: number
  worldContext?: string // Accumulated world context from dataStore
}

export interface MemoryDistributionInput {
  sessionId: string
  speakerCharacterId: string
  speakerName: string
  message: string
  game_time: number
  game_time_interval: string
  dataStore: SessionDataStore
  worldMemoryContext?: string
  // World Agent output (already executed)
  worldAgentOutput: WorldAgentOutput
}
