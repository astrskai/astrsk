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
import { logger } from "@/shared/utils/logger";
import { PGliteWithLive } from "@electric-sql/pglite/live";
import { PGliteWorker } from "@electric-sql/pglite/worker";
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

// Store current live query cleanup functions
let liveQueryCleanups: (() => void)[] = [];

// Clean up existing live queries
function cleanupLiveQueries() {
  liveQueryCleanups.forEach((cleanup) => cleanup());
  liveQueryCleanups = [];
}

// Register live queries for the leader tab
async function registerLiveQueries() {
  const db = (await Pglite.getInstance()) as PGliteWithLive;

  // Clean up any existing live queries first
  cleanupLiveQueries();

  // Common
  const assetsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Assets}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Assets}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: assetQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => assetsCleanup.unsubscribe());

  // API
  const apiConnectionsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.ApiConnections}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(
          `${TableName.ApiConnections}: ${change.__op__} ${change.id}`,
        );
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
  liveQueryCleanups.push(() => apiConnectionsCleanup.unsubscribe());

  // Flow
  const flowsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Flows}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Flows}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: flowQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => flowsCleanup.unsubscribe());
  const agentsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Agents}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Agents}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: agentQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => agentsCleanup.unsubscribe());

  // Card
  const cardsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Cards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Cards}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => cardsCleanup.unsubscribe());
  const characterCardsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.CharacterCards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(
          `${TableName.CharacterCards}: ${change.__op__} ${change.id}`,
        );
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => characterCardsCleanup.unsubscribe());
  const plotCardsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.PlotCards}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.PlotCards}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: cardQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => plotCardsCleanup.unsubscribe());

  // Session
  const sessionsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Sessions}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Sessions}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(new UniqueEntityID(change.id))
            .queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => sessionsCleanup.unsubscribe());
  const turnsCleanup = await db.live.changes<{ id: string }>(
    `SELECT * FROM ${TableName.Turns}`,
    [],
    "id",
    (res) => {
      res.forEach((change) => {
        logger.debug(`${TableName.Turns}: ${change.__op__} ${change.id}`);
        queryClient.invalidateQueries({
          queryKey: turnQueries.detail(new UniqueEntityID(change.id)).queryKey,
        });
      });
    },
  );
  liveQueryCleanups.push(() => turnsCleanup.unsubscribe());
}

// Invalidate by live query
export async function invalidateByLiveQuery() {
  const db = (await Pglite.getInstance()) as PGliteWithLive & PGliteWorker;

  // Set up leader change handler to restart live queries when leadership changes
  const handleLeaderChange = () => {
    if (db.isLeader) {
      // This tab became the leader, register live queries
      logger.debug("This tab became the leader");
      registerLiveQueries();
    } else {
      // This tab is no longer the leader, clean up live queries
      logger.debug("This tab is no loger leader");
      cleanupLiveQueries();
    }
  };

  // Listen for leader changes
  db.onLeaderChange(handleLeaderChange);

  // Only register live queries if this tab is the leader
  if (!db.isLeader) {
    logger.debug("This tab is not leader");
    return;
  }

  // Register live queries for the current leader
  logger.debug("This tab is leader");
  await registerLiveQueries();
}
