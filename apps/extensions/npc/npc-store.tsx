"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "@astrsk/shared/zustand-utils";
import { LocalPersistStorage } from "@astrsk/shared/storage";

export interface NpcData {
  id: string;                    // Lowercase single-word ID (e.g., "tanaka")
  names: string[];               // All known names/aliases (e.g., ["Tanaka-sensei", "Tanaka"])
  sessionId: string;             // Parent session
  characterCardId?: string;      // UUID of the created CharacterCard
  createdAt: number;             // Timestamp of first detection
  lastSeenAt: number;            // Last mentioned in conversation
}

interface NpcPoolState {
  // sessionId → NpcData[]
  npcPools: Record<string, NpcData[]>;

  // Add new NPC to pool
  addNpc: (npc: NpcData) => void;

  // Update existing NPC
  updateNpc: (npcId: string, sessionId: string, updates: Partial<NpcData>) => void;

  // Get pool for session
  getNpcPool: (sessionId: string) => NpcData[];

  // Get specific NPC by ID
  getNpcById: (npcId: string, sessionId: string) => NpcData | undefined;

  // Get NPC by character card ID
  getNpcByCardId: (cardId: string, sessionId: string) => NpcData | undefined;

  // Get specific NPC by any name alias
  getNpcByName: (sessionId: string, name: string) => NpcData | undefined;

  // Clear session pool
  clearSession: (sessionId: string) => void;

  // Clear all pools
  clearAll: () => void;
}

const useNpcStoreBase = create<NpcPoolState>()(
  persist(
    immer((set, get) => ({
      npcPools: {},

      addNpc: (npc) =>
        set((state) => {
          if (!state.npcPools[npc.sessionId]) {
            state.npcPools[npc.sessionId] = [];
          }
          state.npcPools[npc.sessionId].push(npc);
        }),

      updateNpc: (npcId, sessionId, updates) =>
        set((state) => {
          const pool = state.npcPools[sessionId];
          if (!pool) return;

          const npc = pool.find((n) => n.id === npcId);
          if (npc) {
            Object.assign(npc, updates);
          }
        }),

      getNpcPool: (sessionId) => {
        return get().npcPools[sessionId] || [];
      },

      getNpcById: (npcId, sessionId) => {
        const pool = get().npcPools[sessionId] || [];
        return pool.find((npc) => npc.id === npcId);
      },

      getNpcByCardId: (cardId, sessionId) => {
        const pool = get().npcPools[sessionId] || [];
        return pool.find((npc) => npc.characterCardId === cardId);
      },

      getNpcByName: (sessionId, name) => {
        const pool = get().npcPools[sessionId] || [];
        return pool.find((npc) =>
          npc.names.some((alias) => alias.toLowerCase() === name.toLowerCase()),
        );
      },

      clearSession: (sessionId) =>
        set((state) => {
          delete state.npcPools[sessionId];
        }),

      clearAll: () =>
        set((state) => {
          state.npcPools = {};
        }),
    })),
    {
      name: "npc-store",
      storage: new LocalPersistStorage<NpcPoolState>(),
    },
  ),
);

export const useNpcStore = createSelectors(useNpcStoreBase);
