import { useState, useEffect } from 'react';
import { getBlockedTurns } from '../bootstrap';

/**
 * React hook to check if turns are blocked by extensions
 * Polls every 100ms to keep UI in sync with extension state
 *
 * @returns Object with:
 *   - blockedTurns: Array of currently blocked turn IDs
 *   - isTurnBlocked: Function to check if a specific turn is blocked
 */
export function useBlockedTurns() {
  const [blockedTurns, setBlockedTurns] = useState<string[]>([]);

  useEffect(() => {
    // Poll blocked turns every 100ms
    const interval = setInterval(() => {
      const blocked = getBlockedTurns();
      setBlockedTurns(blocked);
    }, 100);

    // Initial fetch
    setBlockedTurns(getBlockedTurns());

    return () => clearInterval(interval);
  }, []);

  const isTurnBlocked = (turnId: string): boolean => {
    return blockedTurns.includes(turnId);
  };

  return {
    blockedTurns,
    isTurnBlocked,
  };
}
