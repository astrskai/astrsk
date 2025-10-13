/**
 * World Context Utilities
 *
 * Helper functions for parsing and formatting world context strings
 * Format: [CharacterName]\nContext text\n\n[CharacterName2]\nContext text...
 */

/**
 * Parse world context string into Record of character names to context
 *
 * @param contextString - Formatted string with [Name] sections
 * @returns Record mapping character names to their context
 *
 * @example
 * Input: "[Yui]\nYou are class rep\n\n[Ren]\nYou are transfer student"
 * Output: { "Yui": "You are class rep", "Ren": "You are transfer student" }
 */
export function parseWorldContext(contextString: string): Record<string, string> {
  if (!contextString || contextString.trim() === '') {
    return {}
  }

  const result: Record<string, string> = {}

  // Match pattern: [Name] followed by text until next [Name] or end
  const regex = /\[([^\]]+)\]\s*\n([^\[]*)/g
  let match

  while ((match = regex.exec(contextString)) !== null) {
    const characterName = match[1].trim()
    const context = match[2].trim()

    if (characterName && context) {
      result[characterName] = context
    }
  }

  return result
}

/**
 * Format world context Record into structured string
 *
 * @param contextRecord - Record mapping character names to context
 * @returns Formatted string with [Name] sections
 *
 * @example
 * Input: { "Yui": "You are class rep", "Ren": "You are transfer student" }
 * Output: "[Yui]\nYou are class rep\n\n[Ren]\nYou are transfer student"
 */
export function formatWorldContext(contextRecord: Record<string, string>): string {
  const entries = Object.entries(contextRecord).filter(([_, context]) => context && context.trim() !== '')

  if (entries.length === 0) {
    return ''
  }

  return entries
    .map(([name, context]) => `[${name}]\n${context}`)
    .join('\n\n')
}

/**
 * Merge new context updates into existing world context
 *
 * @param currentContextString - Current world context string
 * @param updates - Array of context updates with character names
 * @returns Updated world context string
 *
 * @example
 * current: "[Yui]\nYou are class rep"
 * updates: [{ characterName: "Yui", contextUpdate: "You offered to help Ren" }]
 * output: "[Yui]\nYou are class rep You offered to help Ren"
 */
export function mergeWorldContext(
  currentContextString: string,
  updates: Array<{ characterName: string; contextUpdate: string }>
): string {
  // Parse current context
  const currentContext = parseWorldContext(currentContextString)

  // Merge updates
  for (const update of updates) {
    const { characterName, contextUpdate } = update

    if (!characterName || !contextUpdate) continue

    const existing = currentContext[characterName] || ''
    currentContext[characterName] = existing
      ? `${existing} ${contextUpdate}`
      : contextUpdate
  }

  // Format back to string
  return formatWorldContext(currentContext)
}

/**
 * Get context for a specific character by name
 *
 * @param contextString - World context string
 * @param characterName - Name of character to find
 * @returns Context for that character, or empty string if not found
 *
 * @example
 * Input: "[Yui]\nYou are class rep\n\n[Ren]\nYou are transfer student", "Yui"
 * Output: "You are class rep"
 */
export function getCharacterContext(contextString: string, characterName: string): string {
  const contextRecord = parseWorldContext(contextString)
  return contextRecord[characterName] || ''
}
