import { queryClient } from "@/app/queries/query-client";
import { turnQueries, useTranslateTurn } from "@/app/queries/turn-queries";
import { SessionService } from "@/app/services/session-service";
import { Session } from "@/modules/session/domain/session";
import { SessionDrizzleMapper } from "@/modules/session/mappers/session-drizzle-mapper";
import { SearchSessionsQuery } from "@/modules/session/repos";
import { Turn } from "@/modules/turn/domain/turn";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";
import { queryOptions, useMutation } from "@tanstack/react-query";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

export const sessionQueries = {
  all: () => ["sessions"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...sessionQueries.all(), "list"] as const,
  list: (query: SearchSessionsQuery) =>
    queryOptions({
      queryKey: [...sessionQueries.lists(), query],
      queryFn: async () => {
        const result = await SessionService.searchSession.execute(query);
        if (result.isFailure) {
          console.error(result.getError());
          return [];
        }
        const sessions = result.getValue();

        // Store each session in detail cache
        sessions.forEach((session) => {
          queryClient.setQueryData(
            sessionQueries.detail(session.id).queryKey,
            SessionDrizzleMapper.toPersistence(session),
          );
        });

        // Return persistence objects for caching
        return sessions.map((session) =>
          SessionDrizzleMapper.toPersistence(session),
        );
      },
      select: (data) => {
        if (!data || !Array.isArray(data)) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = data.map((session) =>
          SessionDrizzleMapper.toDomain(session as any),
        );
        selectResultCache.set(data as object, result);
        return result;
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Detail queries - cached for reuse
  details: () => [...sessionQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...sessionQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const sessionOrError = await SessionService.getSession.execute(id);
        if (sessionOrError.isFailure) return null;
        const session = sessionOrError.getValue();
        // Transform to persistence format for storage
        return SessionDrizzleMapper.toPersistence(session);
      },
      select: (data) => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = SessionDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
    }),
};

/**
 * Helper functions to fetch sessions from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchSession(id: UniqueEntityID): Promise<Session> {
  const data = await queryClient.fetchQuery(sessionQueries.detail(id));
  if (!data) {
    throw new Error(`Session not found: ${id.toString()}`);
  }
  return SessionDrizzleMapper.toDomain(data as any);
}

/**
 * Mutations
 */

export const useSaveSession = () => {
  return useMutation({
    mutationKey: ["session", "saveSession"],
    mutationFn: async ({ session }: { session: Session }) => {
      const result = await SessionService.saveSession.execute({
        session,
      });
      return result;
    },

    onMutate: async (variables, context) => {
      // Get query key
      const sessionQueryKey = sessionQueries.detail(
        variables.session.id,
      ).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);

      // Optimistic update
      context.client.setQueryData(
        sessionQueryKey,
        SessionDrizzleMapper.toPersistence(variables.session),
      );

      return { previousSession };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate saveSession", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(
        variables.session.id,
      ).queryKey;

      // Rollback data
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );
    },
  });
};

export const useAddMessage = (sessionId: UniqueEntityID) => {
  const translateTurn = useTranslateTurn();

  return useMutation({
    mutationKey: ["session", sessionId.toString(), "addMessage"],
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: UniqueEntityID;
      message: Turn;
    }) => {
      // Get session
      const session = await fetchSession(sessionId);

      // Add message
      const sessionAndMessage = (
        await SessionService.addMessage.execute({
          sessionId: sessionId,
          message: message,
        })
      )
        .throwOnFailure()
        .getValue();

      // Translate message
      if (message.content.trim() !== "" && session.translation) {
        (
          await translateTurn.mutateAsync({
            turnId: sessionAndMessage.message.id,
            config: session.translation,
          })
        ).throwOnFailure();
      }

      return Result.ok(sessionAndMessage.message);
    },

    onMutate: async (variables, context) => {
      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;
      const turnQueryKey = turnQueries.detail(variables.message.id).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);

      // Optimistic update
      context.client.setQueryData(
        turnQueryKey,
        TurnDrizzleMapper.toPersistence(variables.message),
      );
      context.client.setQueryData(sessionQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          turn_ids: [...old.turn_ids, variables.message.id.toString()],
        };
      });

      return { previousSession };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate addMessage", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;
      const turnQueryKey = turnQueries.detail(variables.message.id).queryKey;

      // Rollback data
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );
      context.client.removeQueries({
        queryKey: turnQueryKey,
      });
    },
  });
};

export const useDeleteMessage = (sessionId: UniqueEntityID) => {
  return useMutation({
    mutationKey: ["session", sessionId.toString(), "deleteMessage"],
    mutationFn: async ({
      sessionId,
      messageId,
    }: {
      sessionId: UniqueEntityID;
      messageId: UniqueEntityID;
    }) => {
      // Delete message
      const result = await SessionService.deleteMessage.execute({
        sessionId: sessionId,
        messageId: messageId,
      });
      return result;
    },

    onMutate: async (variables, context) => {
      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);

      // Optimistic update
      const deletedTurnId = variables.messageId.toString();
      context.client.setQueryData(sessionQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          turn_ids: old.turn_ids.filter((id) => id !== deletedTurnId),
        };
      });

      return { previousSession };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate deleteMessage", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;

      // Rollback data
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );
    },

    onSuccess: (data, variables, onMutateResult, context) => {
      // Get query key
      const turnQueryKey = turnQueries.detail(variables.messageId).queryKey;

      // Delete turn cache
      context.client.removeQueries({
        queryKey: turnQueryKey,
      });
    },
  });
};
