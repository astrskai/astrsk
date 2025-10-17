import Supermemory from "supermemory";

// Determine base URL: use proxy in both development and production to avoid CORS
const getSupermemoryBaseUrl = () => {
  // Always use proxy (Vite in dev, Vercel serverless in production) to avoid CORS
  // Use full URL with current origin to make URL constructor happy
  // Guard window access for SSR/Vitest/Node environments
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/supermemory`;
  }
  // Fallback for SSR/Node environments (shouldn't normally be hit in browser)
  return import.meta.env.VITE_SUPERMEMORY_BASE_URL || "https://api.supermemory.ai";
};

// Initialize Supermemory client with configuration from environment
export const memoryClient = new Supermemory({
  apiKey: import.meta.env.VITE_SUPERMEMORY_API_KEY,
  baseURL: getSupermemoryBaseUrl(),
});

// Export a function to check if the client is configured
export const isMemoryClientConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPERMEMORY_API_KEY;
};
