import { create } from "zustand";
import type { MigrationExecution } from "./migration-log-store";

interface MigrationDetailsDialogState {
  isOpen: boolean;
  migration: MigrationExecution | null;
  open: (migration: MigrationExecution) => void;
  close: () => void;
}

export const useMigrationDetailsDialogStore = create<MigrationDetailsDialogState>(
  (set) => ({
    isOpen: false,
    migration: null,
    open: (migration) => set({ isOpen: true, migration }),
    close: () => set({ isOpen: false, migration: null }),
  }),
);

/**
 * Helper function to show migration details from anywhere
 * Usage: showMigrationDetails(migration)
 */
export function showMigrationDetails(migration: MigrationExecution): void {
  useMigrationDetailsDialogStore.getState().open(migration);
}
