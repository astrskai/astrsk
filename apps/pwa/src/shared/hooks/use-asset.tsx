import { useQuery } from "@tanstack/react-query";
import { file } from "opfs-tools";
import { useEffect, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

import { assetQueries } from "@/entities/asset/api/asset-queries";

const SKELETON_PATH = "/img/skeleton.svg";

const useOpfsFile = (filePath?: string | null) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath) {
      setObjectUrl(null);
      setError(null);
      return;
    }

    let mounted = true;
    let currentUrl: string | null = null;

    const loadFile = async () => {
      try {
        // Get OPFS file
        const opfsFile = await file(filePath).getOriginFile();
        if (!opfsFile) {
          // File doesn't exist in OPFS - this is not an error, just missing data
          // TODO: get file from cloud or p2p
          if (mounted) {
            setObjectUrl(null);
            setError(null);
          }
          return;
        }

        // Create object URL
        const url = URL.createObjectURL(opfsFile);
        currentUrl = url; // Store URL for cleanup
        if (mounted) {
          setObjectUrl(url);
          setError(null);
        } else {
          // If unmounted before setting, revoke immediately
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        // Log error but don't throw - allow UI to continue rendering
        logger.error(`Failed to load OPFS file "${filePath}":`, error);
        if (mounted) {
          setObjectUrl(null);
          setError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };

    loadFile().catch((err) => {
      // Catch any unhandled promise rejections
      logger.error(`Unhandled error loading OPFS file "${filePath}":`, err);
      if (mounted) {
        setObjectUrl(null);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    });

    // Cleanup: revoke the URL when component unmounts or filePath changes
    return () => {
      mounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        currentUrl = null;
      }
      setObjectUrl(null);
      setError(null);
    };
  }, [filePath]);

  return { data: objectUrl, error } as const;
};

const useAsset = (assetId?: UniqueEntityID) => {
  // Get asset file path
  const { data: opfsFilePath, isFetching } = useQuery(
    assetQueries.detail(assetId),
  );

  // Get full asset metadata including mime type
  const { data: assetData } = useQuery(assetQueries.fullDetail(assetId));

  // Get OPFS file object URL
  const { data: opfsFileObjectURL } = useOpfsFile(opfsFilePath);

  // Check if it's a video based on mime type
  const isVideo = assetData?.mimeType?.startsWith("video/") || false;

  return [isFetching ? SKELETON_PATH : opfsFileObjectURL, isVideo] as const;
};

export { useAsset };
