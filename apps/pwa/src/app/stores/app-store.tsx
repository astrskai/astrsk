import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";

import { LocalPersistStorage } from "@/app/stores/local-persist-storage";
import { CardType } from "@/modules/card/domain";

export const Menu = {
  Play: "Sessions",
  Card: "Cards",
  Flow: "Flow & Agents",
  Prompt: "Prompt",
  Model: "Providers",
  Settings: "Settings",
  DataManagement: "DataManagement",
  Title: "Title",
} as const;

export type Menu = (typeof Menu)[keyof typeof Menu];

export const Page = {
  Init: "init",
  Sessions: "sessions",
  Cards: "cards",
  CardsCreate: "cards_create",
  CardsCreatePlot: "cards_create_plot",
  CardsCreateCharacter: "cards_create_character",
  Prompt: "prompt",
  PromptDetail: "prompt_detail",
  PromptBlockDetail: "prompt_block_detail",
  Connections: "connections",
  Settings: "settings",
  Title: "title", // TODO: remove title pages
  Flow: "flow",
  Agents: "agents", // New agents page
  CreateSession: "create_session",
  CreateTitle: "create_title", // TODO: remove title pages
  CreatePrompt: "create_prompt",
  CreateResponseDesign: "create_response_design",
  CardPanel: "card_panel", // Card detail panel view
  Subscribe: "subscribe",
  AddCredits: "add_credits",
} as const;

export type Page = (typeof Page)[keyof typeof Page];

export const SettingPageLevel = {
  main: "main",
  sub: "sub",
  detail: "detail",
} as const;

export type SettingPageLevel =
  (typeof SettingPageLevel)[keyof typeof SettingPageLevel];

export const SettingSubPageType = {
  providers: "providers",
  legal: "legal",
  advanced: "advanced",
  account: "account",
} as const;

export type SettingSubPageType =
  (typeof SettingSubPageType)[keyof typeof SettingSubPageType];

export const LegalPageType = {
  refundPolicy: "refundPolicy",
  privacyPolicy: "privacyPolicy",
  termOfService: "termOfService",
  contentPolicy: "contentPolicy",
  ossNotice: "ossNotice",
} as const;

export type LegalPageType = (typeof LegalPageType)[keyof typeof LegalPageType];

interface AppState {
  // Default
  isDefaultInitialized: boolean;
  setIsDefaultInitialized: (isDefaultInitialized: boolean) => void;

  // Menu
  activeMenu: Menu;
  setActiveMenu: (activeMenu: Menu) => void;
  blockedMenu: Menu | null;
  setBlockedMenu: (blockedMenu: Menu | null) => void;

  // Page
  activePage: Page;
  setActivePage: (activePage: Page) => void;

  // Onboarding
  isPassedOnboarding: boolean;
  setIsPassedOnboarding: (isPassedOnboarding: boolean) => void;

  // Auth
  userId: string | null;
  setUserId: (userId: string | null) => void;

  // Sync
  isSyncEnabled: boolean;
  setIsSyncEnabled: (isSyncEnabled: boolean) => void;
  isSyncReady: boolean;
  setIsSyncReady: (isSyncReady: boolean) => void;
  lastLocalUpdated: string | null;
  lastRemoteUpdated: string | null;
  lastSyncedAt: Date | null;

  // New states
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;
  isPassphraseOpen: boolean;
  setIsPassphraseOpen: (isOpen: boolean) => void;
  passphraseMode: "create" | "enter";
  setPassphraseMode: (mode: "create" | "enter") => void;
  isSyncSourceOpen: boolean;
  setIsSyncSourceOpen: (isOpen: boolean) => void;

  // Data Management
  isDataManagementOpen: boolean;
  setIsDataManagementOpen: (isOpen: boolean) => void;

  // Card Import Don't Show Again
  isCardImportDonNotShowAgain: boolean;
  setIsCardImportDonNotShowAgain: (isDonNotShowAgain: boolean) => void;

  // Group Button Don't Show Again
  isGroupButtonDonNotShowAgain: boolean;
  setIsGroupButtonDonNotShowAgain: (isDonNotShowAgain: boolean) => void;

  // Telemetry
  isTelemetryEnabled: boolean;
  setIsTelemetryEnabled: (isTelemetryEnabled: boolean) => void;

  // Settings
  settingPageLevel: SettingPageLevel;
  setSettingPageLevel: (settingPageLevel: SettingPageLevel) => void;
  settingSubPage: SettingSubPageType;
  setSettingSubPage: (settingSubPage: SettingSubPageType) => void;
  settingDetailPage: LegalPageType;
  setSettingDetailPage: (settingDetailPage: LegalPageType) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // CardEditOpen
  cardEditOpen: CardType | null;
  setCardEditOpen: (cardEditOpen: CardType | null) => void;

  // Sidebar
  isFirstTimeSidebarOpen: boolean;
  setIsFirstTimeSidebarOpen: (isFirstTimeSidebarOpen: boolean) => void;

  // Mobile
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;

  // Card Panel
  selectedCardId: string | null;
  setSelectedCardId: (cardId: string | null) => void;
}

const lastPagePerMenu = new Map<Menu, Page>([
  [Menu.Play, Page.Sessions],
  [Menu.Card, Page.Cards],
  [Menu.Flow, Page.Flow],
  [Menu.Model, Page.Connections],
  [Menu.Settings, Page.Settings],
  [Menu.Title, Page.Title],
]);

