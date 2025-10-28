// Simplified Supermemory client using direct API endpoints

// v4 search uses singular containerTag
type SearchParamsV4 = {
  q: string;
  containerTag: string;
  limit?: number;
  rewriteQuery?: boolean;
};

// v3 search uses plural containerTags (array)
type SearchParamsV3 = {
  q: string;
  containerTags: string[];
  limit?: number;
};

type AddParams = {
  containerTag: string;
  content: string;
  metadata?: Record<string, any>;
  customId?: string; // For idempotent upserts
};

type UpdateParams = {
  content?: string;
  metadata?: Record<string, any>;
};

type BulkDeleteParams = {
  ids?: string[];
  containerTags?: string[];
};

// Memory client with simplified API endpoints
export const memoryClient = {
  search: {
    // v4 memory search (with knowledge graph processing)
    memories: async (params: SearchParamsV4) => {
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

    // v3 document search (raw documents, no knowledge graph)
    documents: async (params: SearchParamsV3) => {
      const response = await fetch('/api/search/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Document search failed: ${response.status} ${JSON.stringify(error)}`);
      }

      return response.json();
    },
  },
  memories: {
    add: async (params: AddParams) => {
      console.log("📤 [Supermemory Client] POST /api/documents", params);

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log("📥 [Supermemory Client] POST response status:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("❌ [Supermemory Client] POST failed:", response.status, error);
        throw new Error(`Add failed: ${response.status} ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log("📥 [Supermemory Client] POST response body:", data);

      return data;
    },

    get: async (memoryId: string) => {
      const response = await fetch(`/api/documents?id=${encodeURIComponent(memoryId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Get failed: ${response.status} ${JSON.stringify(error)}`);
      }

      return response.json();
    },

    update: async (memoryId: string, params: UpdateParams) => {
      console.log(`📝 [Supermemory Client] PATCH /api/documents?id=${memoryId}`, {
        contentLength: params.content?.length || 0,
        metadata: params.metadata,
      });

      const response = await fetch(`/api/documents?id=${encodeURIComponent(memoryId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log("📝 [Supermemory Client] PATCH response status:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ [Supermemory Client] PATCH failed for ${memoryId}:`, response.status, error);
        throw new Error(`Update failed: ${response.status} ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log("📝 [Supermemory Client] PATCH response body:", data);

      return data;
    },

    delete: async (memoryId: string) => {
      const response = await fetch(`/api/documents?id=${encodeURIComponent(memoryId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Delete failed: ${response.status} ${JSON.stringify(error)}`);
      }

      // Delete returns 204 No Content on success
      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    },

    bulkDelete: async (params: BulkDeleteParams) => {
      const response = await fetch('/api/documents?bulk=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Bulk delete failed: ${response.status} ${JSON.stringify(error)}`);
      }

      return response.json();
    },
  },
};

// Export a function to check if the client is configured
export const isMemoryClientConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPERMEMORY_API_KEY;
};
