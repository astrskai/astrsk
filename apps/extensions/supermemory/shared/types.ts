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
  scene: string             // Scene name (e.g., "Classroom Morning Day 1")
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
  // World Context Updates (per character in the current scene)
  worldContextUpdates: Array<{
    characterName: string // Character name (e.g., "Yui", "Ren")
    contextUpdate: string // Brief context update
  }>

  // Character Scene Assignments (determines participants)
  characterSceneUpdates: Array<{
    characterName: string // Character name (e.g., "Alice", "Bob")
    scene: string // Scene where this character currently is (e.g., "Classroom Morning Day 1", "Park Afternoon Day 1", or "none" if unknown)
  }>

  // Optional: Future optimization
  confidence?: number // 0-1 scale for detection confidence
}

// ============================================================================
// Enriched Message Types
// ============================================================================

export interface EnrichedMessageSections {
  currentTime: string // "###Current time###\nGameTime: {gameTime} {interval}"
  participants?: string // "###Participants###\n{name1}, {name2}, {name3}"
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

  // Scene Context
  current_scene: string // Current scene (e.g., "Classroom Morning Day 1")

  // Conversation Context
  recentMessages: string[] // Last 1-3 messages (formatted)

  // Character name for query formatting
  characterName: string

  // Retrieval Parameters
  limit: number // Default: 5

  // Optional Filters
  filters?: {
    scene?: string // Scene filter (exact match)
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
    scene?: string // Scene filter (exact match)
    type?: string
  }
}

export interface CharacterMemoryQueryOutput {
  memories: string[] // v4 semantic search results (knowledge graph)
  verbatimMemories?: string[] // v3 document search results (for direct quotation)
  count: number
  metadata?: Array<{
    scene: string
    type: string
    participants: string[]
  }>
}

export interface WorldMemoryQueryOutput {
  memories: string[]
  count: number
  metadata?: Array<{
    scene: string
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
  selectedScene: string // Current scene (e.g., "Classroom Morning Day 1")
  participants: string[] // All character NAMES in session (e.g., ["Yui", "Ren"])

  // Scene System (NEW - replaces game_time)
  scene_pool?: string[] // Array of recent scenes (max 20, FIFO)
  characterScenes?: Record<string, string> // Map of character name → scene

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
// Update & Delete Operation Types
// ============================================================================

export interface GetMemoryRequest {
  memoryId: string
}

export interface GetMemoryResponse {
  id: string
  containerTag: string
  content: string
  metadata: MemoryMetadata
  customId?: string
  status?: string
}

export interface UpdateMemoryRequest {
  memoryId: string
  content?: string
  metadata?: Partial<MemoryMetadata>
}

export interface UpdateMemoryResponse {
  id: string
  status: string // "queued" for reprocessing
  customId?: string
}

export interface DeleteMemoryRequest {
  memoryId: string
}

export interface DeleteMemoryResponse {
  success: boolean
}

export interface BulkDeleteRequest {
  ids?: string[]
  containerTags?: string[]
}

export interface BulkDeleteResponse {
  success: boolean
  deletedCount: number
  errors?: Array<{
    id: string
    error: string
  }>
  containerTags?: string[]
}

// Convenience type for update operations
export interface UpdateStorageResult extends StorageResult {
  status?: string // Processing status
}

// Convenience type for delete operations
export interface DeleteStorageResult {
  success: boolean
  error?: string
  deletedCount?: number
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
  // NOTE: characterCard and lorebook are NOT stored at initialization
  // They will be fetched fresh during memory recall to ensure up-to-date data
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
  current_scene: string
  recentMessages: Array<{
    role: string
    content: string
  }>
  limit?: number
  worldContext?: string // Accumulated world context from dataStore
  turnCount?: number // Number of turns in session (for first 5 turns optimization)
  // DataStore state for world context (CRITICAL for first 5 turns)
  dataStoreState?: {
    selectedTime?: string // e.g., "Morning Day 1"
    selectedScene?: string // e.g., "Classroom 2-A"
    scenePool?: string[] // e.g., ["Classroom 2-A", "Hallway"]
    characterScenes?: Record<string, string> // e.g., {"Yui": "Classroom 2-A", "Ren": "Hallway"}
  }
  // Helper to get card by ID (from extension client API)
  getCard?: (cardId: any) => Promise<any>
}

export interface MemoryDistributionInput {
  sessionId: string
  speakerCharacterId: string
  speakerName: string
  message: string
  scene: string
  dataStore: SessionDataStore
  worldMemoryContext?: string
  // World Agent output (already executed)
  worldAgentOutput: WorldAgentOutput
  // Helper to get card by ID (from extension client API)
  getCard?: (cardId: any) => Promise<any>
  // Session object for character mapping
  session?: any
}
