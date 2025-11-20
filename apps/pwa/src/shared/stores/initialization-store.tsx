import { create } from "zustand";
import { createSelectors } from "@/shared/lib/zustand-utils";

export type InitializationStepStatus = "pending" | "running" | "success" | "warning" | "error";

export interface InitializationStep {
  id: string;
  label: string;
  status: InitializationStepStatus;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// Persisted version with Date fields serialized as ISO strings
export interface PersistedInitializationStep {
  id: string;
  label: string;
  status: InitializationStepStatus;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface InitializationLog {
  timestamp: string;
  totalTime: number;
  hasError: boolean;
  hasWarning: boolean;
  steps: PersistedInitializationStep[];
}

// Step groups for simplified UI
export interface StepGroup {
  id: string;
  label: string;
  stepIds: string[];
}

export const STEP_GROUPS: StepGroup[] = [
  {
    id: "database",
    label: "Database Setup",
    stepIds: [
      "database-engine",
      "database-init",
      "migration-schema",
      "check-migrations",
      "run-migrations",
    ],
  },
  {
    id: "services",
    label: "Services Initialization",
    stepIds: [
      "asset-service",
      "api-service",
      "agent-service",
      "node-services",
      "vibe-service",
      "flow-service",
      "image-service",
      "card-service",
      "session-service",
    ],
  },
  {
    id: "data",
    label: "Data Loading",
    stepIds: [
      "api-connections",
      "free-provider",
      "check-sessions",
      "default-sessions",
      "backgrounds",
    ],
  },
];

const INIT_LOG_STORAGE_KEY = "astrsk-initialization-log";

interface InitializationState {
  steps: InitializationStep[];
  currentStepIndex: number;
  isInitialized: boolean;

  // Actions
  initializeSteps: (steps: Omit<InitializationStep, "status">[]) => void;
  startStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  warnStep: (stepId: string, error: string) => void;
  failStep: (stepId: string, error: string) => void;
  saveLog: (totalTime: number) => void;
  reset: () => void;
}

// Helper functions for localStorage
export const saveInitializationLog = (log: InitializationLog): void => {
  try {
    localStorage.setItem(INIT_LOG_STORAGE_KEY, JSON.stringify(log));
  } catch (error) {
    console.error("Failed to save initialization log:", error);
  }
};

export const loadInitializationLog = (): InitializationLog | null => {
  try {
    const stored = localStorage.getItem(INIT_LOG_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load initialization log:", error);
    return null;
  }
};

export const clearInitializationLog = (): void => {
  try {
    localStorage.removeItem(INIT_LOG_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear initialization log:", error);
  }
};

const useInitializationStoreBase = create<InitializationState>((set) => ({
  steps: [],
  currentStepIndex: 0,
  isInitialized: false,

  initializeSteps: (steps) =>
    set({
      steps: steps.map((step) => ({
        ...step,
        status: "pending" as const,
      })),
      currentStepIndex: 0,
      isInitialized: false,
    }),

  startStep: (stepId) =>
    set((state) => {
      const stepIndex = state.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return state;

      const newSteps = [...state.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status: "running",
        startedAt: new Date(),
      };

      return {
        steps: newSteps,
        currentStepIndex: stepIndex,
      };
    }),

  completeStep: (stepId) =>
    set((state) => {
      const stepIndex = state.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return state;

      const newSteps = [...state.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status: "success",
        completedAt: new Date(),
      };

      const allCompleted = newSteps.every((s) => s.status === "success");

      return {
        steps: newSteps,
        isInitialized: allCompleted,
      };
    }),

  warnStep: (stepId, error) =>
    set((state) => {
      const stepIndex = state.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return state;

      const newSteps = [...state.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status: "warning",
        error,
        completedAt: new Date(),
      };

      return {
        steps: newSteps,
      };
    }),

  failStep: (stepId, error) =>
    set((state) => {
      const stepIndex = state.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return state;

      const newSteps = [...state.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status: "error",
        error,
        completedAt: new Date(),
      };

      return {
        steps: newSteps,
      };
    }),

  saveLog: (totalTime) =>
    set((state) => {
      const hasError = state.steps.some((s) => s.status === "error");
      const hasWarning = state.steps.some((s) => s.status === "warning");

      // Convert Date fields to ISO strings for persistence
      const persistedSteps: PersistedInitializationStep[] = state.steps.map((step) => ({
        ...step,
        startedAt: step.startedAt?.toISOString(),
        completedAt: step.completedAt?.toISOString(),
      }));

      const log: InitializationLog = {
        timestamp: new Date().toISOString(),
        totalTime,
        hasError,
        hasWarning,
        steps: persistedSteps,
      };
      saveInitializationLog(log);
      return state;
    }),

  reset: () =>
    set({
      steps: [],
      currentStepIndex: 0,
      isInitialized: false,
    }),
}));

export const useInitializationStore = createSelectors(
  useInitializationStoreBase,
);
