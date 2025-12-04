"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { UniqueEntityID } from "@/shared/domain";
import { createSelectors } from "@/shared/lib/zustand-utils";

import { LocalPersistStorage } from "@/shared/stores/local-persist-storage";

// TTL for skipped scenario dialogs (24 hours in milliseconds)
const SKIPPED_DIALOG_TTL_MS = 24 * 60 * 60 * 1000;

// Semi-persisted state for tracking skipped scenario dialogs per session
// Values are persisted to localStorage and auto-cleaned after 24 hours
interface SessionUIState {
  // Map of sessionId -> timestamp (when it was skipped)
  skippedScenarioDialogs: Record<string, number>;
  skipScenarioDialog: (sessionId: string) => void;
  hasSkippedScenarioDialog: (sessionId: string) => boolean;
  cleanupExpiredEntries: () => void;
}

const useSessionUIStoreBase = create<SessionUIState>()(
  persist(
    immer((set, get) => ({
      skippedScenarioDialogs: {},
      skipScenarioDialog: (sessionId: string) =>
        set((state) => {
          state.skippedScenarioDialogs[sessionId] = Date.now();
        }),
      hasSkippedScenarioDialog: (sessionId: string) => {
        const entry = get().skippedScenarioDialogs[sessionId];
        if (!entry) return false;
        // Check if entry is still valid (within TTL)
        const isValid = Date.now() - entry < SKIPPED_DIALOG_TTL_MS;
        if (!isValid) {
          // Clean up expired entry
          get().cleanupExpiredEntries();
        }
        return isValid;
      },
      cleanupExpiredEntries: () =>
        set((state) => {
          const now = Date.now();
          const entries = Object.entries(state.skippedScenarioDialogs);
          for (const [sessionId, timestamp] of entries) {
            if (now - timestamp >= SKIPPED_DIALOG_TTL_MS) {
              delete state.skippedScenarioDialogs[sessionId];
            }
          }
        }),
    })),
    {
      name: "session-ui-store",
      storage: new LocalPersistStorage<SessionUIState>(),
      // Only persist the skipped dialogs data
      partialize: (state) =>
        ({
          skippedScenarioDialogs: state.skippedScenarioDialogs,
        }) as SessionUIState,
      // Clean up expired entries on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.cleanupExpiredEntries();
        }
      },
    },
  ),
);

export const useSessionUIStore = createSelectors(useSessionUIStoreBase);

export const RightSidebarDetail = {
  LLM: "llm",
  Display: "display",
} as const;

export type RightSidebarDetail =
  (typeof RightSidebarDetail)[keyof typeof RightSidebarDetail];

export const AutoReply = {
  Off: "off",
  Random: "random",
  Rotate: "rotate",
} as const;

export type AutoReply = (typeof AutoReply)[keyof typeof AutoReply];

// TODO: remove design v1 states
interface SessionState {
  // Session List
  keyword: string;
  setKeyword: (keyword: string) => void;

  // Main - Message View
  selectedSessionId: UniqueEntityID | null;
  selectSession: (sessionId: UniqueEntityID | null, name: string) => void;
  selectedSessionName: string;

  // Right Sidebar - Session Settings
  isOpenRightSidebar: boolean;
  setIsOpenRightSidebar: (isOpen: boolean) => void;
  isOpenRightSidebarDetail: boolean;
  setIsOpenRightSidebarDetail: (isOpen: boolean) => void;
  rightSidebarDetail: RightSidebarDetail | null;
  setRightSidebarDetail: (detail: RightSidebarDetail | null) => void;

  // Create session
  createSessionName: string;
  setCreateSessionName: (name: string) => void;

  // Panel visibility per session (keyed by sessionId)
  settingsPanelOpen: Record<string, boolean>;
  dataPanelOpen: Record<string, boolean>;
  setSettingsPanelOpen: (sessionId: string, open: boolean) => void;
  setDataPanelOpen: (sessionId: string, open: boolean) => void;
}

const useSessionStoreBase = create<SessionState>()(
  persist(
    immer((set) => ({
      // Session List
      keyword: "",
      setKeyword: (keyword) =>
        set((state) => {
          state.keyword = keyword;
        }),

      selectedSessionId: null,
      selectSession: (session, name) =>
        set((state) => {
          state.selectedSessionId = session;
          state.selectedSessionName = name;
        }),
      selectedSessionName: "",

      isOpenRightSidebar: true,
      setIsOpenRightSidebar: (isOpen) =>
        set((state) => {
          state.isOpenRightSidebar = isOpen;
        }),
      isOpenRightSidebarDetail: false,
      setIsOpenRightSidebarDetail: (isOpen) =>
        set((state) => {
          state.isOpenRightSidebarDetail = isOpen;
        }),
      rightSidebarDetail: null,
      setRightSidebarDetail: (detail) =>
        set((state) => {
          state.rightSidebarDetail = detail;
        }),

      createSessionName: "",
      setCreateSessionName: (name) =>
        set((state) => {
          state.createSessionName = name;
        }),

      // Panel visibility per session
      settingsPanelOpen: {},
      dataPanelOpen: {},
      setSettingsPanelOpen: (sessionId: string, open: boolean) =>
        set((state) => {
          state.settingsPanelOpen[sessionId] = open;
        }),
      setDataPanelOpen: (sessionId: string, open: boolean) =>
        set((state) => {
          state.dataPanelOpen[sessionId] = open;
        }),
    })),
    {
      name: "session-store",
      storage: new LocalPersistStorage<SessionState>(),
    },
  ),
);

export const useSessionStore = createSelectors(useSessionStoreBase);
