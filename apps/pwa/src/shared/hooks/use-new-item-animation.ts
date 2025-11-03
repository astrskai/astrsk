import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for managing "newly created" item animation
 * Triggers animation when a new item ID is provided, auto-clears after duration
 *
 * @param duration - Animation duration in milliseconds (default: 2500ms)
 * @returns Object with animatingId state and trigger function
 *
 * @example
 * ```tsx
 * const { animatingId, triggerAnimation } = useNewItemAnimation();
 *
 * // Trigger animation for a new item
 * triggerAnimation(newItemId);
 *
 * // Check if item should animate
 * <Item isNewlyCreated={animatingId === item.id} />
 * ```
 */
export function useNewItemAnimation(duration = 2500) {
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const triggerAnimation = useCallback(
    (itemId: string) => {
      setAnimatingId(itemId);

      // Clear previous timer if exists
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Clear animation after duration
      timerRef.current = setTimeout(() => {
        setAnimatingId(null);
      }, duration);
    },
    [duration],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    animatingId,
    triggerAnimation,
  };
}
