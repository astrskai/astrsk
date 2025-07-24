import { useQuery } from "@tanstack/react-query";
import { file } from "opfs-tools";
import { useEffect, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

import { assetQueries } from "@/app/queries/asset-queries";

const SKELETON_PATH = "/img/skeleton.svg";

const useOpfsFile = (filePath?: string | null) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setObjectUrl(null);
      return;
    }

    let mounted = true;

    const loadFile = async () => {
      try {
        // Get OPFS file
        const opfsFile = await file(filePath).getOriginFile();
        if (!opfsFile) {
          // TODO: get file from cloud or p2p
          if (mounted) setObjectUrl(null);
          return;
        }

        // Create object URL
        const url = URL.createObjectURL(opfsFile);
        if (mounted) setObjectUrl(url);

        // Cleanup function will revoke the URL
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        logger.error("Failed to load OPFS file:", error);
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
  const { data: opfsFilePath, isFetching } = useQuery(
    assetQueries.detail(assetId),
  );

  // Get OPFS file object URL
  const { data: opfsFileObjectURL } = useOpfsFile(opfsFilePath);

  return [isFetching ? SKELETON_PATH : opfsFileObjectURL] as const;
};

export { useAsset };
