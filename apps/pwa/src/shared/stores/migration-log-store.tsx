import { create } from "zustand";
import { createSelectors } from "@/shared/lib/zustand-utils";

// Single migration execution detail
export interface MigrationExecution {
  hash: string;
  fileName: string; // e.g., "20251116150136_add_widget_layout_to_sessions.sql"
  duration: number; // milliseconds
  status: "success" | "error";
  error?: string;
  sql?: string[]; // SQL statements executed (for displaying details)
}

// Single migration log entry (one app update or first install)
export interface MigrationLogEntry {
  id: string; // Unique ID for this log entry
  timestamp: string; // ISO string
  totalTime: number; // Total migration time in milliseconds
  executedMigrations: MigrationExecution[];
  hasError: boolean;
}

const STORAGE_KEY = "astrsk:migration-logs";
const MAX_LOGS = 10;

// Helper functions for localStorage
export const saveMigrationLogs = (logs: MigrationLogEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save migration logs:", error);
  }
};

export const loadMigrationLogs = (): MigrationLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as MigrationLogEntry[];
  } catch (error) {
    console.error("Failed to load migration logs:", error);
    return [];
  }
};

export const addMigrationLog = (entry: MigrationLogEntry): void => {
  try {
    const logs = loadMigrationLogs();
    // Add new entry at the beginning
    const updatedLogs = [entry, ...logs];
    // Keep only the latest MAX_LOGS entries
    const trimmedLogs = updatedLogs.slice(0, MAX_LOGS);
    saveMigrationLogs(trimmedLogs);
  } catch (error) {
    console.error("Failed to add migration log:", error);
  }
};

export const clearMigrationLogs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear migration logs:", error);
  }
};

interface MigrationLogState {
  logs: MigrationLogEntry[];
  currentMigrations: MigrationExecution[];
  currentLogId: string | null;
  currentStartTime: number | null;

  // Actions
  loadLogs: () => void;
  startMigrationLog: () => void;
  recordMigration: (
    hash: string,
    fileName: string,
    duration: number,
    status: "success" | "error",
    error?: string,
    sql?: string[],
  ) => void;
  finalizeMigrationLog: () => void;
  clearLogs: () => void;
}

const useMigrationLogStoreBase = create<MigrationLogState>((set, get) => ({
  logs: [],
  currentMigrations: [],
  currentLogId: null,
  currentStartTime: null,

  loadLogs: () => {
    const logs = loadMigrationLogs();
    set({ logs });
  },

  startMigrationLog: () => {
    set({
      currentMigrations: [],
      currentLogId: crypto.randomUUID(),
      currentStartTime: performance.now(),
    });
  },

  recordMigration: (hash, fileName, duration, status, error, sql) => {
    const { currentMigrations } = get();
    const newMigration: MigrationExecution = {
      hash,
      fileName,
      duration,
      status,
      error,
      sql,
    };
    set({
      currentMigrations: [...currentMigrations, newMigration],
    });
  },

  finalizeMigrationLog: () => {
    const { currentMigrations, currentLogId, currentStartTime } = get();

    if (!currentLogId || currentStartTime === null) {
      console.warn("No active migration log to finalize");
      return;
    }

    if (currentMigrations.length === 0) {
      console.warn("No migrations recorded, skipping log save");
      set({
        currentMigrations: [],
        currentLogId: null,
        currentStartTime: null,
      });
      return;
    }

    const totalTime = Math.round(performance.now() - currentStartTime);
    const hasError = currentMigrations.some((m) => m.status === "error");

    const logEntry: MigrationLogEntry = {
      id: currentLogId,
      timestamp: new Date().toISOString(),
      totalTime,
      executedMigrations: currentMigrations,
      hasError,
    };

    addMigrationLog(logEntry);

    // Reset current state and reload logs
    set({
      currentMigrations: [],
      currentLogId: null,
      currentStartTime: null,
    });
    get().loadLogs();
  },

  clearLogs: () => {
    clearMigrationLogs();
    set({ logs: [] });
  },
}));

export const useMigrationLogStore = createSelectors(useMigrationLogStoreBase);
