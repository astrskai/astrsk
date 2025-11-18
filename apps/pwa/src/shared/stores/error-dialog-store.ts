import { create } from "zustand";

interface ErrorDialogState {
  isOpen: boolean;
  title: string;
  details: string;
  open: (title: string, details: string) => void;
  close: () => void;
}

/**
 * Global error dialog store
 * Use showErrorDetails() to open the dialog from anywhere
 */
export const useErrorDialogStore = create<ErrorDialogState>((set) => ({
  isOpen: false,
  title: "",
  details: "",
  open: (title: string, details: string) =>
    set({ isOpen: true, title, details }),
  close: () => set({ isOpen: false }),
}));

/**
 * Helper function to show error details dialog
 * Can be called from anywhere without managing state
 */
export const showErrorDetails = (title: string, details: string) => {
  useErrorDialogStore.getState().open(title, details);
};
