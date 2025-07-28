import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

import { assetQueries } from "@/app/queries/asset-queries";
import { FileStorageService } from "@/app/services/storage/file-storage-service";

const SKELETON_PATH = "/img/skeleton.svg";

// Get singleton instance
const storageService = FileStorageService.getInstance();

const useStorageFile = (filePath?: string | null) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setObjectUrl(null);
      return;
    }

    let mounted = true;

    const loadFile = async () => {
      try {
        // Get file from storage service
        const file = await storageService.read(filePath);
        if (!file) {
          // TODO: get file from cloud or p2p
          if (mounted) setObjectUrl(null);
          return;
        }

        // Create object URL
        const url = URL.createObjectURL(file);
        if (mounted) setObjectUrl(url);

        // Cleanup function will revoke the URL
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        logger.error("Failed to load file from storage:", error);
        if (mounted) setObjectUrl(null);
      }
    };

    const cleanup = loadFile();

    return () => {
      mounted = false;
      cleanup?.then((fn) => fn?.());
    };
  }, [filePath]);

  return { data: objectUrl } as const;
};

const useAsset = (assetId?: UniqueEntityID) => {
  // Get asset file path
  const { data: filePath, isFetching } = useQuery(
    assetQueries.detail(assetId),
  );

  // Get file object URL from storage
  const { data: fileObjectURL } = useStorageFile(filePath);

  return [isFetching ? SKELETON_PATH : fileObjectURL] as const;
};

export { useAsset };
