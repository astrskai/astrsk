import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

/**
 * Hook for accessing Seedance video generation endpoints
 * from the vibe backend (apps/vibe)
 */
export const useSeedanceGenerator = () => {
  // Seedance video generation actions - using videoMutations file (where they're actually defined)
  // @ts-ignore - Convex types will be generated when dev server runs
  const generateSeedanceVideo = useAction(api.vibe_coding.mutations.videoMutations.generateSeedanceTextToVideo);
  // @ts-ignore - Convex types will be generated when dev server runs
  const generateSeedanceImageToVideo = useAction(api.vibe_coding.mutations.videoMutations.generateSeedanceImageToVideo);
  // @ts-ignore - Convex types will be generated when dev server runs
  const checkVideoStatus = useAction(api.vibe_coding.mutations.videoMutations.checkVideoStatus);
  // @ts-ignore - Convex types will be generated when dev server runs
  const getVideoOptions = useAction(api.vibe_coding.mutations.videoMutations.getVideoOptions);

  return {
    generateSeedanceVideo,
    generateSeedanceImageToVideo,
    checkVideoStatus,
    getVideoOptions,
  };
};

/**
 * Types for Seedance video generation
 */
export interface SeedanceVideoResponse {
  success: boolean;
  prompt: string;
  videoId?: string;
  taskId?: string;
  status: string;
  video?: {
    id: string;
    url: string;
    thumbnailUrl: string;
    mimeType: string;
    size: number;
    generatedAt: number;
  };
  model: string;
  error?: string;
}

export interface VideoStatusResponse {
  taskId: string;
  status: string;
  video?: {
    id: string;
    url: string;
    thumbnailUrl: string;
    mimeType: string;
    size: number;
    generatedAt: number;
  };
  error?: string;
}

export interface VideoOptionsResponse {
  models: Array<{
    id: string;
    name: string;
    provider: string;
    capabilities: string[];
  }>;
  defaultPrompt: string;
}