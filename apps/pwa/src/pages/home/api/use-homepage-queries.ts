import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  fetchHomepageBannerSessions,
  fetchFeaturedSessions,
  fetchFeaturedCharacters,
  fetchCloudSessionById,
  fetchCloudCharacterById,
  type HomepageBannerData,
  type FeaturedSessionData,
  type FeaturedCharacterData,
} from "./homepage-queries";

/**
 * Query factory for homepage data from Harpy Chat Hub
 */
export const homepageQueries = {
  all: () => ["homepage"] as const,

  // Banner sessions (featured sessions from Harpy Chat Hub)
  banners: () => [...homepageQueries.all(), "banners"] as const,
  bannerSessions: (limit = 3) =>
    queryOptions({
      queryKey: [...homepageQueries.banners(), { limit }],
      queryFn: async (): Promise<HomepageBannerData[]> => {
        const result = await fetchHomepageBannerSessions(limit);
        if (result.isFailure) {
          console.error("[Homepage] Failed to fetch banner sessions:", result.getError());
          return [];
        }
        return result.getValue();
      },
      gcTime: 1000 * 60 * 60, // 1 hour cache
      staleTime: 1000 * 60 * 30, // 30 minutes stale time
    }),

  // Featured sessions (from homepage_sections)
  featuredSessions: () => [...homepageQueries.all(), "featured-sessions"] as const,
  featuredSessionsList: (limit = 3) =>
    queryOptions({
      queryKey: [...homepageQueries.featuredSessions(), { limit, v: 2 }], // v2: added title filter
      queryFn: async (): Promise<FeaturedSessionData[]> => {
        console.log("[useFeaturedSessions] Query function called with limit:", limit);
        const result = await fetchFeaturedSessions(limit);
        if (result.isFailure) {
          console.error("[Homepage] Failed to fetch featured sessions:", result.getError());
          return [];
        }
        console.log("[useFeaturedSessions] Success, returning data:", result.getValue());
        return result.getValue();
      },
      gcTime: 1000 * 60 * 60, // 1 hour cache
      staleTime: 0, // Always fetch fresh data (for debugging)
      refetchOnMount: true, // Refetch on component mount (for debugging)
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }),

  // Featured characters (from homepage_sections)
  featuredCharacters: () => [...homepageQueries.all(), "featured-characters"] as const,
  featuredCharactersList: (limit = 4) =>
    queryOptions({
      queryKey: [...homepageQueries.featuredCharacters(), { limit, v: 2 }], // v2: added title filter
      queryFn: async (): Promise<FeaturedCharacterData[]> => {
        console.log("[useFeaturedCharacters] Query function called with limit:", limit);
        const result = await fetchFeaturedCharacters(limit);
        if (result.isFailure) {
          console.error("[Homepage] Failed to fetch featured characters:", result.getError());
          return [];
        }
        console.log("[useFeaturedCharacters] Success, returning data:", result.getValue());
        return result.getValue();
      },
      gcTime: 1000 * 60 * 60, // 1 hour cache
      staleTime: 0, // Always fetch fresh data (for debugging)
      refetchOnMount: true, // Refetch on component mount (for debugging)
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }),

  // Cloud session detail (for preview page)
  cloudSessions: () => [...homepageQueries.all(), "cloud-session"] as const,
  cloudSessionDetail: (sessionId: string) =>
    queryOptions({
      queryKey: [...homepageQueries.cloudSessions(), sessionId],
      queryFn: async (): Promise<HomepageBannerData["session"]> => {
        const result = await fetchCloudSessionById(sessionId);
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        return result.getValue();
      },
      gcTime: 1000 * 60 * 60, // 1 hour cache
      staleTime: 1000 * 60 * 30, // 30 minutes stale time
      enabled: !!sessionId,
    }),

  // Cloud character detail (for preview page)
  cloudCharacters: () => [...homepageQueries.all(), "cloud-character"] as const,
  cloudCharacterDetail: (characterId: string) =>
    queryOptions({
      queryKey: [...homepageQueries.cloudCharacters(), characterId],
      queryFn: async (): Promise<FeaturedCharacterData> => {
        const result = await fetchCloudCharacterById(characterId);
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        return result.getValue();
      },
      gcTime: 1000 * 60 * 60, // 1 hour cache
      staleTime: 1000 * 60 * 30, // 30 minutes stale time
      enabled: !!characterId,
    }),
};

/**
 * Hook to fetch homepage banner sessions
 * @param limit - Number of banner sessions to fetch (default: 3)
 */
export function useHomepageBannerSessions(limit = 3) {
  return useQuery(homepageQueries.bannerSessions(limit));
}

/**
 * Hook to fetch featured sessions from homepage_sections
 * @param limit - Number of featured sessions to fetch (default: 3)
 */
export function useFeaturedSessions(limit = 3) {
  return useQuery(homepageQueries.featuredSessionsList(limit));
}

/**
 * Hook to fetch featured characters
 * @param limit - Number of featured characters to fetch (default: 4)
 */
export function useFeaturedCharacters(limit = 4) {
  return useQuery(homepageQueries.featuredCharactersList(limit));
}

/**
 * Hook to fetch cloud session detail by ID
 * @param sessionId - Cloud session ID from Harpy Chat Hub
 */
export function useCloudSessionDetail(sessionId: string) {
  return useQuery(homepageQueries.cloudSessionDetail(sessionId));
}

/**
 * Hook to fetch cloud character detail by ID
 * @param characterId - Cloud character ID from Harpy Chat Hub
 */
export function useCloudCharacterDetail(characterId: string) {
  return useQuery(homepageQueries.cloudCharacterDetail(characterId));
}
