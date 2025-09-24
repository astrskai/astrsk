import Supermemory from "supermemory";

// Initialize Supermemory client with configuration from environment
export const memoryClient = new Supermemory({
  apiKey: import.meta.env.VITE_SUPERMEMORY_API_KEY,
});

// Export a function to check if the client is configured
export const isMemoryClientConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPERMEMORY_API_KEY;
};
