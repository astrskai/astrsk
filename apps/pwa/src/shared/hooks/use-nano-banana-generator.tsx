import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

/**
 * Hook for accessing Nano Banana image generation endpoints
 * from the vibe backend (apps/vibe)
 */
export const useNanoBananaGenerator = () => {
  // Nano banana image generation actions
  const generateNanoBananaImage = useAction(api.vibe_coding.mutations.imageMutations.generateNanoBananaImage);
  const generateCustomImage = useAction(api.vibe_coding.mutations.imageMutations.generateCustomImage);
  const generateImageToImage = useAction(api.vibe_coding.mutations.imageMutations.generateImageToImage);
  const getImageOptions = useAction(api.vibe_coding.mutations.imageMutations.getImageOptions);

  return {
    generateNanoBananaImage,
    generateCustomImage,
    generateImageToImage,
    getImageOptions,
  };
};

/**
 * Types for nano banana image generation
 */
export interface NanoBananaImageResponse {
  success: boolean;
  prompt: string;
  textContent: string;
  images: Array<{
    id: string;
    storageId: string;
    url: string;
    mimeType: string;
    size: number;
    prompt: string;
    generatedAt: number;
  }>;
  generatedAt: number;
  error?: string;
}

export interface CustomImageResponse extends NanoBananaImageResponse {
  originalPrompt: string;
  style?: string;
  aspectRatio?: string;
  images: Array<{
    id: string;
    storageId: string;
    url: string;
    mimeType: string;
    size: number;
    prompt: string;
    originalPrompt: string;
    style?: string;
    aspectRatio?: string;
    generatedAt: number;
  }>;
}

export interface ImageToImageResponse extends CustomImageResponse {
  inputImageProvided: boolean;
  images: Array<{
    id: string;
    storageId: string;
    url: string;
    mimeType: string;
    size: number;
    prompt: string;
    originalPrompt: string;
    style?: string;
    aspectRatio?: string;
    inputImageProvided: boolean;
    generatedAt: number;
  }>;
}

export interface ImageOptionsResponse {
  availableStyles: string[];
  availableAspectRatios: string[];
  defaultPrompt: string;
  model: string;
  capabilities: string[];
}