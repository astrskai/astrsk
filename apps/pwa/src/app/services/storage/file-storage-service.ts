interface FileStorage {
  write(path: string, file: File): Promise<void>;
  read(path: string): Promise<File | null>;
  delete(path: string): Promise<void>;
}

class FileStorageService implements FileStorage {
  write(path: string, file: File): Promise<void> {
    throw new Error("Method not implemented.");
  }

  read(path: string): Promise<File | null> {
    throw new Error("Method not implemented.");
  }

  delete(path: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export { FileStorageService };
export type { FileStorage };
