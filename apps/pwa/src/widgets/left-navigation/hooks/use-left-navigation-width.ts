import { useEffect, useState } from "react";
import { useAppStore } from "@/app/stores/app-store";

// Constants matching the sidebar dimensions
const SIDEBAR_WIDTH_EXPANDED = 320; // 20rem
const SIDEBAR_WIDTH_ICON = 48; // 3rem
const SIDEBAR_WIDTH_MOBILE = 0; // Hidden on mobile

export interface LeftNavigationWidth {
  width: number;
  isExpanded: boolean;
  isMobile: boolean;
}

/**
 * Hook to get the current left navigation width based on its state
 * This helps other components adjust their layout accordingly
 */
export function useLeftNavigationWidth(): LeftNavigationWidth {
  const { isMobile } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Check the sidebar state from the cookie
    const checkSidebarState = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sidebar:state="));

      if (cookie) {
        const value = cookie.split("=")[1];
        setIsExpanded(value === "true");
      }
    };

    // Initial check
    checkSidebarState();

    // Listen for changes (when sidebar is toggled)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        // Small delay to let the cookie update
        setTimeout(checkSidebarState, 10);
      }
    };

    // Also check on focus (in case it was changed in another tab)
    const handleFocus = () => checkSidebarState();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("focus", handleFocus);

    // Check periodically for changes (fallback for other toggle methods)
    const interval = setInterval(checkSidebarState, 500);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Calculate the actual width
  const width = isMobile
    ? SIDEBAR_WIDTH_MOBILE
    : isExpanded
      ? SIDEBAR_WIDTH_EXPANDED
      : SIDEBAR_WIDTH_ICON;

  return {
    width,
    isExpanded,
    isMobile,
  };
}
