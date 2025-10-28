import { createContext, useContext } from "react";
import { useIsMobile } from "./use-device-type";

// Context to provide mobile override
const MobileOverrideContext = createContext<boolean | undefined>(undefined);

// Provider component for mobile override
export function MobileOverrideProvider({
  children,
  forceMobile,
}: {
  children: React.ReactNode;
  forceMobile?: boolean;
}) {
  return (
    <MobileOverrideContext.Provider value={forceMobile}>
      {children}
    </MobileOverrideContext.Provider>
  );
}

// Hook to use mobile state with override capability
export function useIsMobileWithOverride() {
  const actualIsMobile = useIsMobile();
  const override = useContext(MobileOverrideContext);

  // If override is defined (true or false), use it; otherwise use actual mobile state
  return override !== undefined ? override : actualIsMobile;
}
