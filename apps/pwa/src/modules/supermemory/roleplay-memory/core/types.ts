/**
 * Roleplay Memory System - Core Types
 *
 * Roleplay-specific types extending shared types from @/modules/supermemory/shared/types
 * Based on data-model.md and contracts/
 */

import type { MemoryMetadata } from '../../shared/types'

// ============================================================================
// World Agent Types
// ============================================================================

export interface WorldAgentInput {
  // Identifiers
  sessionId: string
  speakerCharacterId: string

  // Message Context
  generatedMessage: string

  // Conversation Context
  recentMessages: Array<{
    role: string // Character name or ID
    content: string
    gameTime: number
  }>

  // Session State
  dataStore: SessionDataStore

  // Optional: World memory context (for knowledge extraction)
  worldMemoryContext?: string
}

export interface WorldAgentOutput {
  // Participant Detection
  actualParticipants: string[] // Non-empty array of character IDs

  // Knowledge Distribution
  worldKnowledge: Record<string, string> // characterId → character-specific knowledge

  // Optional: Future optimization
  confidence?: number // 0-1 scale for detection confidence
}

// ============================================================================
// Enriched Message Types
// ============================================================================

export interface EnrichedMessageSections {
  currentTime: string // "###Current time###\nGameTime: {gameTime} {interval}"
  message: string // "###Message###\nMessage: {char}: {content} GameTime: {gameTime} {interval}"
  worldKnowledge?: string // "###Newly discovered world knowledge###\n{knowledge}"
}

export interface EnrichedMessage {
  sections: EnrichedMessageSections
}

// ============================================================================
// Memory Query Types
// ============================================================================

export interface CharacterMemoryQueryInput {
  // Container
  containerTag: string // Format: {sessionId}-{characterId}

  // Temporal Context
  currentGameTime: number
  currentGameTimeInterval: string // Default: "Day"

  // Conversation Context
  recentMessages: string[] // Last 1-3 messages (formatted)

  // Character name for query formatting
  characterName: string

  // Retrieval Parameters
  limit: number // Default: 5

  // Optional Filters
  filters?: {
    gameTime?: {
      gte?: number
      lte?: number
    }
    type?: string // Exact match ('message', 'lorebook', etc.)
  }
}

export interface WorldMemoryQueryInput {
  // Container
  containerTag: string // Format: {sessionId}-world

  // Search Query
  query: string

  // Retrieval Parameters
  limit: number // Default: 10

  // Optional Filters
  filters?: {
    gameTime?: {
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
    gameTime: number
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
  participants: string[] // All character IDs in session
  gameTime: number // Current game time (numeric)
  gameTimeInterval: string // Time interval unit (default: "Day")

  // Optional State
  timeOfDay?: string // Morning, evening, night
  activeQuest?: string // Current objective
  worldFlags?: Record<string, boolean> // State flags
  relationships?: Record<string, number> // Character relationship scores

  // Metadata
  createdAt: number
  updatedAt: number
}

// ============================================================================
// Retrieval Configuration
// ============================================================================

export interface RetrievalConfig {
  defaultCharacterLimit: number // Default: 5
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
  currentGameTime: number
  currentGameTimeInterval: string
  recentMessages: Array<{
    role: string
    content: string
    gameTime: number
  }>
  limit?: number
}

export interface MemoryDistributionInput {
  sessionId: string
  speakerCharacterId: string
  speakerName: string
  message: string
  gameTime: number
  gameTimeInterval: string
  dataStore: SessionDataStore
  worldMemoryContext?: string
}
