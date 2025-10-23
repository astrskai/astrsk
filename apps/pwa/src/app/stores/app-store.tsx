import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/lib/zustand-utils";

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
  SignUp: "sign_up",
  Payment: "payment",
  OnboardingStepOne: "onboarding_step_one",
  OnboardingStepTwo: "onboarding_step_two",
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

export const SettingDetailPageType = {
  // Legal
  refundPolicy: "refundPolicy",
  privacyPolicy: "privacyPolicy",
  termOfService: "termOfService",
  contentPolicy: "contentPolicy",
  ossNotice: "ossNotice",

  // Payment
  creditUsage: "creditUsage",
} as const;

export type SettingDetailPageType =
  (typeof SettingDetailPageType)[keyof typeof SettingDetailPageType];

// Polling context for image/video generation
export interface PollingContext {
  taskId: string;
  generationType: "image" | "video";
  prompt: string;
  userPrompt?: string;
  cardId?: string;
  startedAt: number;
  style?: string;
  aspectRatio?: string;
  videoDuration?: number;
  inputImageFile?: File;
  isSessionGenerated?: boolean;
}

interface AppState {
  // PWA (service worker)
  isOfflineReady: boolean;
  setIsOfflineReady: (isOfflineReady: boolean) => void;
  isUpdateReadyPWA: boolean;
  setIsUpdateReadyPWA: (isUpdateReadyPWA: boolean) => void;
  updateServiceWorker:
    | ((reloadPage?: boolean | undefined) => Promise<void>)
    | null;
  setUpdateServiceWorker: (
    fn: (reloadPage?: boolean | undefined) => Promise<void>,
  ) => void;

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
  returnPage: Page;
  backToReturnPage: () => void;

  // Onboarding (legacy - for existing users)
  isPassedOnboarding: boolean;
  setIsPassedOnboarding: (isPassedOnboarding: boolean) => void;

  // Onboarding selected session
  onboardingSelectedSessionId: string | null;
  setOnboardingSelectedSessionId: (sessionId: string | null) => void;

  // Session Onboarding Steps (complete onboarding flow)
  sessionOnboardingSteps: {
    genreSelection: boolean; // Initial genre selection dialog
    inferenceButton: boolean; // Guide for using the inference button
    sessionEdit: boolean; // Guide for editing session
    openResource: boolean; // Guide for opening resources
    resourceManagement: boolean; // Guide for managing resources
    helpVideo: boolean; // Guide for help video
    sessionData: boolean; // Guide for session data
  };
  setSessionOnboardingStep: (
    step:
      | "genreSelection"
      | "inferenceButton"
      | "sessionEdit"
      | "openResource"
      | "resourceManagement"
      | "helpVideo"
      | "sessionData",
    completed: boolean,
  ) => void;

  // Auth
  jwt: string | null;
  setJwt: (jwt: string | null) => void;
  subscribed: boolean;
  setSubscribed: (subscribed: boolean) => void;
  isOpenSubscribeNudge: boolean;
  setIsOpenSubscribeNudge: (open: boolean) => void;

  // Data Management
  isDataManagementOpen: boolean;
  setIsDataManagementOpen: (isOpen: boolean) => void;

  // Card Import Don't Show Again
  isCardImportDonNotShowAgain: boolean;
  setIsCardImportDonNotShowAgain: (isDonNotShowAgain: boolean) => void;

  // Group Button Don't Show Again
  isGroupButtonDonNotShowAgain: boolean;
  setIsGroupButtonDonNotShowAgain: (isDonNotShowAgain: boolean) => void;

  // Settings
  settingPageLevel: SettingPageLevel;
  setSettingPageLevel: (settingPageLevel: SettingPageLevel) => void;
  settingSubPage: SettingSubPageType;
  setSettingSubPage: (settingSubPage: SettingSubPageType) => void;
  settingDetailPage: SettingDetailPageType;
  setSettingDetailPage: (settingDetailPage: SettingDetailPageType) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // Image Generation Loading State
  generatingImageId: string | null; // Stores the ID of the currently generating image
  setGeneratingImageId: (id: string | null) => void;

