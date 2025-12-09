/**
 * Draft Character Types
 *
 * Used during session creation wizard to hold character data
 * before final session creation. Characters are NOT saved to DB
 * until the user clicks the final "Create Session" button.
 */

import type { LorebookEntryData } from "@/entities/character/api/mutations";

/**
 * Source of the draft character
 * - library: Existing character from the user's library (already in DB)
 * - import: Imported from PNG/JSON file (not yet in DB)
 * - chat: Created via AI chat (not yet in DB)
 */
export type DraftCharacterSource = "library" | "import" | "chat";

/**
 * Character data for import/chat created characters
 * This data will be used to create the character when session is finalized
 */
export interface DraftCharacterData {
  name: string;
  description: string;
  tags?: string[];
  cardSummary?: string;
  exampleDialogue?: string;
  creator?: string;
  version?: string;
  conceptualOrigin?: string;
  // Image handling
  imageFile?: File; // PNG file from import
  imageUrl?: string; // Object URL for preview (created from imageFile)
  // 1:1 Session config (from imported character)
  scenario?: string;
  firstMessages?: { name: string; description: string }[];
  lorebook?: LorebookEntryData[];
}

/**
 * Draft character - represents a character during session creation
 *
 * Can be either:
 * 1. An existing library character (has existingCardId)
 * 2. A new character from import/chat (has data)
 */
export interface DraftCharacter {
  /** Temporary ID for UI rendering (React key) */
  tempId: string;
  /** Source of this character */
  source: DraftCharacterSource;
  /** ID of existing character in DB (only for source: "library") */
  existingCardId?: string;
  /** Character data (only for source: "import" | "chat") */
  data?: DraftCharacterData;
}

/**
 * Helper to check if draft character is from library
 */
export function isLibraryCharacter(draft: DraftCharacter): boolean {
  return draft.source === "library" && !!draft.existingCardId;
}

/**
 * Helper to check if draft character needs to be created
 */
export function needsCreation(draft: DraftCharacter): boolean {
  return draft.source !== "library" && !!draft.data;
}

/**
 * Get display name for a draft character
 */
export function getDraftCharacterName(draft: DraftCharacter): string {
  if (draft.data) {
    return draft.data.name;
  }
  return "Unknown";
}

/**
 * Get display description for a draft character
 */
export function getDraftCharacterDescription(draft: DraftCharacter): string {
  if (draft.data) {
    return draft.data.description;
  }
  return "";
}

/**
 * Generate a temporary ID for draft characters
 */
export function generateTempId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
