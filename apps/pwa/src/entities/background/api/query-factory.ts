import { queryOptions } from "@tanstack/react-query";

import { BackgroundService } from "@/app/services/background-service";
import { UniqueEntityID } from "@/shared/domain";
import { Background } from "@/entities/background/domain/background";

/**
 * Default backgrounds provided by astrsk.ai
 * These are global assets that don't need to be stored per-session
 */
export type DefaultBackground = {
  id: UniqueEntityID;
  name: string;
  src: string;
};

// CDN URL for default backgrounds (empty for now, will be configured later)
const CdnBaseURL = "";

export const defaultBackgrounds: DefaultBackground[] = [
  {
    id: new UniqueEntityID("0195461e-76a5-7b6a-9b5b-4afc902e1e90"),
    name: "City Nightscape",
    src: `${CdnBaseURL}/backgrounds/1.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-c2c8-7122-b5e5-ce2d6539a866"),
    name: "Command Center",
    src: `${CdnBaseURL}/backgrounds/2.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-e48f-769d-8a02-a27590c42c93"),
    name: "Candle Lounge",
    src: `${CdnBaseURL}/backgrounds/3.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-fc83-740d-99de-a3de3e1f7aa9"),
    name: "Grand Aquarium",
    src: `${CdnBaseURL}/backgrounds/4.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-13f7-76f8-a117-71313fb0d2b1"),
    name: "Spring Classroom",
    src: `${CdnBaseURL}/backgrounds/5.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-2eec-7f98-85fc-00e8f76f817b"),
    name: "Village Market",
    src: `${CdnBaseURL}/backgrounds/6.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-469b-7d89-ae2d-dd5ef885f09f"),
    name: "Twilight Castle",
    src: `${CdnBaseURL}/backgrounds/7.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-5f90-7f82-aebd-095153995c03"),
    name: "Tropical Beach",
    src: `${CdnBaseURL}/backgrounds/8.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-7b37-71ab-a1d2-26b0349c20e0"),
    name: "Serene Bus Stop",
    src: `${CdnBaseURL}/backgrounds/9.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-958c-7576-8f91-0e24baffc2db"),
    name: "Knight's Passage",
    src: `${CdnBaseURL}/backgrounds/10.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-ad5c-73f3-811b-9fa82dfd1b75"),
    name: "Golden Ascent",
    src: `${CdnBaseURL}/backgrounds/11.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-c447-715b-9bb9-5e1258f8e06a"),
    name: "Neon Journey",
    src: `${CdnBaseURL}/backgrounds/12.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-f99f-7e77-91f6-c81a1d5e69ec"),
    name: "Amber Archives",
    src: `${CdnBaseURL}/backgrounds/13.jpg`,
  },
  {
    id: new UniqueEntityID("01954620-13a9-7bcf-9e51-53dfd5b26c0c"),
    name: "Cyber Skyline",
    src: `${CdnBaseURL}/backgrounds/14.jpg`,
  },
  {
    id: new UniqueEntityID("01954620-2cba-7d6d-b6a7-c2177a8f6aea"),
    name: "Sunlit Classroom",
    src: `${CdnBaseURL}/backgrounds/15.jpg`,
  },
];

// Map for quick lookup of default backgrounds by ID
const defaultBackgroundMap = new Map<string, DefaultBackground>(
  defaultBackgrounds.map((bg) => [bg.id.toString(), bg]),
);

/**
 * Check if a background is a default (astrsk-provided) background
 */
export function isDefaultBackground(
  background: Background | DefaultBackground,
): background is DefaultBackground {
  return "src" in background;
}

/**
 * Get a default background by ID
 */
export function getDefaultBackground(
  id: UniqueEntityID,
): DefaultBackground | undefined {
  return defaultBackgroundMap.get(id.toString());
}

/**
 * Extract assetId from a Background object
 * Handles both domain object getters and raw serialized data from React Query
 */
export function getBackgroundAssetId(
  background: Background | DefaultBackground | null | undefined,
): UniqueEntityID | undefined {
  if (!background || isDefaultBackground(background)) return undefined;

  // Try getter first (works if domain object is intact)
  if (background.assetId instanceof UniqueEntityID) {
    return background.assetId;
  }

  // Fallback: access from props (raw serialized object)
  const rawAssetId = (background as any).props?.assetId;
  if (rawAssetId?.value) {
    return new UniqueEntityID(rawAssetId.value);
  }
  if (typeof rawAssetId === "string") {
    return new UniqueEntityID(rawAssetId);
  }

  return undefined;
}

/**
 * Background query factory for TanStack Query
 */
export const backgroundQueries = {
  all: () => ["backgrounds"] as const,

  // List user backgrounds by session
  lists: () => [...backgroundQueries.all(), "list"] as const,
  listBySession: (sessionId?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...backgroundQueries.lists(), sessionId?.toString() ?? ""],
      queryFn: async () => {
        if (!sessionId) return [];
        const result = await BackgroundService.listBackground.execute({
          sessionId,
          limit: 100,
        });
        if (result.isFailure) {
          console.error(result.getError());
          return [];
        }
        return result.getValue();
      },
      enabled: !!sessionId,
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      staleTime: 1000 * 30, // 30 seconds stale time
    }),

  // Get single background by ID
  details: () => [...backgroundQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...backgroundQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;

        // First check if it's a default background
        const defaultBg = getDefaultBackground(id);
        if (defaultBg) {
          return defaultBg;
        }

        // Otherwise fetch from database
        const result = await BackgroundService.getBackground.execute(id);
        if (result.isFailure) {
          return null;
        }
        return result.getValue();
      },
      enabled: !!id,
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      staleTime: 1000 * 30, // 30 seconds stale time
    }),
};
