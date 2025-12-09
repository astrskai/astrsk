import { queryClient } from "@/shared/api/query-client";
import {
  turnQueries,
  useTranslateTurn,
} from "@/entities/turn/api/turn-queries";
import { SessionService } from "@/app/services/session-service";
import { Session } from "@/entities/session/domain/session";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { SessionListItem } from "@/entities/session/repos";
import { Turn } from "@/entities/turn/domain/turn";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";
import { useMutation } from "@tanstack/react-query";
import { sessionQueries } from "./query-factory";
import { cardQueries } from "@/entities/card/api/card-queries";
import { flowQueries } from "@/entities/flow/api/flow-queries";

/**
 * Helper to update a session in the listItems cache
 * Updates the item and moves it to the top (sorted by updatedAt desc)
 */
function updateSessionListItem(
  sessionId: string,
  updates: Partial<Pick<SessionListItem, "title" | "messageCount" | "updatedAt">>,
) {
  const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;
  queryClient.setQueryData<SessionListItem[]>(listItemQueryKey, (oldData) => {
    if (!oldData) return oldData;

    const existingIndex = oldData.findIndex((item) => item.id === sessionId);
    if (existingIndex === -1) return oldData;

    // Update the item
    const updatedItem: SessionListItem = {
      ...oldData[existingIndex],
      ...updates,
      updatedAt: updates.updatedAt || new Date(),
    };

    // Remove from current position and add to top (most recently updated first)
    const newData = oldData.filter((_, i) => i !== existingIndex);
    return [updatedItem, ...newData];
  });
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
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);
      const previousListItems = context.client.getQueryData<SessionListItem[]>(listItemQueryKey);

      // Optimistic update - session detail
      context.client.setQueryData(
        sessionQueryKey,
        SessionDrizzleMapper.toPersistence(variables.session),
      );

      // Optimistic update - listItems (update title and move to top)
      updateSessionListItem(variables.session.id.toString(), {
        title: variables.session.props.title,
        updatedAt: new Date(),
      });

      return { previousSession, previousListItems };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate saveSession", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(
        variables.session.id,
      ).queryKey;
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Rollback session detail
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );

      // Rollback listItems
      if (onMutateResult?.previousListItems) {
        context.client.setQueryData(listItemQueryKey, onMutateResult.previousListItems);
      }
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
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);
      const previousListItems = context.client.getQueryData<SessionListItem[]>(listItemQueryKey);

      // Optimistic update - turn detail
      context.client.setQueryData(
        turnQueryKey,
        TurnDrizzleMapper.toPersistence(variables.message),
      );

      // Optimistic update - session detail
      context.client.setQueryData(sessionQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          turn_ids: [...old.turn_ids, variables.message.id.toString()],
          updated_at: new Date(),
        };
      });

      // Optimistic update - listItems (update messageCount and move to top)
      const currentMessageCount = previousSession?.turn_ids?.length ?? 0;
      updateSessionListItem(sessionId.toString(), {
        messageCount: currentMessageCount + 1,
        updatedAt: new Date(),
      });

      return { previousSession, previousListItems };
    },

    onError: (error, variables, onMutateResult, context) => {
      logger.error("Failed to mutate addMessage", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;
      const turnQueryKey = turnQueries.detail(variables.message.id).queryKey;
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Rollback session detail
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );
      context.client.removeQueries({
        queryKey: turnQueryKey,
      });

      // Rollback listItems
      if (onMutateResult?.previousListItems) {
        context.client.setQueryData(listItemQueryKey, onMutateResult.previousListItems);
      }
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
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Cancel queries
      await context.client.cancelQueries({
        queryKey: sessionQueryKey,
      });

      // Save previous data
      const previousSession = context.client.getQueryData(sessionQueryKey);
      const previousListItems = context.client.getQueryData<SessionListItem[]>(listItemQueryKey);

      // Optimistic update - session detail
      const deletedTurnId = variables.messageId.toString();
      context.client.setQueryData(sessionQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          turn_ids: old.turn_ids.filter((id) => id !== deletedTurnId),
          updated_at: new Date(),
        };
      });

      // Optimistic update - listItems (decrease messageCount and move to top)
      const currentMessageCount = previousSession?.turn_ids?.length ?? 0;
      updateSessionListItem(sessionId.toString(), {
        messageCount: Math.max(0, currentMessageCount - 1),
        updatedAt: new Date(),
      });

      return { previousSession, previousListItems };
    },

    onError: (error, _variables, onMutateResult, context) => {
      logger.error("Failed to mutate deleteMessage", error);

      // Get query key
      const sessionQueryKey = sessionQueries.detail(sessionId).queryKey;
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;

      // Rollback session detail
      context.client.setQueryData(
        sessionQueryKey,
        onMutateResult?.previousSession,
      );

      // Rollback listItems
      if (onMutateResult?.previousListItems) {
        context.client.setQueryData(listItemQueryKey, onMutateResult.previousListItems);
      }
    },

    onSuccess: (_data, variables, _onMutateResult, context) => {
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

      // Throw error if deletion failed
      if (result.isFailure) {
        throw new Error(result.getError());
      }

      // Result<void> has no value, just return undefined on success
      return;
    },

    onSuccess: (_data, variables, _onMutateResult, context) => {
      // Only runs on successful deletion
      // Invalidate session list queries
      context.client.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });

      // Remove from listItems cache (optimistic removal)
      const listItemQueryKey = sessionQueries.listItem({ isPlaySession: true }).queryKey;
      context.client.setQueryData<SessionListItem[]>(listItemQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((item) => item.id !== variables.sessionId.toString());
      });

      // Remove session detail cache
      context.client.removeQueries({
        queryKey: sessionQueries.detail(variables.sessionId).queryKey,
      });

      // Invalidate card and flow lists (CASCADE DELETE removes session-local resources)
      context.client.invalidateQueries({
        queryKey: cardQueries.lists(),
      });
      context.client.invalidateQueries({
        queryKey: flowQueries.lists(),
      });
    },

    onError: (error) => {
      logger.error("Failed to delete session", error);
    },
  });
};

