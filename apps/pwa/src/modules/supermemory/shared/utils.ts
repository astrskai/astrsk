/**
 * Shared utility functions for Supermemory integration
 * Used by roleplay-memory system
 */

/**
 * Format a message with embedded game time
 * @param characterName - Character who spoke
 * @param content - Message content
 * @param game_time - Current game time
 * @param interval - Time interval unit (default: "Day")
 * @returns Formatted message string
 */
export function formatMessageWithGameTime(
  characterName: string,
  content: string,
  game_time: number,
  interval: string = 'Day'
): string {
  return `Message: ${characterName}: ${content} GameTime: ${game_time} ${interval}`
}

/**
 * Build a container tag from session ID and resource ID
 * Uses '::' delimiter to avoid conflicts with UUIDs containing hyphens
 * @param sessionId - Session identifier
 * @param resourceId - Character ID or "world"
 * @returns Container tag string
 */
export function buildContainerTag(
  sessionId: string,
  resourceId: string
): string {
  return `${sessionId}::${resourceId}`
}

/**
 * Validate a character container tag format
 * @param tag - Container tag to validate
 * @returns True if valid character container format
 */
export function validateCharacterContainer(tag: string): boolean {
  // Must have format: {sessionId}::{characterId}
  // Must NOT end with "::world"
  return tag.includes('::') && !tag.endsWith('::world')
}

/**
 * Validate a world container tag format
 * @param tag - Container tag to validate
 * @returns True if valid world container format
 */
export function validateWorldContainer(tag: string): boolean {
  // Must end with "::world"
  return tag.endsWith('::world')
}

/**
 * Validate any container tag
 * @param tag - Container tag to validate
 * @returns True if valid container format (character or world)
 */
export function validateContainerTag(tag: string): boolean {
  return validateCharacterContainer(tag) || validateWorldContainer(tag)
}
