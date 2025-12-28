import { formatError } from "@/shared/lib/error-utils";

export function readFileToString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

export function downloadFile(file: File): void {
  const url = window.URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// Source: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
export async function getFileHash(file: File): Promise<string> {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw formatError("File size is too large");
    }

    // Get SHA-256 hash
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw formatError("Failed to get file hash", error);
  }
}

/**
 * Sanitizes a string to snake_case for use as variable/field names in templates.
 * Only allows lowercase letters, numbers, and underscores.
 * @param name The raw name to sanitize
 * @returns A valid snake_case name
 */
export function sanitizeFileName(name: string): string {
  const sanitized = name
    .replace(/[']/g, "") // Remove apostrophes (e.g., "Ring's" -> "Rings")
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove all other special characters
    .replace(/[\s-]+/g, "_") // Replace spaces and hyphens with underscores
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Handle camelCase -> snake_case
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .toLowerCase();

  // Ensure the name isn't blank
  if (!sanitized) {
    return "field";
  }

  // Limit maximum length
  return sanitized.slice(0, 100);
}

/**
 * Fuzzy match two character names.
 * Returns true if the names are similar enough to be considered a match.
 *
 * Matching rules:
 * 1. Exact match (case-insensitive)
 * 2. Substring match (min 3 chars)
 * 3. Word-level match (any word in one name matches any word in the other)
 * 4. Levenshtein distance ≤ 2 for names > 4 chars
 *
 * @param name1 First character name
 * @param name2 Second character name
 * @returns True if names match
 *
 * @example
 * fuzzyMatchCharacterName("Alice", "alice") // true (exact)
 * fuzzyMatchCharacterName("Alice", "Ali") // true (substring)
 * fuzzyMatchCharacterName("Alice the Great", "great") // true (word match)
 * fuzzyMatchCharacterName("Alice the Great", "Alice") // true (word match)
 * fuzzyMatchCharacterName("Alice", "Alise") // true (distance 1)
 * fuzzyMatchCharacterName("Alice", "Bob") // false
 */
export function fuzzyMatchCharacterName(name1: string, name2: string): boolean {
  const normalized1 = name1.toLowerCase().trim();
  const normalized2 = name2.toLowerCase().trim();

  // Rule 1: Exact match
  if (normalized1 === normalized2) {
    return true;
  }

  // Rule 2: Substring match (min 3 chars to avoid false positives)
  if (normalized1.length >= 3 && normalized2.length >= 3) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
  }

  // Rule 3: Word-level match (handles "Alice the Great" vs "great")
  const words1 = normalized1.split(/\s+/).filter(w => w.length >= 3);
  const words2 = normalized2.split(/\s+/).filter(w => w.length >= 3);

  if (words1.length > 0 && words2.length > 0) {
    for (const word1 of words1) {
      for (const word2 of words2) {
        // Check if words match exactly or one contains the other
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          return true;
        }
      }
    }
  }

  // Rule 4: Levenshtein distance for similar names
  if (normalized1.length > 4 && normalized2.length > 4) {
    const distance = levenshteinDistance(normalized1, normalized2);
    if (distance <= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits to change one string into the other)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Sanitizes a string to create valid XML tag names.
 * XML tag names must:
 * - Start with a letter or hyphen
 * - Only contain letters, digits, hyphens, underscores, and periods
 * - Not contain spaces or special characters
 *
 * @param name The raw name to sanitize (e.g., "John Doe", "Character 1", "シナリオ")
 * @returns A valid XML tag name (e.g., "john-doe", "character-1", "scenario")
 *
 * @example
 * sanitizeToXmlTag("John Doe") // "john-doe"
 * sanitizeToXmlTag("Character 1") // "character-1"
 * sanitizeToXmlTag("Alice's Adventure") // "alices-adventure"
 * sanitizeToXmlTag("シナリオ") // "unknown" (fallback for non-latin)
 */
export function sanitizeToXmlTag(name: string): string {
  const sanitized = name
    .replace(/[']/g, "") // Remove apostrophes (e.g., "Alice's" -> "Alices")
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove all other special characters (keeps letters, numbers, spaces, _, -)
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Handle camelCase -> kebab-case
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .toLowerCase();

  // Ensure the name isn't blank (fallback for non-latin characters)
  if (!sanitized) {
    return "unknown";
  }

  // Ensure it starts with a letter (XML requirement)
  if (/^[0-9]/.test(sanitized)) {
    return `tag-${sanitized}`;
  }

  // Limit maximum length
  return sanitized.slice(0, 50);
}

export function humanizeBytes(bytes: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Bytes";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}
