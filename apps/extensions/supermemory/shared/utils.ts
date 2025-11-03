/**
 * Shared utility functions for Supermemory integration
 * Used by roleplay-memory system
 */

/**
 * Format a message with embedded scene
 * @param characterName - Character who spoke
 * @param content - Message content
 * @param scene - Current scene (e.g., "Classroom Morning Day 1")
 * @returns Formatted message string
 */
export function formatMessageWithScene(
  characterName: string,
  content: string,
  scene: string
): string {
  return `Message: ${characterName}: ${content} Scene: ${scene}`
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

/**
 * Extract actual message content from enriched memory format
 *
 * Enriched format contains:
 * - ###Current time###\nGameTime: X Day
 * - ###Message###\nMessage: CharName: CONTENT
 * - ###World context###\nContext (optional)
 *
 * This function extracts ONLY the message content for verbatim quotation.
 *
 * @param enrichedMemory - Full enriched memory string from storage
 * @returns Array of extracted message contents (one per message section found)
 *
 * @example
 * Input: "###Current time###\nGameTime: 5 Day\n\n###Message###\nMessage: Yui: Hello there!"
 * Output: ["Hello there!"]
 */
export function extractMessageContent(enrichedMemory: string): string[] {
  const messages: string[] = [];

  // Match pattern: Message: {name}: {content}
  // We want to capture only the {content} part
  //
  // Handles three formats:
  // 1. World container (ongoing): "Message: Yui: Hello GameTime: 5 Day"
  // 2. Old character container: "Message: Yui: Hello GameTime: 5 Day" (backward compatibility)
  // 3. New character container: "Message: Yui: Hello" (no GameTime)
  //
  // The (?:\s+GameTime:\s*\d+\s+\w+)? makes GameTime optional
  const messagePattern = /Message:\s*([^:]+):\s*(.+?)(?:\s+GameTime:\s*\d+\s+\w+)?(?:\n|$)/g;

  let match;
  while ((match = messagePattern.exec(enrichedMemory)) !== null) {
    const content = match[2]?.trim();
    if (content) {
      messages.push(content);
    }
  }

  return messages;
}

/**
 * Parse verbatim memories to extract quotable message content
 *
 * Takes array of enriched memory strings and extracts only the actual
 * message content that can be quoted directly, removing all metadata.
 *
 * @param verbatimMemories - Array of enriched memory strings from v3 search
 * @returns Array of clean message contents suitable for direct quotation
 */
export function parseVerbatimMemories(verbatimMemories: string[]): string[] {
  const allMessages: string[] = [];

  for (const memory of verbatimMemories) {
    const extracted = extractMessageContent(memory);
    allMessages.push(...extracted);
  }

  return allMessages;
}
