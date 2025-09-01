import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { TurnService } from "@/app/services/turn-service";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";

// Select result cache for preventing unnecessary re-renders
// Maps query key to [persistenceData, transformedResult] tuple
const selectResultCache = new Map<string, [any, any]>();

export const turnQueries = {
  all: () => ["turns"] as const,

  details: () => [...turnQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...turnQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        const messageOrError = await TurnService.getTurn.execute(id);
        if (messageOrError.isFailure) return null;
        const turn = messageOrError.getValue();
        // Transform to persistence format for storage
        return TurnDrizzleMapper.toPersistence(turn);
      },
      select: (data) => {
        if (!data) return null;
        
        const queryKey = [...turnQueries.details(), id?.toString() ?? ""];
        const cacheKey = JSON.stringify(queryKey);
        
        const cached = selectResultCache.get(cacheKey);
        if (cached) {
          const [cachedData, cachedResult] = cached;
          if (JSON.stringify(cachedData) === JSON.stringify(data)) {
            return cachedResult;
          }
        }
        
        // Transform new data
        const result = TurnDrizzleMapper.toDomain(data as any);
        
        // Cache both persistence data and transformed result
        selectResultCache.set(cacheKey, [data, result]);
        
        return result;
      },
      enabled: !!id,
    }),
};
