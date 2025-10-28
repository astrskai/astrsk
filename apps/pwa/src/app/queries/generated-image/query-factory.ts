/**
 * Generated Image Query Factory
 *
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { GeneratedImage } from "@/entities/generated-image/domain";
import { GeneratedImageDrizzleMapper } from "@/entities/generated-image/mappers/generated-image-drizzle-mapper";
import { queryClient } from "@/app/queries/query-client";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Query Key Factory
 *
 * Hierarchical structure:
 * - all: ['generated-images']
 * - lists: ['generated-images', 'list']
 * - list(filters): ['generated-images', 'list', { filters }]
 * - byCard: ['generated-images', 'by-card']
 * - byCard(cardId): ['generated-images', 'by-card', cardId]
 * - details: ['generated-images', 'detail']
 * - detail(id): ['generated-images', 'detail', id]
 */
export const generatedImageKeys = {
  // Root key for all generated image queries
  all: ["generated-images"] as const,

  // List queries
  lists: () => [...generatedImageKeys.all, "list"] as const,
  list: (filters?: any) =>
    filters ? ([...generatedImageKeys.lists(), filters] as const) : generatedImageKeys.lists(),

  // Card-specific queries
  byCard: () => [...generatedImageKeys.all, "by-card"] as const,
  cardImages: (cardId: string) => [...generatedImageKeys.byCard(), cardId] as const,

  // Detail queries
  details: () => [...generatedImageKeys.all, "detail"] as const,
  detail: (id: string) => [...generatedImageKeys.details(), id] as const,
};

// Types for query data
export interface GeneratedImageListFilters {
  limit?: number;
}

// Query Options Factory
export const generatedImageQueries = {
  // List all generated images
  list: (filters: GeneratedImageListFilters = { limit: 100 }) =>
    queryOptions({
      queryKey: generatedImageKeys.list(filters),
      queryFn: async () => {
        const result = await GeneratedImageService.listGeneratedImages.execute();
        if (result.isFailure) return [];
        const images = result.getValue();

        // Store each image in detail cache
        images.forEach((image) => {
          queryClient.setQueryData(
            generatedImageKeys.detail(image.id.toString()),
            GeneratedImageDrizzleMapper.toPersistence(image),
          );
        });

        // Return persistence objects for caching
        return images.map((image) => GeneratedImageDrizzleMapper.toPersistence(image));
      },
      select: (data): GeneratedImage[] => {
        if (!data || !Array.isArray(data)) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = data.map((image) =>
          GeneratedImageDrizzleMapper.toDomain(image as any),
        );
        
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // List images for a specific card
  cardImages: (cardId: string | UniqueEntityID) =>
    queryOptions({
      queryKey: generatedImageKeys.cardImages(typeof cardId === "string" ? cardId : cardId.toString()),
      queryFn: async () => {
        const uniqueId = typeof cardId === "string" ? new UniqueEntityID(cardId) : cardId;
        const result = await GeneratedImageService.listGeneratedImages.executeForCard(uniqueId);
        if (result.isFailure) return [];
        const images = result.getValue();

        // Store each image in detail cache
        images.forEach((image) => {
          queryClient.setQueryData(
            generatedImageKeys.detail(image.id.toString()),
            GeneratedImageDrizzleMapper.toPersistence(image),
          );
        });

        // Return persistence objects for caching
        return images.map((image) => GeneratedImageDrizzleMapper.toPersistence(image));
      },
      select: (data): GeneratedImage[] => {
        if (!data || !Array.isArray(data)) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = data.map((image) =>
          GeneratedImageDrizzleMapper.toDomain(image as any),
        );
        
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Get a specific generated image
  detail: (id: string | UniqueEntityID) =>
    queryOptions({
      queryKey: generatedImageKeys.detail(typeof id === "string" ? id : id.toString()),
      queryFn: async () => {
        const uniqueId = typeof id === "string" ? new UniqueEntityID(id) : id;
        const result = await GeneratedImageService.getGeneratedImage.execute(uniqueId);
        if (result.isFailure) return null;
        const image = result.getValue();
        // Transform to persistence format for storage
        return GeneratedImageDrizzleMapper.toPersistence(image);
      },
      select: (data): GeneratedImage | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = GeneratedImageDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 60, // 1 minute
    }),
};

/**
 * Usage Examples:
 *
 * // Using query options
 * const { data: images } = useQuery(generatedImageQueries.list());
 * const { data: cardImages } = useQuery(generatedImageQueries.cardImages(cardId));
 * const { data: image } = useQuery(generatedImageQueries.detail(imageId));
 *
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: generatedImageKeys.all }); // All generated image queries
 * queryClient.invalidateQueries({ queryKey: generatedImageKeys.cardImages(cardId) }); // Just card images
 * queryClient.invalidateQueries({ queryKey: generatedImageKeys.detail(imageId) }); // Just one image
 *
 * // Prefetching
 * await queryClient.prefetchQuery(generatedImageQueries.cardImages(cardId));
 *
 * // Setting query data
 * queryClient.setQueryData(generatedImageKeys.detail(imageId), newImage);
 *
 * // Getting query data
 * const cachedImages = queryClient.getQueryData<GeneratedImage[]>(generatedImageKeys.cardImages(cardId));
 */