import { useEffect } from "react";
import { useScrollContainer } from "@/shared/contexts/scroll-container-context";

/**
 * Hook to automatically scroll to top when dependencies change
 * @param deps - Dependencies array (e.g., [routeId, pageId])
 *
 * @example
 * ```tsx
 * // Scroll to top when character changes
 * useScrollToTop([characterId]);
 *
 * // Scroll to top on mount only
 * useScrollToTop([]);
 * ```
 */
export function useScrollToTop(deps: React.DependencyList = []) {
  const { scrollToTop } = useScrollContainer();

  useEffect(() => {
    scrollToTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
