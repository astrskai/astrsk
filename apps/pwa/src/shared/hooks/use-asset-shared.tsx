import { useQuery } from "@tanstack/react-query";
import { file } from "opfs-tools";
import { useEffect, useState, useRef } from "react";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

import { assetQueries } from "@/entities/asset/api/asset-queries";

const SKELETON_PATH = "/img/skeleton.svg";

// Global cache for object URLs to share across components
// Key: filePath, Value: { url: string, refCount: number, keepAlive: boolean }
const globalObjectUrlCache = new Map<
  string,
  {
    url: string;
    refCount: number;
    keepAlive: boolean; // If true, URL won't be revoked even when refCount is 0
  }
>();

// Cleanup old URLs periodically (after 5 minutes of non-use)
const URL_CLEANUP_DELAY = 5 * 60 * 1000; // 5 minutes
const cleanupTimers = new Map<string, NodeJS.Timeout>();

// Create a shared object URL that's reused across components
const useSharedOpfsFile = (filePath?: string | null) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const currentPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup function for previous path
    const cleanup = () => {
      if (currentPathRef.current) {
        const path = currentPathRef.current;
        const cached = globalObjectUrlCache.get(path);
        if (cached) {
          cached.refCount--;

          // Clear any existing cleanup timer
          const existingTimer = cleanupTimers.get(path);
          if (existingTimer) {
            clearTimeout(existingTimer);
            cleanupTimers.delete(path);
          }

          // Only schedule cleanup when no components are using it
          if (cached.refCount <= 0 && !cached.keepAlive) {
            // Schedule cleanup after delay to allow for navigation
            const timer = setTimeout(() => {
              const stillCached = globalObjectUrlCache.get(path);
              if (stillCached && stillCached.refCount <= 0) {
                URL.revokeObjectURL(stillCached.url);
                globalObjectUrlCache.delete(path);
                cleanupTimers.delete(path);
              }
            }, URL_CLEANUP_DELAY);
            cleanupTimers.set(path, timer);
          }
        }
        currentPathRef.current = null;
      }
    };

    if (!filePath) {
      cleanup();
      setObjectUrl(null);
      return;
    }

    // Check if we already have this URL cached
    const existingCache = globalObjectUrlCache.get(filePath);
    if (existingCache) {
      // Clear any pending cleanup timer since we're reusing it
      const existingTimer = cleanupTimers.get(filePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
        cleanupTimers.delete(filePath);
      }

      // Reuse existing URL
      existingCache.refCount++;
      currentPathRef.current = filePath;
      setObjectUrl(existingCache.url);
      return cleanup;
    }

    // Create new URL
    let mounted = true;

    const loadFile = async () => {
      try {
        // Get OPFS file
        const opfsFile = await file(filePath).getOriginFile();
        if (!opfsFile) {
          if (mounted) setObjectUrl(null);
          return;
        }

        // Create object URL
        const url = URL.createObjectURL(opfsFile);

        if (mounted) {
          // Cache the URL for reuse
          globalObjectUrlCache.set(filePath, {
            url,
            refCount: 1,
            keepAlive: false,
          });
          currentPathRef.current = filePath;
          setObjectUrl(url);
        } else {
          // If unmounted before setting, revoke immediately
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        logger.error("Failed to load OPFS file:", error);
        if (mounted) setObjectUrl(null);
      }
    };

    loadFile();

    // Cleanup on unmount
    return () => {
      mounted = false;
      cleanup();
    };
  }, [filePath]);

  return { data: objectUrl } as const;
};

/**
 * Optimized version of useAsset that shares object URLs across components.
 * This prevents loading the same video/image multiple times when used in multiple places.
 */
const useAssetShared = (assetId?: UniqueEntityID) => {
  // Get asset file path
  const { data: opfsFilePath, isFetching } = useQuery(
    assetQueries.detail(assetId),
  );

  // Get full asset metadata including mime type
  const { data: assetData } = useQuery(assetQueries.fullDetail(assetId));

  // Get OPFS file object URL (shared across components)
  const { data: opfsFileObjectURL } = useSharedOpfsFile(opfsFilePath);

  // Check if it's a video based on mime type
  const isVideo = assetData?.mimeType?.startsWith("video/") || false;

  return [isFetching ? SKELETON_PATH : opfsFileObjectURL, isVideo] as const;
};

export { useAssetShared };
