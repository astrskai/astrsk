import Worker from "@/db/pglite-worker.ts?worker";
import { logger } from "@/shared/lib/logger";
import { PGliteInterface } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { Base64 } from "js-base64";
import { file, write } from "opfs-tools";

const PGLITE_DUMP_PATH = "/pglite/dump.txt";
const PGLITE_INDEXEDDB_NAME = "/pglite/astrsk";
const PGLITE_DATA_DIR = "idb://astrsk";

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}

async function restoreDumpFiles() {
  // Check electron dump
  if (!window.api?.dump) {
    return;
  }

  // Get metadata
  const metadata = await window.api.dump.getMetadata();
  if (!metadata) {
    return;
  }

  // Restore database
  const databaseDump = await window.api.dump.getDump(metadata.database);
  if (!databaseDump) {
    return;
  }
  await write(PGLITE_DUMP_PATH, databaseDump);

  // Restore assets
  for (const assetPath of metadata.assets) {
    const normalizedAssetPath = assetPath.replace(/\\/g, "/");
    const assetDump = await window.api.dump.getDump(assetPath);
    if (!assetDump) {
      continue;
    }
    const buffer = Base64.toUint8Array(assetDump);
    await write(normalizedAssetPath, buffer.buffer as ArrayBuffer);
  }

  // Delete dump
  await window.api.dump.deleteDump(metadata.database);
  for (const asset of metadata.assets) {
    await window.api.dump.deleteDump(asset);
  }

  // Reset query cache
  indexedDB.deleteDatabase("astrsk-query-cache");
}

export class Pglite {
  private static _instance: PGliteInterface;
  private static _initPromise: Promise<PGliteInterface> | null = null;

  public static async getInstance() {
    // Check instance exists
    if (Pglite._instance) {
      return Pglite._instance;
    }

    // Check if instance is initializing
    if (Pglite._initPromise) {
      return Pglite._initPromise;
    }

    // Create init promise
    Pglite._initPromise = (async () => {
      // Restore dump files
      await restoreDumpFiles();

      // Get dump
      const dump = await file(PGLITE_DUMP_PATH).getOriginFile();

      // When dump exists
      if (dump) {
        // Remove old indexeddb
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(PGLITE_INDEXEDDB_NAME);
          deleteRequest.onsuccess = (event) => {
            logger.debug("Successfully deleted IndexedDB", event);
            resolve(true);
          };
          deleteRequest.onerror = (event) => {
            logger.error("Failed to delete IndexedDB", event);
            reject(event);
          };
          deleteRequest.onblocked = (event) => {
            logger.error("Failed to delete IndexedDB, blocked", event);
            reject(event);
          };
        });
      }

      // Detect browser and device
      const userAgent = navigator.userAgent;
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const hasWebLocks = 'locks' in navigator;

      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);

      // Safari (especially on iOS) has buggy Web Locks implementation - always use direct PGlite
      // Mobile devices should also use direct PGlite for better stability
      const supportsWebLocks = hasWebLocks && !isSafari && !isMobile;

      const browserInfo = {
        isChrome: userAgent.includes('Chrome') && !userAgent.includes('Edg'),
        isSafari,
        isFirefox: userAgent.includes('Firefox'),
        isEdge: userAgent.includes('Edg'),
        isMobile,
        isIOS,
        hasWebLocksAPI: hasWebLocks,
        willUseWebLocks: supportsWebLocks,
      };

      logger.debug("🔵 [PGlite.init] Browser detection", browserInfo);

      if (supportsWebLocks) {
        // Use PGliteWorker for multi-tab support (Chrome, Firefox, Edge)
        logger.debug("🔵 [PGlite.init] Using PGliteWorker (multi-tab mode)");
        Pglite._instance = new PGliteWorker(
          new Worker({
            name: "pglite-worker",
          }),
          {
            dataDir: PGLITE_DATA_DIR,
            relaxedDurability: true,
          },
        );
      } else {
        // Fallback to direct PGlite (Safari, mobile, or browsers without Web Locks)
        logger.debug("🔵 [PGlite.init] Using direct PGlite (single-tab mode)");
        const { PGlite: PGliteClass } = await import("@electric-sql/pglite");
        const instance = new PGliteClass({
          dataDir: PGLITE_DATA_DIR,
          relaxedDurability: true,
        });

        await instance.waitReady;
        Pglite._instance = instance;
      }

      // Wait for PGlite to be ready using waitReady (recommended by PGlite docs)
      // Use Promise.race with timeout to prevent infinite hang on iOS
      const PGLITE_INIT_TIMEOUT_MS = 15000; // 15 seconds

      logger.debug("Waiting for PGlite to be ready...");
      await Promise.race([
        Pglite._instance.waitReady,
        timeout(PGLITE_INIT_TIMEOUT_MS, `PGlite initialization timeout after ${PGLITE_INIT_TIMEOUT_MS}ms`),
      ]);
      logger.debug("PGlite is ready");

      // Verify with a simple query (also with timeout)
      await Promise.race([
        Pglite._instance.query("SELECT 1;"),
        timeout(5000, "PGlite query timeout after 5000ms"),
      ]);
      logger.debug("PGlite query test passed");

      // Restore dump
      if (dump) {
        // Get search path
        const initialSearchPath = (
          await Pglite._instance.query<{ search_path: string }>(
            "SHOW SEARCH_PATH;",
          )
        ).rows[0].search_path;

        // Restore snapshot
        await Pglite._instance.exec(await dump.text());

        // Set search path
        await Pglite._instance.exec(`SET search_path TO ${initialSearchPath};`);

        // Remove dump file
        await file(PGLITE_DUMP_PATH).remove();
      }

      // Return PGlite instance
      return Pglite._instance;
    })();

    // Return PGlite init promise
    return Pglite._initPromise;
  }
}
