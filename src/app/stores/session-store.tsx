"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { UniqueEntityID } from "@/shared/domain";
import { createSelectors } from "@/shared/utils/zustand-utils";

import { LocalPersistStorage } from "@/app/stores/local-persist-storage";

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
    })),
    {
      name: "session-store",
      storage: new LocalPersistStorage<SessionState>(),
    },
  ),
);

export const useSessionStore = createSelectors(useSessionStoreBase);
