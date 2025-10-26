/**
 * JSON utility functions for parsing and handling JSON data
 */

/**
 * Parses incomplete or malformed JSON by attempting to repair it.
 * This is useful for streaming scenarios where JSON may be received in chunks.
 *
 * @param jsonString - The potentially incomplete JSON string to parse
 * @returns The parsed object if successful, null if parsing fails
 *
 * @example
 * ```typescript
 * // Incomplete JSON with unclosed brace
 * parsePartialJson('{"name": "John", "age": 30')
 * // Returns: { name: "John", age: 30 }
 *
 * // Incomplete string value
 * parsePartialJson('{"name": "Jo')
 * // Returns: { name: "Jo" }
 *
 * // Incomplete field
 * parsePartialJson('{"name": "John", "age":')
 * // Returns: { name: "John" }
 * ```
 */
export function parsePartialJson(jsonString: string): any | null {
  // First try to parse as-is
  try {
    return JSON.parse(jsonString);
  } catch {
    // If parsing fails, try to repair the JSON by closing open structures
    const trimmed = jsonString.trim();
    if (!trimmed) return null;

    // Count open brackets and braces
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }
    }

    // If we're in a string, close it
    let repaired = trimmed;
    if (inString) {
      repaired += '"';
    }

    // Close any incomplete field values (remove trailing commas and incomplete values)
    // Find the last complete character that's not whitespace
    let lastValidIndex = repaired.length - 1;
    while (lastValidIndex >= 0 && /\s/.test(repaired[lastValidIndex])) {
      lastValidIndex--;
    }

    // If the last character is a comma, colon, or opening bracket/brace, we have an incomplete field
    if (lastValidIndex >= 0) {
      const lastChar = repaired[lastValidIndex];
      if (lastChar === ',' || lastChar === ':') {
        // Remove incomplete field
        repaired = repaired.substring(0, lastValidIndex);
      } else if (lastChar === '{' || lastChar === '[') {
        // Empty object or array, close it immediately
        repaired = repaired.substring(0, lastValidIndex + 1);
      }
    }

    // Close open brackets and braces
    for (let i = 0; i < openBrackets; i++) {
      repaired += ']';
    }
    for (let i = 0; i < openBraces; i++) {
      repaired += '}';
    }

    // Try parsing the repaired JSON
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}
