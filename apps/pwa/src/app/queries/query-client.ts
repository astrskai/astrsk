import { agentQueries } from "@/app/queries/agent-queries";
import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import { assetQueries } from "@/app/queries/asset-queries";
import { cardQueries } from "@/app/queries/card-queries";
import { flowQueries } from "@/app/queries/flow-queries";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { Pglite } from "@/db/pglite";
import { TableName } from "@/db/schema/table-name";
import { UniqueEntityID } from "@/shared/domain";
import { PGliteWithLive } from "@electric-sql/pglite/live";
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

// Initialize broadcast
broadcastQueryClient({
  queryClient,
  broadcastChannel: "astrsk-query-broadcast",
});

// Invalidate by live query
export async function invalidateByLiveQuery() {
  const db = (await Pglite.getInstance()) as PGliteWithLive;

  // Common
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Assets}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: assetQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );

  // API
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.ApiConnections}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: apiConnectionQueries.detail(new UniqueEntityID(change.id))
            .queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: apiConnectionQueries.withModels(),
        });
      });
    },
  );

  // Flow
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Flows}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: flowQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Agents}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: agentQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );

  // Card
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Cards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.CharacterCards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.PlotCards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );

  // Session
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Sessions}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(new UniqueEntityID(change.id))
            .queryKey,
        });
      });
    },
  );
  db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Turns}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        queryClient.invalidateQueries({
          queryKey: turnQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
}
