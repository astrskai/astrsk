import { queryClient } from "@/shared/api/query-client";
import {
  turnQueries,
  useTranslateTurn,
} from "@/entities/turn/api/turn-queries";
import { SessionService } from "@/app/services/session-service";
import { Session } from "@/entities/session/domain/session";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { Turn } from "@/entities/turn/domain/turn";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";
import { useMutation } from "@tanstack/react-query";
import { sessionQueries } from "./query-factory";

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
      // Get session from cache (don't refetch to preserve optimistic update)
      const sessionData = queryClient.getQueryData(
        sessionQueries.detail(sessionId).queryKey,
      );
      if (!sessionData) {
        throw new Error("Session not found in cache");
      }
      const session = SessionDrizzleMapper.toDomain(sessionData as any);

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

export const useDeleteSession = () => {
  return useMutation({
    mutationKey: ["session", "deleteSession"],
    mutationFn: async ({ sessionId }: { sessionId: UniqueEntityID }) => {
      const result = await SessionService.deleteSession.execute(sessionId);
      return result;
    },

    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate session list queries
      context.client.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });

      // Remove session detail cache
      context.client.removeQueries({
        queryKey: sessionQueries.detail(variables.sessionId).queryKey,
      });
    },

    onError: (error) => {
      logger.error("Failed to delete session", error);
    },
  });
};
