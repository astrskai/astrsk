import { IndexedDbStorage } from "@/app/services/storage/indexeddb-storage";
import { OpfsStorage } from "@/app/services/storage/opfs-storage";
import { logger } from "@/shared/utils";

interface FileStorage {
  write(path: string, file: File): Promise<void>;
  read(path: string): Promise<File | null>;
  delete(path: string): Promise<void>;
}

class FileStorageService implements FileStorage {
  private static _instance: FileStorageService | null = null;
  private storage: FileStorage | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): FileStorageService {
    if (!FileStorageService._instance) {
      FileStorageService._instance = new FileStorageService();
    }
    return FileStorageService._instance;
  }

  private async isOpfsAvailable(): Promise<boolean> {
    try {
      if (!navigator?.storage?.getDirectory) {
        return false;
      }

      const opfsRoot = await navigator.storage.getDirectory();
      const testFile = await opfsRoot.getFileHandle("test-opfs-availability", {
        create: true,
      });
      const writable = await testFile.createWritable();
      await writable.write("test");
      await writable.close();
      await opfsRoot.removeEntry("test-opfs-availability");

      return true;
    } catch {
      return false;
    }
  }

  private async initStorage(): Promise<void> {
    if (this.storage) {
      return;
    }

    const hasOpfs = await this.isOpfsAvailable();
    if (hasOpfs) {
      logger.info("Using OPFS for file storage");
      this.storage = new OpfsStorage();
    } else {
      logger.info(
        "OPFS not available, falling back to IndexedDB for file storage",
      );
      this.storage = new IndexedDbStorage();
    }
  }

  private async getStorage(): Promise<FileStorage> {
    if (!this.initPromise) {
      this.initPromise = this.initStorage();
    }
    await this.initPromise;
    return this.storage!;
  }

  async write(path: string, file: File): Promise<void> {
    const storage = await this.getStorage();
    return storage.write(path, file);
  }

  async read(path: string): Promise<File | null> {
    const storage = await this.getStorage();
    return storage.read(path);
  }

  async delete(path: string): Promise<void> {
    const storage = await this.getStorage();
    return storage.delete(path);
  }
}

export { FileStorageService };
export type { FileStorage };
