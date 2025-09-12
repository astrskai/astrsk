import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

/**
 * Hook for accessing Seedream image generation endpoints
 * from the vibe backend (apps/vibe)
 */
export const useSeedreamGenerator = () => {
  // Seedream image generation actions
  // @ts-ignore - Convex types will be generated when dev server runs
  const generateSeedreamImage = useAction(api.vibe_coding.mutations.imageMutations.generateSeedreamImage);
  // @ts-ignore - Convex types will be generated when dev server runs
  const generateSeedreamImageToImage = useAction(api.vibe_coding.mutations.imageMutations.generateSeedreamImageToImage);

  return {
    generateSeedreamImage,
    generateSeedreamImageToImage,
  };
};

/**
 * Types for Seedream image generation
 */
export interface SeedreamImageResponse {
  success: boolean;
  prompt: string;
  imageId?: string;
  images: Array<{
    id: string;
    url: string;
    byteImageId?: string;
    mimeType: string;
    size: number;
    generatedAt: number;
  }>;
  model: string;
  error?: string;
}

export interface SeedreamI2IResponse extends SeedreamImageResponse {
  inputImages?: number;
}