import { useEffect } from "react";

interface UseBackGestureOptions {
  enabled?: boolean;
  onBack?: () => void;
}

/**
 * Hook to handle Android back gesture for mobile navigation
 * Adds a history entry and listens for popstate events to trigger onBack
 */
export function useBackGesture({
  enabled = true,
  onBack,
}: UseBackGestureOptions) {
  useEffect(() => {
    if (!enabled || !onBack) return;

    // Add a history entry to catch back gesture
    const historyKey = `back-gesture-${Date.now()}`;
    window.history.pushState({ backGesture: true, key: historyKey }, "");

    const handlePopState = (event: PopStateEvent) => {
      // Check if this was our back gesture entry
      if (event.state?.backGesture && event.state?.key === historyKey) {
        onBack();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Remove the history entry if still present
      if (
        window.history.state?.backGesture &&
        window.history.state?.key === historyKey
      ) {
        window.history.back();
      }
    };
  }, [enabled, onBack]);
}
