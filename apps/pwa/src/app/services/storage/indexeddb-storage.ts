import type { FileStorage } from "@/app/services/storage/file-storage-service";
import { logger } from "@/shared/utils";

const DB_NAME = "astrsk-file-storage";
const DB_VERSION = 1;
const STORE_NAME = "files";

export class IndexedDbStorage implements FileStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private async getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          logger.error("Failed to open IndexedDB", request.error);
          reject(request.error);
        };
      });
    }
    return this.dbPromise;
  }

  async write(path: string, file: File): Promise<void> {
    try {
      const db = await this.getDb();
      const arrayBuffer = await file.arrayBuffer();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => {
          logger.error(
            `Transaction failed while writing file to IndexedDB: ${path}`,
            transaction.error,
          );
          reject(transaction.error);
        };

        const fileData = {
          arrayBuffer,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
        };

        const request = store.put(fileData, path);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          logger.error(
            `Failed to write file to IndexedDB: ${path}`,
            request.error,
          );
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error(`Failed to write file to IndexedDB: ${path}`, error);
      throw error;
    }
  }

  async read(path: string): Promise<File | null> {
    try {
      const db = await this.getDb();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => {
          logger.error(
            `Transaction failed while reading file from IndexedDB: ${path}`,
            transaction.error,
          );
          reject(transaction.error);
        };

        const request = store.get(path);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          const file = new File([result.arrayBuffer], result.name, {
            type: result.type,
            lastModified: result.lastModified,
          });
          resolve(file);
        };

        request.onerror = () => {
          logger.error(
            `Failed to read file from IndexedDB: ${path}`,
            request.error,
          );
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error(`Failed to read file from IndexedDB: ${path}`, error);
      return null;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const db = await this.getDb();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => {
          logger.error(
            `Transaction failed while deleting file from IndexedDB: ${path}`,
            transaction.error,
          );
          reject(transaction.error);
        };

        const request = store.delete(path);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          logger.error(
            `Failed to delete file from IndexedDB: ${path}`,
            request.error,
          );
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error(`Failed to delete file from IndexedDB: ${path}`, error);
      throw error;
    }
  }
}
