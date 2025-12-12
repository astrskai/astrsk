/**
 * Lorebook Types
 *
 * Data structures for lorebook entries used in character creation and editing.
 */

/**
 * Lorebook entry data structure
 * Used for mutations and data transfer between components
 */
export interface LorebookEntryData {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

/**
 * First message data structure for 1:1 session config
 */
export interface FirstMessageData {
  name: string;
  description: string;
}
