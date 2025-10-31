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
 * Validate character container tag format
 * Must be: {sessionId}::{characterId}
 * Must NOT end with "::world"
 */
export function validateCharacterContainer(tag: string): boolean {
  return validateCharTag(tag)
}

/**
 * Validate world container tag format
 * Must end with "::world"
 */
export function validateWorldContainer(tag: string): boolean {
  return validateWorldTag(tag)
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
