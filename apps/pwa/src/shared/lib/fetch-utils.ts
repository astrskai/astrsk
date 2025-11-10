/**
 * Fetch-related utility functions
 */

/**
 * Generate unique stream ID for tracking streaming requests
 * Used by Electron proxy to manage multiple concurrent streams
 */
export function generateStreamId(): string {
  return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
