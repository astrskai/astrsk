/**
 * Lorebook State Management Store
 *
 * Tracks existing lorebook entries and rejected suggestions per character/session
 * Similar to NPC store pattern
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lorebook entry data structure
 * Tracks what entries exist for each character
 */
export interface LorebookEntryData {
  id: string;                    // Unique entry ID
  characterId: string;           // Character card ID this entry belongs to
  characterName: string;         // Character name for display
  sessionId: string;             // Session ID where this was created
  name: string;                  // Entry name/title (e.g., "Ren's Fireball Magic")
  keys: string[];                // Keywords that trigger this entry
  content: string;               // The lorebook information
  createdAt: number;             // Timestamp when entry was created
  lastUpdatedAt: number;         // Timestamp when entry was last modified
}

/**
 * Rejected lorebook suggestion
 * Tracks what the user has rejected so AI doesn't suggest it again
 */
export interface RejectedLorebookEntry {
  id: string;                    // Unique rejection ID
  characterId: string;           // Character card ID
  sessionId: string;             // Session ID where this was rejected
  name: string;                  // Entry name that was rejected
  content: string;               // The rejected lorebook information
  rejectedAt: number;            // Timestamp when user rejected
  reason?: string;               // Optional reason for rejection
}

interface LorebookStoreState {
  // Existing lorebook entries (successfully added)
  entries: LorebookEntryData[];

  // Rejected lorebook entries (user declined)
  rejectedEntries: RejectedLorebookEntry[];

  // === Existing Entries Management ===

  /**
   * Add a new lorebook entry after user confirms
   */
  addEntry: (entry: LorebookEntryData) => void;

  /**
   * Get all lorebook entries for a specific character in a session
   */
  getEntriesByCharacter: (characterId: string, sessionId: string) => LorebookEntryData[];

  /**
   * Get all lorebook entries for a session (all characters)
   */
  getEntriesBySession: (sessionId: string) => LorebookEntryData[];

  /**
   * Update an existing entry
   */
  updateEntry: (entryId: string, updates: Partial<LorebookEntryData>) => void;

  /**
   * Remove an entry
   */
  removeEntry: (entryId: string) => void;

  // === Rejected Entries Management ===

  /**
   * Add a rejected entry (user declined suggestion)
   */
  addRejectedEntry: (entry: RejectedLorebookEntry) => void;

  /**
   * Get all rejected entries for a specific character in a session
   */
  getRejectedEntriesByCharacter: (characterId: string, sessionId: string) => RejectedLorebookEntry[];

  /**
   * Get all rejected entries for a session
   */
  getRejectedEntriesBySession: (sessionId: string) => RejectedLorebookEntry[];

  /**
   * Remove a rejected entry (allow AI to suggest again)
   */
  removeRejectedEntry: (entryId: string) => void;

  // === Cleanup ===

  /**
   * Clear all entries for a session (when session is deleted)
   */
  clearSession: (sessionId: string) => void;
}

/**
 * Lorebook Store
 * Persists to localStorage
 */
export const useLorebookStore = create<LorebookStoreState>()(
  persist(
    (set, get) => ({
      entries: [],
      rejectedEntries: [],

      // === Existing Entries ===

      addEntry: (entry: LorebookEntryData) => {
        set((state) => ({
          entries: [...state.entries, entry],
        }));
      },

      getEntriesByCharacter: (characterId: string, sessionId: string) => {
        return get().entries.filter(
          (e) => e.characterId === characterId && e.sessionId === sessionId
        );
      },

      getEntriesBySession: (sessionId: string) => {
        return get().entries.filter((e) => e.sessionId === sessionId);
      },

      updateEntry: (entryId: string, updates: Partial<LorebookEntryData>) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? { ...e, ...updates, lastUpdatedAt: Date.now() }
              : e
          ),
        }));
      },

      removeEntry: (entryId: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        }));
      },

      // === Rejected Entries ===

      addRejectedEntry: (entry: RejectedLorebookEntry) => {
        set((state) => ({
          rejectedEntries: [...state.rejectedEntries, entry],
        }));
      },

      getRejectedEntriesByCharacter: (characterId: string, sessionId: string) => {
        return get().rejectedEntries.filter(
          (e) => e.characterId === characterId && e.sessionId === sessionId
        );
      },

      getRejectedEntriesBySession: (sessionId: string) => {
        return get().rejectedEntries.filter((e) => e.sessionId === sessionId);
      },

      removeRejectedEntry: (entryId: string) => {
        set((state) => ({
          rejectedEntries: state.rejectedEntries.filter((e) => e.id !== entryId),
        }));
      },

      // === Cleanup ===

      clearSession: (sessionId: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.sessionId !== sessionId),
          rejectedEntries: state.rejectedEntries.filter((e) => e.sessionId !== sessionId),
        }));
      },
    }),
    {
      name: "lorebook-store",
      version: 2, // Increment version since we removed pendingEntries
    }
  )
);
