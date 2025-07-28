import type { FileStorage } from "@/app/services/storage/file-storage-service";
import { logger } from "@/shared/utils";
import { file, write } from "opfs-tools";

export class OpfsStorage implements FileStorage {
  async write(path: string, fileData: File): Promise<void> {
    try {
      await write(path, fileData.stream());
    } catch (error) {
      logger.error(`Failed to write file to OPFS: ${path}`, error);
      throw error;
    }
  }

  async read(path: string): Promise<File | null> {
    try {
      const opfsFile = await file(path).getOriginFile();
      return opfsFile || null;
    } catch (error) {
      logger.error(`Failed to read file from OPFS: ${path}`, error);
      return null;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await file(path).remove();
    } catch (error) {
      logger.error(`Failed to delete file from OPFS: ${path}`, error);
      throw error;
    }
  }
}