const useAppStoreBase = create<AppState>()(
  persist(
    immer((set) => ({
      // Default
      isDefaultInitialized: false,
      setIsDefaultInitialized: (isDefaultInitialized) =>
        set((state) => {
          state.isDefaultInitialized = isDefaultInitialized;
        }),

      activeMenu: Menu.Play,
      setActiveMenu: (activeMenu) =>
        set((state) => {
          state.activeMenu = activeMenu;
          state.activePage = lastPagePerMenu.get(activeMenu) ?? Page.Sessions;
          state.blockedMenu = null;
        }),
      blockedMenu: null,
      setBlockedMenu: (blockedMenu) =>
        set((state) => {
          state.blockedMenu = blockedMenu;
        }),

      activePage: Page.Init,
      setActivePage: (activePage) =>
        set((state) => {
          switch (activePage) {
            case Page.Sessions:
            case Page.CreateSession:
              state.activeMenu = Menu.Play;
              break;
            case Page.Cards:
            case Page.CardsCreate:
            case Page.CardPanel:
              state.activeMenu = Menu.Card;
              break;
            case Page.Flow:
              state.activeMenu = Menu.Flow;
              break;
            case Page.Agents:
              state.activeMenu = Menu.Flow;
              break;
            case Page.Connections:
              state.activeMenu = Menu.Model;
              break;
            case Page.Settings:
              state.activeMenu = Menu.Settings;
              // Reset to main settings page when navigating to settings
              state.settingPageLevel = SettingPageLevel.main;
              break;
          }
          state.activePage = activePage;
          lastPagePerMenu.set(state.activeMenu, activePage);
        }),

      // Onboarding
      isPassedOnboarding: false,
      setIsPassedOnboarding: (isPassedOnboarding) =>
        set((state) => {
          state.isPassedOnboarding = isPassedOnboarding;
        }),

      // Auth
      userId: null,
      setUserId: (userId) =>
        set((state) => {
          state.userId = userId;
        }),

      // Sync status
      isSyncEnabled: true,
      setIsSyncEnabled: (isSyncEnabled) =>
        set((state) => {
          state.isSyncEnabled = isSyncEnabled;
        }),
      isSyncReady: false,
      setIsSyncReady: (isSyncReady) =>
        set((state) => {
          state.isSyncReady = isSyncReady;
        }),
      lastLocalUpdated: null,
      lastRemoteUpdated: null,
      lastSyncedAt: null,

      // New states
      isLoginOpen: false,
      setIsLoginOpen: (isOpen) =>
        set((state) => {
          state.isLoginOpen = isOpen;
        }),
      isPassphraseOpen: false,
      setIsPassphraseOpen: (isOpen) =>
        set((state) => {
          state.isPassphraseOpen = isOpen;
        }),
      passphraseMode: "create",
      setPassphraseMode: (mode) =>
        set((state) => {
          state.passphraseMode = mode;
        }),
      isSyncSourceOpen: false,
      setIsSyncSourceOpen: (isOpen) =>
        set((state) => {
          state.isSyncSourceOpen = isOpen;
        }),

      // Data Management
      isDataManagementOpen: false,
      setIsDataManagementOpen: (isOpen) =>
        set((state) => {
          state.isDataManagementOpen = isOpen;
        }),

      // Card Import Don't Show Again
      isCardImportDonNotShowAgain: false,
      setIsCardImportDonNotShowAgain: (isDonNotShowAgain) =>
        set((state) => {
          state.isCardImportDonNotShowAgain = isDonNotShowAgain;
        }),

      // Group Button Don't Show Again
      isGroupButtonDonNotShowAgain: false,
      setIsGroupButtonDonNotShowAgain: (isDonNotShowAgain) =>
        set((state) => {
          state.isGroupButtonDonNotShowAgain = isDonNotShowAgain;
        }),

      // Telemetry
      isTelemetryEnabled: false,
      setIsTelemetryEnabled: (isTelemetryEnabled) =>
        set((state) => {
          state.isTelemetryEnabled = isTelemetryEnabled;
        }),

      // Settings
      settingPageLevel: SettingPageLevel.main,
      setSettingPageLevel: (settingPageLevel) =>
        set((state) => {
          state.settingPageLevel = settingPageLevel;
        }),
      settingSubPage: SettingSubPageType.providers,
      setSettingSubPage: (settingSubPage) =>
        set((state) => {
          state.settingSubPage = settingSubPage;
        }),
      settingDetailPage: LegalPageType.privacyPolicy,
      setSettingDetailPage: (settingDetailPage) =>
        set((state) => {
          state.settingDetailPage = settingDetailPage;
        }),

      // Loading
      isLoading: true,
      setIsLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      // CardEditOpen
      cardEditOpen: null,
      setCardEditOpen: (cardEditOpen) =>
        set((state) => {
          state.cardEditOpen = cardEditOpen;
        }),

      isFirstTimeSidebarOpen: false,
      setIsFirstTimeSidebarOpen: (isFirstTimeSidebarOpen) =>
        set((state) => {
          state.isFirstTimeSidebarOpen = isFirstTimeSidebarOpen;
        }),

      // Mobile
      isMobile: false,
      setIsMobile: (isMobile) =>
        set((state) => {
          state.isMobile = isMobile;
        }),

      // Card Panel
      selectedCardId: null,
      setSelectedCardId: (cardId) =>
        set((state) => {
          state.selectedCardId = cardId;
        }),
    })),
    {
      name: "app-store",
      storage: new LocalPersistStorage<AppState>(),
      // Do not persist these states
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              ![
                "userId",
                "activeSubscription",
                "isSyncReady",
                "isLoginOpen",
                "isPassphraseOpen",
                "passphraseMode",
                "isSyncSourceOpen",
                "isMobile",
              ].includes(key),
          ),
        ) as AppState,
    },
  ),
);

export const useAppStore = createSelectors(useAppStoreBase);
