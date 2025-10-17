// Simplified Supermemory client using direct API endpoints

type SearchParams = {
  q: string;
  containerTag: string;
  limit?: number;
};

type AddParams = {
  containerTag: string;
  content: string;
  metadata?: Record<string, any>;
};

// Memory client with simplified API endpoints
export const memoryClient = {
  search: {
    memories: async (params: SearchParams) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Search failed: ${response.status} ${JSON.stringify(error)}`);
      }

      return response.json();
    },
  },
  memories: {
    add: async (params: AddParams) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Add failed: ${response.status} ${JSON.stringify(error)}`);
      }

      return response.json();
    },
  },
};

// Export a function to check if the client is configured
export const isMemoryClientConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPERMEMORY_API_KEY;
};