  // Polling context for active generation
  generatingContext: PollingContext | null;
  setGeneratingContext: (context: PollingContext | null) => void;

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
    immer((set, get) => ({
      // PWA (service worker)
      isOfflineReady: false,
      setIsOfflineReady: (isOfflineReady) =>
        set((state) => {
          state.isOfflineReady = isOfflineReady;
        }),
      isUpdateReadyPWA: false,
      setIsUpdateReadyPWA: (isUpdateReadyPWA) =>
        set((state) => {
          state.isUpdateReadyPWA = isUpdateReadyPWA;
        }),
      updateServiceWorker: null,
      setUpdateServiceWorker: (fn) =>
        set((state) => {
          state.updateServiceWorker = fn;
        }),

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

      activePage: Page.OnboardingStepOne, // Will be updated by initialization logic
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
            case Page.Subscribe:
              if (
                state.activePage === Page.OnboardingStepTwo ||
                state.activePage === Page.OnboardingStepOne
              ) {
                break;
              }
              state.returnPage = state.activePage;
              break;
          }
          state.activePage = activePage;
          lastPagePerMenu.set(state.activeMenu, activePage);
        }),
      returnPage: Page.Init,
      backToReturnPage: () => {
        const returnPage = get().returnPage;
        get().setActivePage(returnPage);
      },

      // Onboarding (legacy - for existing users)
      isPassedOnboarding: false,
      setIsPassedOnboarding: (isPassedOnboarding) =>
        set((state) => {
          state.isPassedOnboarding = isPassedOnboarding;
        }),

      // Onboarding selected session
      onboardingSelectedSessionId: null,
      setOnboardingSelectedSessionId: (sessionId) =>
        set((state) => {
          state.onboardingSelectedSessionId = sessionId;
        }),

      // Session Onboarding Steps
      sessionOnboardingSteps: {
        genreSelection: false,
        inferenceButton: false,
        sessionEdit: true,
        openResource: true,
        resourceManagement: true,
        helpVideo: true,
        sessionData: true,
      },
      setSessionOnboardingStep: (step, completed) =>
        set((state) => {
          state.sessionOnboardingSteps[step] = completed;

          // Check if all onboarding steps are completed
          const allStepsCompleted = Object.entries(state.sessionOnboardingSteps)
            .filter(([key]) => key !== "genreSelection") // Exclude genre selection from completion check
            .every(([, value]) => value === true);

          // If all steps completed, mark legacy onboarding as passed
          if (
            allStepsCompleted &&
            state.sessionOnboardingSteps.genreSelection
          ) {
            state.isPassedOnboarding = true;
            state.onboardingSelectedSessionId = null;
          }
        }),

      // Auth
      jwt: null,
      setJwt: (jwt) =>
        set((state) => {
          state.jwt = jwt;
        }),
      subscribed: false,
      setSubscribed: (subscribed) =>
        set((state) => {
          state.subscribed = subscribed;
        }),
      isOpenSubscribeNudge: false,
      setIsOpenSubscribeNudge: (open) =>
        set((state) => {
          state.isOpenSubscribeNudge = open;
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
      settingDetailPage: SettingDetailPageType.privacyPolicy,
      setSettingDetailPage: (settingDetailPage) =>
        set((state) => {
          state.settingDetailPage = settingDetailPage;
        }),

      // Loading
      isLoading: false,
      setIsLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      // Image Generation Loading State
      generatingImageId: null,
      setGeneratingImageId: (id) =>
        set((state) => {
          state.generatingImageId = id;
        }),

      // Polling context for active generation
      generatingContext: null,
      setGeneratingContext: (context) =>
        set((state) => {
          state.generatingContext = context;
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
      onRehydrateStorage: () => (state) => {
        if (state && state.isPassedOnboarding === true) {
          // For existing users who already passed onboarding, mark all steps as completed
          state.sessionOnboardingSteps = {
            genreSelection: true,
            inferenceButton: true,
            sessionEdit: true,
            openResource: true,
            resourceManagement: true,
            helpVideo: true,
            sessionData: true,
          };
        }
      },
      // version: 2, // Increment version to trigger migration
      // migrate: (persistedState: any, version: number) => {
      //   if (version === 0 || version === 1) {
      //     // For existing users who have passed onboarding,
      //     // automatically set new onboarding states to completed
      //     if (persistedState.isPassedOnboarding === true) {
      //       persistedState.onboardingStep = OnboardingStep.Completed;
      //       persistedState.onboardingSelectedSessionId = null;
      //       // Mark all session onboarding steps as completed for existing users
      //       persistedState.sessionOnboardingSteps = {
      //         inferenceButton: true,
      //         sessionEdit: true,
      //         openResource: true,
      //         resourceManagement: true,
      //         helpVideo: true,
      //         sessionData: true,
      //       };
      //     }
      //   }
      //   return persistedState;
      // },
      // Do not persist these states
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              ![
                "isOfflineReady",
                "isUpdateReadyPWA",
                "updateServiceWorker",
                "jwt",
                "subscribed",
                "isLoading",
                "isMobile",
                "generatingImageId", // Don't persist this state
                "generatingContext", // Don't persist polling context (contains File objects)
              ].includes(key),
          ),
        ) as AppState,
    },
  ),
);

export const useAppStore = createSelectors(useAppStoreBase);
