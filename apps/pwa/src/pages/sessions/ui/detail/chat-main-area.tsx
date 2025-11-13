import { useCallback, useRef, useState } from "react";
import { cloneDeep } from "lodash-es";
import { toast } from "sonner";

import ChatInput from "./chat-input";
import ChatMessageList from "./chat-message-list";

import {
  createMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { Session } from "@/entities/session/domain";
import { Turn } from "@/entities/turn/domain/turn";
import {
  fetchTurn,
  turnQueries,
  useUpdateTurn,
} from "@/entities/turn/api/turn-queries";
import { DataStoreSavedField, Option } from "@/entities/turn/domain/option";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { fetchCharacterCard } from "@/entities/card/api/query-factory";
import {
  sessionQueries,
  useAddMessage,
  useDeleteMessage,
  useSaveSession,
} from "@/entities/session/api";

import { UniqueEntityID } from "@/shared/domain";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { queryClient } from "@/shared/api/query-client";
import { parseAiSdkErrorMessage } from "@/shared/lib/error-utils";
import { logger } from "@/shared/lib/logger";

interface ChatMainAreaProps {
  data: Session;
}

export default function ChatMainArea({ data }: ChatMainAreaProps) {
  const [streamingMessageId, setStreamingMessageId] =
    useState<UniqueEntityID | null>(null);
  const [streamingAgentName, setStreamingAgentName] = useState<string>("");
  const [streamingModelName, setStreamingModelName] = useState<string>("");
  const refStopGenerate = useRef<AbortController | null>(null);

  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(data.id).queryKey,
    });
  }, [data.id]);

  // Mutations
  const saveSessionMutation = useSaveSession();
  const addMessageMutation = useAddMessage(data.id);
  const deleteMessageMutation = useDeleteMessage(data.id);
  const updateTurnMutation = useUpdateTurn();

  console.log(data);

  const generateCharacterMessage = useCallback(
    async (
      characterId: UniqueEntityID,
      regenerateMessageId?: UniqueEntityID,
    ) => {
      let streamingMessage: Turn | null = null;
      let streamingContent = "";
      let streamingVariables = {};

      try {
        // Get dataStore for inheritance - prioritize regeneration context
        let lastDataStore: DataStoreSavedField[] = [];

        if (regenerateMessageId) {
          // For regeneration, get dataStore from the turn before the regenerated message
          let dataStoreForRegeneration: DataStoreSavedField[] = [];

          for (const turnId of data.turnIds) {
            if (turnId.equals(regenerateMessageId)) {
              break;
            }
            try {
              const turn = await fetchTurn(turnId);

              // Store dataStore from each processed turn
              if (turn.dataStore && turn.dataStore.length > 0) {
                dataStoreForRegeneration = cloneDeep(turn.dataStore);
              }
            } catch (error) {
              console.warn(
                `Failed to get turn for regeneration dataStore: ${error}`,
              );
              continue;
            }
          }

          lastDataStore = dataStoreForRegeneration;
          console.log(
            `Using dataStore from regeneration context (${lastDataStore.length} fields)`,
          );
        } else if (data.turnIds.length > 0) {
          // For new messages, use last turn's dataStore
          const lastTurnId = data.turnIds[data.turnIds.length - 1];
          try {
            const lastTurn = await fetchTurn(lastTurnId);
            lastDataStore = cloneDeep(lastTurn.dataStore);
          } catch (error) {
            console.warn(`Failed to get last turn's dataStore: ${error}`);
          }
        }

        // Get streaming message
        if (regenerateMessageId) {
          // Get message from database
          streamingMessage = await fetchTurn(regenerateMessageId);
        } else {
          // Get character name
          const character = await fetchCharacterCard(characterId);

          // Create new empty message
          const messageOrError = Turn.create({
            sessionId: data.id,
            characterCardId: characterId,
            characterName: character.props.name,
            options: [],
          });
          if (messageOrError.isFailure) {
            throw new Error(messageOrError.getError());
          }
          streamingMessage = messageOrError.getValue();
        }

        // Add new empty option with inherited dataStore
        const emptyOptionOrError = Option.create({
          content: "",
          tokenSize: 0,
          dataStore: lastDataStore,
        });
        if (emptyOptionOrError.isFailure) {
          throw new Error(emptyOptionOrError.getError());
        }
        streamingMessage.addOption(emptyOptionOrError.getValue());

        // Set query cache
        queryClient.setQueryData(
          turnQueries.detail(streamingMessage.id).queryKey,
          TurnDrizzleMapper.toPersistence(streamingMessage),
        );

        // Add new empty message to session
        // Use mutateAsync to ensure session.turnIds is updated before setting streamingMessageId
        if (!regenerateMessageId) {
          await addMessageMutation.mutateAsync({
            sessionId: data.id,
            message: streamingMessage,
          });
        }

        // Set streaming message id (now session.turnIds includes this message)
        setStreamingMessageId(streamingMessage.id);
        //  scrollToBottom({ behavior: "smooth" }); // TODO: check if this is needed

        // Execute flow
        refStopGenerate.current = new AbortController();
        const flowResult = executeFlow({
          flowId: data.props.flowId,
          sessionId: data.id,
          characterCardId: characterId,
          regenerateMessageId: regenerateMessageId,
          stopSignalByUser: refStopGenerate.current.signal,
        });

        // Stream response
        let streamingMetadata: Record<string, any> | undefined;
        for await (const response of flowResult) {
          streamingContent = response.content;
          streamingMessage.setContent(streamingContent);
          streamingVariables = response.variables;
          streamingMessage.setVariables(streamingVariables);

          // Capture metadata for error reporting
          if (response.metadata) {
            streamingMetadata = response.metadata;
          }

          if (response.dataStore) {
            streamingMessage.setDataStore(response.dataStore);
          }
          queryClient.setQueryData(
            turnQueries.detail(streamingMessage.id).queryKey,
            TurnDrizzleMapper.toPersistence(streamingMessage),
          );
          setStreamingAgentName(response.agentName ?? "");
          setStreamingModelName(response.modelName ?? "");

          // TODO: check if this is needed
          //  if (!regenerateMessageId) {
          //    scrollToBottom({ behavior: "smooth" });
          //  }
          if (response.translations) {
            for (const [lang, translation] of response.translations) {
              streamingMessage.setTranslation(lang, translation);
            }
          }
        }

        // Check empty message
        if (streamingContent.trim() === "") {
          // Error checking only - validate structured output response format
          if (
            streamingVariables &&
            Object.keys(streamingVariables).length > 0
          ) {
            const vars = streamingVariables as Record<string, any>;

            // Look through all agent outputs for error conditions
            for (const agentKey in vars) {
              const agentOutput = vars[agentKey];

              if (!agentOutput || typeof agentOutput !== "object") continue;

              // ERROR CHECK 1: Detect schema definition (malformed response)
              if (agentOutput.type && agentOutput.properties) {
                const error = new Error(
                  "Malformed structured output: AI returned schema definition instead of data",
                ) as any;
                error.metadata = streamingMetadata;
                throw error;
              }
            }

            // ERROR CHECK 2: Empty response (no valid content)
            const error = new Error(
              "AI returned empty or invalid structured output",
            ) as any;
            error.metadata = streamingMetadata;
            throw error;
          } else {
            throw new Error("AI returned an empty message.");
          }
        }

        // Update message to database
        updateTurnMutation.mutate({
          turn: streamingMessage,
        });
      } catch (error) {
        // Notify error to user
        const parsedError = parseAiSdkErrorMessage(error);
        if (parsedError) {
          if (parsedError.level === "error") {
            toast.error("Failed to generate message", {
              description: parsedError.message,
            });
          }
        } else if (error instanceof Error) {
          if (error.message.includes("Stop generate by user")) {
            toast.info("Generation stopped.");
          } else {
            // Build error details
            const errorDetails: any = {
              name: error.name,
              message: error.message,
              stack: error.stack,
            };

            // If error has metadata (from AI SDK), include it
            // Note: metadata.object contains the full structured output response
            if ("metadata" in error && (error as any).metadata) {
              errorDetails.metadata = (error as any).metadata;
            }

            toast.error("Failed to generate message", {
              description: JSON.stringify(errorDetails, null, 2),
            });
          }
        }
        logger.error("Failed to generate message", error);

        // Check streaming message exists
        if (streamingMessage) {
          // Delete empty streaming message or option
          if (streamingContent.trim() === "") {
            if (regenerateMessageId) {
              // Refetch message
              queryClient.invalidateQueries({
                queryKey: turnQueries.detail(regenerateMessageId).queryKey,
              });
            } else {
              // Delete empty message
              await deleteMessageMutation.mutateAsync({
                sessionId: data.id,
                messageId: streamingMessage.id,
              });
            }
          } else {
            // Update message to database
            updateTurnMutation.mutate({
              turn: streamingMessage,
            });
          }
        }
      } finally {
        setStreamingMessageId(null);
        setStreamingAgentName("");
        setStreamingModelName("");
        refStopGenerate.current = null;

        // Invalidate session
        invalidateSession();
      }
    },
    [
      data.id,
      addMessageMutation,
      deleteMessageMutation,
      updateTurnMutation,
      invalidateSession,
      data.props.flowId,
      data.turnIds,
    ],
  );

  const autoReply = data?.autoReply;

  const handleSendMessage = useCallback(
    async (messageContent: string) => {
      try {
        // Check session
        if (!data) {
          throw new Error("Session not found");
        }

        // Create user message
        const userMessage = (
          await createMessage({
            sessionId: data.id,
            characterCardId: data.userCharacterCardId,
            defaultCharacterName: "User",
            messageContent: messageContent,
          })
        )
          .throwOnFailure()
          .getValue();

        // Add user message
        (
          await addMessageMutation.mutateAsync({
            sessionId: data.id,
            message: userMessage,
          })
        ).throwOnFailure();

        // Scroll to bottom
        // scrollToBottom({ behavior: "smooth" });

        // Auto reply
        switch (autoReply) {
          // No auto reply
          case AutoReply.Off:
            break;

          // Random character reply
          case AutoReply.Random: {
            const randomIndex = Math.floor(
              Math.random() * data.aiCharacterCardIds.length,
            );
            const randomCharacterCardId = data.aiCharacterCardIds[randomIndex];
            generateCharacterMessage(randomCharacterCardId);
            break;
          }

          // All characters reply by order
          case AutoReply.Rotate: {
            for (const charId of data.aiCharacterCardIds) {
              await generateCharacterMessage(charId);
            }
            break;
          }

          default:
            throw new Error("Unknown auto reply");
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to add user message", {
            description: JSON.stringify(
              {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
              null,
              2,
            ),
          });
        }
        logger.error("Failed to add user message", error);
      }
    },
    [addMessageMutation, data, autoReply, generateCharacterMessage],
  );

  const handleStopGenerate = useCallback(() => {
    refStopGenerate.current?.abort("Stop generate by user");
  }, []);

  return (
    <div className="mx-auto flex h-dvh max-w-5xl flex-1 flex-col items-center justify-end md:justify-center">
      <ChatMessageList
        data={data}
        streamingMessageId={streamingMessageId}
        streamingAgentName={streamingAgentName}
        streamingModelName={streamingModelName}
      />

      <ChatInput
        className="shrink-0"
        aiCharacterIds={data.aiCharacterCardIds}
        userCharacterId={data.userCharacterCardId}
        generateCharacterMessage={generateCharacterMessage}
        streamingMessageId={streamingMessageId}
        onStopGenerate={handleStopGenerate}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