/**
 * Hook for cloning a session (Save as asset)
 * Clones the session without history and sets is_play_session to false
 */
export const useCloneSession = () => {
  return useMutation({
    mutationKey: ["session", "cloneSession"],
    mutationFn: async ({
      sessionId,
      includeHistory = false,
    }: {
      sessionId: UniqueEntityID;
      includeHistory?: boolean;
    }) => {
      const result = await SessionService.cloneSession.execute({
        sessionId,
        includeHistory,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return result.getValue();
    },

    onSuccess: (clonedSession, _variables, _onMutateResult, context) => {
      // Set the cloned session data in cache
      context.client.setQueryData(
        sessionQueries.detail(clonedSession.id).queryKey,
        SessionDrizzleMapper.toPersistence(clonedSession),
      );

      // Invalidate session list queries
      context.client.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });

      // Invalidate card and flow lists (new resources were cloned)
      context.client.invalidateQueries({
        queryKey: cardQueries.lists(),
      });
      context.client.invalidateQueries({
        queryKey: flowQueries.lists(),
      });
    },

    onError: (error) => {
      logger.error("Failed to clone session", error);
    },
  });
};

export const useImportSessionFromCloud = () => {
  return useMutation({
    mutationKey: ["session", "importFromCloud"],
    mutationFn: async ({
      sessionId,
      agentModelOverrides,
    }: {
      sessionId: string;
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >;
    }) => {
      const result = await SessionService.importSessionFromCloud.execute({
        sessionId,
        agentModelOverrides,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return result.getValue();
    },

    onSuccess: (session, _variables, _onMutateResult, context) => {
      // Set the session data in cache
      context.client.setQueryData(
        sessionQueries.detail(session.id).queryKey,
        SessionDrizzleMapper.toPersistence(session),
      );

      // Invalidate session list queries
      context.client.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });

      // Invalidate card and flow lists (new resources were imported)
      context.client.invalidateQueries({
        queryKey: cardQueries.lists(),
      });
      context.client.invalidateQueries({
        queryKey: flowQueries.lists(),
      });
    },

    onError: (error) => {
      logger.error("Failed to import session from cloud", error);
    },
  });
};
