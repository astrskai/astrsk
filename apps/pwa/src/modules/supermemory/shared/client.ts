import Supermemory from "supermemory";

// Determine base URL: use proxy in development, direct API in production
const getSupermemoryBaseUrl = () => {
  // In development, use Vite proxy to avoid CORS
  // Use full URL with current origin to make URL constructor happy
  // Guard window access for SSR/Vitest/Node environments
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/api/supermemory`;
  }
  // In production, use configured base URL or default
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
