/**
 * Convex client configuration for connecting to vibe backend
 */

import { ConvexReactClient } from 'convex/react';

// Get the vibe backend URL from environment variables
// Use VITE_CONVEX_URL since we're connecting to the same Convex deployment
const VIBE_BACKEND_URL = import.meta.env.VITE_CONVEX_URL;

if (!VIBE_BACKEND_URL) {
  console.warn('VITE_CONVEX_URL not set - vibe coding will not work');
}

// Create Convex client instance for vibe backend
export const vibeConvexClient = new ConvexReactClient(
  VIBE_BACKEND_URL || 'http://127.0.0.1:3210'
);

// Re-export for convenience
export { vibeConvexClient as convexClient };