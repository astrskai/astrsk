import { createContext, useContext } from "react";

// Mobile navigation context
export const MobileNavigationContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const useMobileNavigation = () => {
  const context = useContext(MobileNavigationContext);
  if (!context) {
    throw new Error(
      "useMobileNavigation must be used within MobileNavigationProvider",
    );
  }
  return context;
};
