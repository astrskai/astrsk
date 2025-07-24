import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { TurnService } from "@/app/services/turn-service";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";

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
        // Transform back to domain object
        return TurnDrizzleMapper.toDomain(data as any);
      },
      enabled: !!id,
    }),
};
