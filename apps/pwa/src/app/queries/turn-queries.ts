import { queryClient } from "@/app/queries/query-client";
import { TurnService } from "@/app/services/turn-service";
import { TranslationConfig } from "@/modules/session/domain/translation-config";
import { Turn } from "@/modules/turn/domain/turn";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";
import { queryOptions, useMutation } from "@tanstack/react-query";

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

/**
 * Helper functions to fetch turns from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchTurn(id: UniqueEntityID): Promise<Turn> {
  const data = await queryClient.fetchQuery(turnQueries.detail(id));
  if (!data) {
    throw new Error(`Turn not found: ${id.toString()}`);
  }
  return TurnDrizzleMapper.toDomain(data as any);
}

export async function fetchTurnOptional(
  id: UniqueEntityID,
): Promise<Turn | null> {
  try {
    return await fetchTurn(id);
  } catch {
    return null;
  }
}

/**
 * Mutations
 */

export const useUpdateTurn = () => {
  return useMutation({
    mutationFn: async ({ turn }: { turn: Turn }) => {
      const result = await TurnService.updateTurn.execute(turn);
      return result;
    },

    onMutate: async (variables, context) => {
      // Get query key
      const turnQueryKey = turnQueries.detail(variables.turn.id).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: turnQueryKey,
      });

      // Save previous data
      const previousTurn = context.client.getQueryData(turnQueryKey);

      // Optimistic update
      context.client.setQueryData(
        turnQueryKey,
        TurnDrizzleMapper.toPersistence(variables.turn),
      );

      return { previousTurn };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate updateTurn", error);

      // Get query key
      const turnQueryKey = turnQueries.detail(variables.turn.id).queryKey;

      // Rollback data
      context.client.setQueryData(turnQueryKey, onMutateResult?.previousTurn);
    },
  });
};

export const useTranslateTurn = () => {
  return useMutation({
    mutationFn: async ({
      turnId,
      config,
    }: {
      turnId: UniqueEntityID;
      config: TranslationConfig;
    }) => {
      const result = await TurnService.translateTurn.execute({
        turnId,
        config,
      });
      return result;
    },

    onMutate: async (variables, context) => {
      // Get query key
      const turnQueryKey = turnQueries.detail(variables.turnId).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: turnQueryKey,
      });

      // Save previous data
      const previousTurn = context.client.getQueryData(turnQueryKey);

      return { previousTurn };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate translateTurn", error);

      // Get query key
      const turnQueryKey = turnQueries.detail(variables.turnId).queryKey;

      // Rollback data
      context.client.setQueryData(turnQueryKey, onMutateResult?.previousTurn);
    },

    onSuccess: (data, variables, onMutateResult, context) => {
      // Get query key
      const turnQueryKey = turnQueries.detail(variables.turnId).queryKey;

      // Update cache
      if (data.isSuccess) {
        context.client.setQueryData(
          turnQueryKey,
          TurnDrizzleMapper.toPersistence(data.getValue()),
        );
      }
    },
  });
};
