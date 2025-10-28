/**
 * Dialog Manager for Extensions
 *
 * Allows extensions to show dialogs and get user responses
 */

import { create } from "zustand";

export interface DialogButton {
  label: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  value: string;
}

export interface DialogConfig {
  title: string;
  description?: string;
  content: React.ReactNode;
  buttons: DialogButton[];
  maxWidth?: string;
}

interface DialogState {
  isOpen: boolean;
  config: DialogConfig | null;
  resolve: ((value: string) => void) | null;
}

interface DialogStore extends DialogState {
  showDialog: (config: DialogConfig) => Promise<string>;
  closeDialog: (value?: string) => void;
}

/**
 * Global dialog store for extension-triggered dialogs
 */
export const useExtensionDialogStore = create<DialogStore>((set, get) => ({
  isOpen: false,
  config: null,
  resolve: null,

  showDialog: (config: DialogConfig) => {
    return new Promise<string>((resolve) => {
      set({
        isOpen: true,
        config,
        resolve,
      });
    });
  },

  closeDialog: (value?: string) => {
    const { resolve } = get();
    if (resolve && value) {
      resolve(value);
    }
    set({
      isOpen: false,
      config: null,
      resolve: null,
    });
  },
}));

/**
 * Show a dialog from extension code
 * Returns a promise that resolves to the selected button's value
 */
export async function showExtensionDialog(config: DialogConfig): Promise<string> {
  return useExtensionDialogStore.getState().showDialog(config);
}
