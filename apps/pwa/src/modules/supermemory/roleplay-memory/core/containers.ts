/**
 * Roleplay Memory System - Container Management
 *
 * Container tag creation and validation utilities
 * Enforces hard container boundaries (character vs world)
 */

import { buildContainerTag, validateCharacterContainer as validateCharTag, validateWorldContainer as validateWorldTag } from '../../shared/utils'

/**
 * Create a character container tag
 * Format: {sessionId}::{characterId}
 */
export function createCharacterContainer(sessionId: string, characterId: string): string {
  return buildContainerTag(sessionId, characterId)
}

/**
 * Create a world container tag
 * Format: {sessionId}::world
 */
export function createWorldContainer(sessionId: string): string {
  return buildContainerTag(sessionId, 'world')
}

/**
 * Create an NPC container tag
 * Format: {sessionId}::{npcId}
 * NPC IDs are lowercase single words (e.g., "john", "jane")
 */
export function createNpcContainer(sessionId: string, npcId: string): string {
  return buildContainerTag(sessionId, npcId)
}

/**
 * Validate character container tag format
 * Must be: {sessionId}::{characterId}
 * Must NOT end with "::world"
 * Must NOT be an NPC container (lowercase single word)
 */
export function validateCharacterContainer(tag: string): boolean {
  if (!validateCharTag(tag)) return false

  // Exclude NPC containers (lowercase single word IDs)
  const containerId = extractCharacterId(tag)
  if (containerId && /^[a-z]+$/.test(containerId)) {
    return false // This is an NPC container
  }

  return true
}

/**
 * Validate world container tag format
 * Must end with "::world"
 */
export function validateWorldContainer(tag: string): boolean {
  return validateWorldTag(tag)
}

/**
 * Validate NPC container tag format
 * Must be: {sessionId}::{npcId}
 * NPC ID must be lowercase single word (e.g., "john", "jane")
 * Must NOT be "world"
 */
export function validateNpcContainer(tag: string): boolean {
  const parts = tag.split('::')
  if (parts.length !== 2) return false

  const [sessionId, containerId] = parts

  // NPC containers: not "world" and lowercase single word
  if (containerId === 'world') return false

  // Simple check: NPCs are lowercase letters only
  if (/^[a-z]+$/.test(containerId)) return true

  return false
}

/**
 * Extract session ID from container tag
 * Uses '::' delimiter to handle UUIDs with hyphens correctly
 */
export function extractSessionId(containerTag: string): string | null {
  if (containerTag.endsWith('::world')) {
    return containerTag.replace(/::world$/, '')
  }
  const sep = '::'
  const idx = containerTag.indexOf(sep)
  return idx > 0 ? containerTag.slice(0, idx) : null
}

/**
 * Extract character ID from character container tag
 * Returns null for world containers
 * Uses '::' delimiter to handle UUIDs with hyphens correctly
 */
export function extractCharacterId(containerTag: string): string | null {
  if (containerTag.endsWith('::world')) return null
  const sep = '::'
  const idx = containerTag.indexOf(sep)
  return idx > 0 ? containerTag.slice(idx + sep.length) : null
}
