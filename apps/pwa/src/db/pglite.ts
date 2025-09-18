import Worker from "@/db/pglite-worker.ts?worker";
import { logger } from "@/shared/utils/logger";
import { PGliteInterface } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { Base64 } from "js-base64";
import { file, write } from "opfs-tools";

const PGLITE_DUMP_PATH = "/pglite/dump.txt";
const PGLITE_INDEXEDDB_NAME = "/pglite/astrsk";
const PGLITE_DATA_DIR = "idb://astrsk";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    await write(normalizedAssetPath, buffer);
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

      // Create PGlite instance
      Pglite._instance = new PGliteWorker(
        new Worker({
          name: "pglite-worker",
        }),
        {
          dataDir: PGLITE_DATA_DIR,
          relaxedDurability: true,
        },
      );

      // Wait for PGlite to load
      let waitCount = 0;
      while (true) {
        await sleep(100);
        waitCount += 1;
        await Pglite._instance.query(`SELECT 1;`);
        logger.debug(
          `Check PGLite is ready (${waitCount}):`,
          Pglite._instance.ready,
        );
        if (Pglite._instance.ready) {
          break;
        }
        if (waitCount > 100) {
          throw new Error("Fail to init PGLite");
        }
      }

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
