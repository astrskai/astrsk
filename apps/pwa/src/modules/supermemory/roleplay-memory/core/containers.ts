/**
 * Roleplay Memory System - Container Management
 *
 * Container tag creation and validation utilities
 * Enforces hard container boundaries (character vs world)
 */

import { buildContainerTag, validateCharacterContainer as validateCharTag, validateWorldContainer as validateWorldTag } from '../../shared/utils'

/**
 * Create a character container tag
 * Format: {sessionId}-{characterId}
 */
export function createCharacterContainer(sessionId: string, characterId: string): string {
  return buildContainerTag(sessionId, characterId)
}

/**
 * Create a world container tag
 * Format: {sessionId}-world
 */
export function createWorldContainer(sessionId: string): string {
  return buildContainerTag(sessionId, 'world')
}

/**
 * Validate character container tag format
 * Must be: {sessionId}-{characterId}
 * Must NOT end with "-world"
 */
export function validateCharacterContainer(tag: string): boolean {
  return validateCharTag(tag)
}

/**
 * Validate world container tag format
 * Must end with "-world"
 */
export function validateWorldContainer(tag: string): boolean {
  return validateWorldTag(tag)
}

/**
 * Extract session ID from container tag
 */
export function extractSessionId(containerTag: string): string | null {
  const parts = containerTag.split('-')
  if (parts.length < 2) return null

  // For world container: session-uuid-world → session-uuid
  // For character: session-uuid-char-uuid → session-uuid (take first part before last segment)
  if (containerTag.endsWith('-world')) {
    return containerTag.replace(/-world$/, '')
  }

  // For character containers, session ID is everything except the last segment
  return parts.slice(0, -1).join('-')
}

/**
 * Extract character ID from character container tag
 * Returns null for world containers
 */
export function extractCharacterId(containerTag: string): string | null {
  if (containerTag.endsWith('-world')) return null

  const parts = containerTag.split('-')
  if (parts.length < 2) return null

  return parts[parts.length - 1]
}
