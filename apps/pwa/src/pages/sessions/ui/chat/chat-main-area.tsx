import { useCallback, useRef, useState, useEffect } from "react";
import { cloneDeep } from "lodash-es";
import { toastError, toastInfo } from "@/shared/ui/toast";

import ChatInput from "./chat-input";
import ChatMessageList from "./chat-message-list";
import { showErrorDetails } from "@/shared/stores/error-dialog-store";

import {
  createMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { Session } from "@/entities/session/domain";
import { Turn } from "@/entities/turn/domain/turn";
import {
  fetchTurn,
  fetchTurnOptional,
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
} from "@/entities/session/api";

import { UniqueEntityID } from "@/shared/domain";
import { AutoReply } from "@/shared/stores/session-store";
import { queryClient } from "@/shared/api/query-client";
import { parseAiSdkErrorMessage } from "@/shared/lib/error-utils";
import { logger } from "@/shared/lib/logger";
import { TurnService } from "@/app/services/turn-service";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { useCard } from "@/shared/hooks/use-card";
import { cn } from "@/shared/lib";
import SelectScenarioDialog from "./select-scenario-dialog";
import { TemplateRenderer } from "@/shared/lib/template-renderer";

interface ChatMainAreaProps {
  data: Session;
  onAutoReply: () => void;
  isOpenStats: boolean;
  onOpenStats: (isOpen: boolean) => void;
}

export default function ChatMainArea({
  data,
  onAutoReply,
  isOpenStats,
  onOpenStats,
}: ChatMainAreaProps) {
  const [isOpenSelectScenarioModal, setIsOpenSelectScenarioModal] =
    useState<boolean>(false);
  // Add plot card modal
  const [plotCard] = useCard<PlotCard>(data?.plotCard?.id);
  const messageCount = data?.turnIds.length ?? 0;
  const plotCardId = data?.plotCard?.id.toString() ?? "";
  const plotCardScenarioCount = plotCard?.props.scenarios?.length ?? 0;
  // Render scenario
  const [renderedScenarios, setRenderedScenarios] = useState<
    {
      name: string;
      description: string;
    }[]
  >([]);

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
  const addMessageMutation = useAddMessage(data.id);
  const deleteMessageMutation = useDeleteMessage(data.id);
  const updateTurnMutation = useUpdateTurn();

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
              logger.warn(
                `Failed to get turn for regeneration dataStore: ${error}`,
              );
              continue;
            }
          }

          lastDataStore = dataStoreForRegeneration;
          logger.info(
            `Using dataStore from regeneration context (${lastDataStore.length} fields)`,
          );
        } else if (data.turnIds.length > 0) {
          // For new messages, use last turn's dataStore
          const lastTurnId = data.turnIds[data.turnIds.length - 1];

          try {
            const lastTurn = await fetchTurn(lastTurnId);
            lastDataStore = cloneDeep(lastTurn.dataStore);
          } catch (error) {
            logger.warn(`Failed to get last turn's dataStore: ${error}`);
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

        // Update message to database and scroll to bottom after completion
        await updateTurnMutation.mutateAsync({
          turn: streamingMessage,
        });
      } catch (error) {
        // Notify error to user
        const parsedError = parseAiSdkErrorMessage(error);
        if (parsedError) {
          if (parsedError.level === "error") {
            toastError("Failed to generate message", {
              description: parsedError.message,
              action: {
                label: "View details",
                onClick: () => {
                  showErrorDetails(
                    "Failed to generate message",
                    parsedError.message,
                  );
                },
              },
            });
          } else {
            toastInfo(parsedError.message);
          }
        } else if (error instanceof Error) {
          if (error.message.includes("Stop generate by user")) {
            toastInfo("Generation stopped.");
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

            const errorDetailsStr = JSON.stringify(errorDetails, null, 2);
            toastError("Failed to generate message", {
              description: errorDetailsStr,
              action: {
                label: "View details",
                onClick: () => {
                  showErrorDetails(
                    "Failed to generate message",
                    errorDetailsStr,
                  );
                },
              },
            });
          }
        }
        logger.error("Failed to generate message", error);

        // Clean up failed message
        if (streamingMessage) {
          if (regenerateMessageId) {
            // Regenerate case: invalidate to restore original message
            queryClient.invalidateQueries({
              queryKey: turnQueries.detail(regenerateMessageId).queryKey,
            });
          } else {
            // New message case: delete failed message regardless of content
            await deleteMessageMutation.mutateAsync({
              sessionId: data.id,
              messageId: streamingMessage.id,
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
        switch (data.autoReply) {
          // No auto reply
          case AutoReply.Off:
            break;

          // Random character reply
          case AutoReply.Random: {
            if (data.aiCharacterCardIds.length === 0) {
              toastError("No characters available");
              break;
            }

            const randomIndex = Math.floor(
              Math.random() * data.aiCharacterCardIds.length,
            );
            const randomCharacterCardId = data.aiCharacterCardIds[randomIndex];
            await generateCharacterMessage(randomCharacterCardId);
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
          toastError("Failed to add user message", {
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
    [addMessageMutation, data, generateCharacterMessage],
  );

  const handleStopGenerate = useCallback(() => {
    refStopGenerate.current?.abort("Stop generate by user");
  }, []);

  // Edit message
  const handleEditMessage = useCallback(
    async (messageId: UniqueEntityID, content: string) => {
      // Get message from DB
      const message = await fetchTurn(messageId);

      // Set content
      message.setContent(content);

      // Save message to DB
      updateTurnMutation.mutate({
        turn: message,
      });
    },
    [updateTurnMutation],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: UniqueEntityID) => {
      // Check if this is a placeholder turn and handle special deletion
      const turnOrNull = await fetchTurnOptional(messageId);

      if (turnOrNull) {
        const turn = turnOrNull;
        if (TurnService.isPlaceholderTurn(turn)) {
          // Use special deletion for placeholder turns with assets
          const deleteResult =
            await TurnService.deletePlaceholderTurnWithAssets(
              data.id,
              messageId,
            );
          if (deleteResult.isFailure) {
            logger.error(
              "Failed to delete placeholder turn",
              deleteResult.getError(),
            );
            return;
          }
          // Invalidate session query
          invalidateSession();
          return;
        }
      }

      // Regular message deletion
      deleteMessageMutation.mutate(
        {
          sessionId: data.id,
          messageId: messageId,
        },
        {
          onError: (error) => {
            logger.error("Failed to delete message", error);
          },
        },
      );
    },
    [data.id, deleteMessageMutation, invalidateSession],
  );

  const handleRegenerateMessage = useCallback(
    async (messageId: UniqueEntityID) => {
      // Generate option
      const message = await fetchTurn(messageId);
      await generateCharacterMessage(message.characterCardId!, messageId);
    },
    [generateCharacterMessage],
  );

  const handleAddScenario = useCallback(
    async (scenarioIndex: number) => {
      // Check session
      if (!data) {
        return;
      }
      // Get selected scenario
      const scenario = renderedScenarios?.[scenarioIndex];
      if (!scenario) {
        return;
      }
      try {
        // Create scenario message
        const scenarioMessage = (
          await createMessage({
            sessionId: data.id,
            messageContent: scenario.description,
          })
        )
          .throwOnFailure()
          .getValue();

        // Add scenario
        const scenarioMessageOrError = await addMessageMutation.mutateAsync({
          sessionId: data.id,
          message: scenarioMessage,
        });
        if (scenarioMessageOrError.isFailure) {
          const errorMsg = scenarioMessageOrError.getError();
          toastError("Failed to add scenario", {
            description: errorMsg,
            action: {
              label: "View details",
              onClick: () => {
                showErrorDetails("Failed to add scenario", errorMsg);
              },
            },
          });
          return;
        }

        // Close modal first to prevent flickering
        setIsOpenSelectScenarioModal(false);

        // Invalidate session to refetch with new message
        invalidateSession();
      } finally {
        // Modal handles its own loading state
      }
    },
    [addMessageMutation, invalidateSession, renderedScenarios, data],
  );

  const renderScenarios = useCallback(async () => {
    logger.debug("[Hook] useEffect: Render scenario");

    // Check session and plot card
    if (!data || !plotCard) {
      return;
    }

    // If no scenarios, set empty array
    if (!plotCard.props.scenarios || plotCard.props.scenarios.length === 0) {
      setRenderedScenarios([]);
      return;
    }

    // Create context
    const contextOrError = await makeContext({
      session: data,
      characterCardId: data.aiCharacterCardIds[0],
      includeHistory: false,
    });
    if (contextOrError.isFailure) {
      logger.error("Failed to create context", contextOrError.getError());
      return;
    }
    const context = contextOrError.getValue();

    // Replace undefined to variables
    if (!context.char) {
      context.char = {
        id: "{{char.id}}",
        name: "{{char.name}}",
        description: "{{char.description}}",
        example_dialog: "{{char.example_dialog}}",
        entries: [],
      };
    }
    if (!context.user) {
      context.user = {
        id: "{{user.id}}",
        name: "{{user.name}}",
        description: "{{user.description}}",
        example_dialog: "{{user.example_dialog}}",
        entries: [],
      };
    }

    // Render scenarios
    const renderedScenarios = await Promise.all(
      plotCard.props.scenarios.map(
        async (scenario: { name: string; description: string }) => {
          const renderedScenario = await TemplateRenderer.render(
            scenario.description,
            context,
          );
          return {
            name: scenario.name,
            description: renderedScenario,
          };
        },
      ),
    );
    setRenderedScenarios(renderedScenarios);
  }, [data, plotCard]);

  useEffect(() => {
    // Check scenario count
    if (plotCardScenarioCount === 0) {
      setIsOpenSelectScenarioModal(false);
      return;
    }

    // Check message ids
    if (messageCount > 0) {
      setIsOpenSelectScenarioModal(false);
      return;
    }

    // Show select scenario modal
    setIsOpenSelectScenarioModal(true);
  }, [plotCardScenarioCount, messageCount]);

  return (
    <div className="mx-auto flex h-dvh max-w-5xl flex-1 flex-col items-center justify-end pt-12 md:justify-center">
      <ChatMessageList
        data={data}
        streamingMessageId={streamingMessageId}
        streamingAgentName={streamingAgentName}
        streamingModelName={streamingModelName}
        chatStyles={data.chatStyles}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onRegenerateMessage={handleRegenerateMessage}
      />

      <ChatInput
        className="shrink-0 md:mb-4"
        aiCharacterIds={data.aiCharacterCardIds}
        userCharacterId={data.userCharacterCardId}
        autoReply={data.autoReply}
        generateCharacterMessage={generateCharacterMessage}
        streamingMessageId={streamingMessageId}
        isOpenStats={isOpenStats}
        onOpenStats={onOpenStats}
        onStopGenerate={handleStopGenerate}
        onSendMessage={handleSendMessage}
        onAutoReply={onAutoReply}
      />

      {/* Select Scenario Dialog */}
      <SelectScenarioDialog
        open={isOpenSelectScenarioModal}
        onSkip={() => {
          setIsOpenSelectScenarioModal(false);
        }}
        onAdd={handleAddScenario}
        renderedScenarios={renderedScenarios}
        onRenderScenarios={renderScenarios}
        sessionId={data.id.toString()}
        plotCardId={plotCardId}
      />
    </div>
  );
}
