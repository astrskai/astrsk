import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { IMAGE_MODELS, type ImageModel } from "@/shared/stores/model-store";

/**
 * Hook for accessing image generation with fallback support
 * Automatically falls back from nano-banana to seedream if needed
 */
export const useFallbackGenerator = () => {
  // Session image generation with fallback
  // @ts-ignore - Convex types will be generated when dev server runs
  const generateSessionImageWithFallbackAction = useAction(
    // @ts-ignore - Convex types will be generated when dev server runs
    api.vibe_coding.mutations.imageFallbackMutations
      .generateSessionImageWithFallback,
  );

  // Wrapper function that handles model conversion
  const generateSessionImageWithFallback = async (
    request: FallbackImageRequest,
  ) => {
    const convertedRequest = {
      ...request,
      modelPriority: request.modelPriority,
    };
    return generateSessionImageWithFallbackAction(convertedRequest);
  };

  return {
    generateSessionImageWithFallback,
  };
};

/**
 * Types for fallback image generation
 */
export interface FallbackImageRequest {
  prompt: string;
  referenceImages?: string[];
  modelPriority?: ImageModel[];
  timeout?: number;
  imageSize?: "1368x2048" | "1024x1024" | "512x512";
  watermark?: boolean;
}

export interface FallbackImageResponse {
  success: boolean;
  modelUsed?: "nano-banana" | "seedream";
  image?: {
    id: string;
    url: string;
    byteImageId?: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
    generatedAt: number;
  };
  attempts: Array<{
    model: "nano-banana" | "seedream";
    success: boolean;
    error?: string;
    timestamp: number;
  }>;
  error?: string;
  creditsUsed: number;
}
