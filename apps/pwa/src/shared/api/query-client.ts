import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Create IndexedDB persister
const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      return new Promise((resolve) => {
        const request = indexedDB.open("astrsk-query-cache", 1);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("cache")) {
            db.createObjectStore("cache");
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["cache"], "readonly");
          const store = transaction.objectStore("cache");
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };

          getRequest.onerror = () => {
            resolve(null);
          };
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    },
    setItem: (key: string, value: string) => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open("astrsk-query-cache", 1);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("cache")) {
            db.createObjectStore("cache");
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["cache"], "readwrite");
          const store = transaction.objectStore("cache");
          const putRequest = store.put(value, key);

          putRequest.onsuccess = () => {
            resolve();
          };

          putRequest.onerror = () => {
            resolve();
          };
        };

        request.onerror = () => {
          resolve();
        };
      });
    },
    removeItem: (key: string) => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open("astrsk-query-cache", 1);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["cache"], "readwrite");
          const store = transaction.objectStore("cache");
          const deleteRequest = store.delete(key);

          deleteRequest.onsuccess = () => {
            resolve();
          };

          deleteRequest.onerror = () => {
            resolve();
          };
        };

        request.onerror = () => {
          resolve();
        };
      });
    },
  },
});

// Initialize persistence
const initQueries = ["init-service", "init-store", "init-default"];
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Do not persist init queries
      if (initQueries.includes(query.queryKey[0] as string)) {
        return false;
      }

      // Do not persist list queries
      if (query.queryKey.includes("list")) {
        return false;
      }

      return true;
    },
  },
});

// Initialize broadcast for multi-tab sync (skip for web version)
// VITE_SKIP_WAITING=true disables broadcast to prevent multi-tab sync issues in web mode
// TEMPORARILY DISABLED for OAuth hang debugging - testing if BroadcastChannel causes iOS issues
if (false && import.meta.env.VITE_SKIP_WAITING !== "true") {
  broadcastQueryClient({
    queryClient,
    broadcastChannel: "astrsk-query-broadcast",
  });
}
