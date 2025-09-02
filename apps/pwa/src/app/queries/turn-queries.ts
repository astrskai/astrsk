import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { TurnService } from "@/app/services/turn-service";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

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
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = TurnDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
    }),
};
