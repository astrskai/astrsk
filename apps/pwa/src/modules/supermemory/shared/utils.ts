/**
 * Shared utility functions for Supermemory integration
 * Used by both simple-memory and roleplay-memory systems
 */

/**
 * Format a message with embedded game time
 * @param characterName - Character who spoke
 * @param content - Message content
 * @param gameTime - Current game time
 * @param interval - Time interval unit (default: "Day")
 * @returns Formatted message string
 */
export function formatMessageWithGameTime(
  characterName: string,
  content: string,
  gameTime: number,
  interval: string = 'Day'
): string {
  return `Message: ${characterName}: ${content} GameTime: ${gameTime} ${interval}`
}

/**
 * Build a container tag from session ID and resource ID
 * @param sessionId - Session identifier
 * @param resourceId - Character ID or "world"
 * @returns Container tag string
 */
export function buildContainerTag(
  sessionId: string,
  resourceId: string
): string {
  return `${sessionId}-${resourceId}`
}

/**
 * Validate a character container tag format
 * @param tag - Container tag to validate
 * @returns True if valid character container format
 */
export function validateCharacterContainer(tag: string): boolean {
  // Must have format: {sessionId}-{characterId}
  // Must NOT end with "-world"
  const pattern = /^[a-zA-Z0-9-]+-[a-zA-Z0-9-]+$/
  return pattern.test(tag) && !tag.endsWith('-world')
}

/**
 * Validate a world container tag format
 * @param tag - Container tag to validate
 * @returns True if valid world container format
 */
export function validateWorldContainer(tag: string): boolean {
  // Must end with "-world"
  return tag.endsWith('-world')
}

/**
 * Validate any container tag
 * @param tag - Container tag to validate
 * @returns True if valid container format (character or world)
 */
export function validateContainerTag(tag: string): boolean {
  return validateCharacterContainer(tag) || validateWorldContainer(tag)
}
