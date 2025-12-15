import { create } from "zustand";
import { createSelectors } from "@/shared/lib/zustand-utils";

interface MobileNavigationState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const useMobileNavigationStoreBase = create<MobileNavigationState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));

export const useMobileNavigationStore = createSelectors(useMobileNavigationStoreBase);
