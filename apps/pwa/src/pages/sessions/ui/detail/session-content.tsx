import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Database } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";
import { parseAiSdkErrorMessage } from "@/shared/lib/error-utils";
import { logger } from "@/shared/lib/logger";
import { TemplateRenderer } from "@/shared/lib/template-renderer";
import { cloneDeep } from "lodash-es";

import { useCard } from "@/shared/hooks/use-card";
import { useImageGeneration } from "@/pages/assets/characters/panel/image-generator/hooks/use-image-generation";
import { useVideoGeneration } from "@/pages/assets/characters/panel/image-generator/hooks/use-video-generation";
import { useEnhancedGenerationPrompt } from "@/features/session/hooks/use-enhanced-generation-prompt";
import { IMAGE_MODELS } from "@/shared/stores/model-store";
import { flowQueries } from "@/app/queries/flow-queries";

import {
  sessionQueries,
  useAddMessage,
  useDeleteMessage,
  useSaveSession,
} from "@/entities/session/api";
import {
  fetchTurn,
  fetchTurnOptional,
  turnQueries,
  useUpdateTurn,
} from "@/app/queries/turn-queries";
import {
  createMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { TurnService } from "@/app/services/turn-service";
import { useAppStore } from "@/shared/stores/app-store";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";

import { cn } from "@/shared/lib";
import { InlineChatStyles } from "./inline-chat-styles";

import {
  FloatingActionButton,
  ScrollArea,
  SvgIcon,
  toastError,
} from "@/shared/ui";
import { PlotCard } from "@/entities/card/domain";
import { DataStoreSavedField, Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { PlaceholderType } from "@/entities/turn/domain/placeholder-type";
import { DataStoreSchemaField } from "@/entities/flow/domain/flow";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import delay from "lodash-es/delay";
import { fetchCharacterCard } from "@/app/queries/card/query-factory";

import UserInputs from "./user-inputs";
import { SortableDataSchemaFieldItem } from "./message-components";
import { SessionMessages } from "./session-messages";
import SelectScenarioDialog from "./select-scenario-dialog";

const SessionContent = ({
  onAddPlotCard,
  isOpenSettings,
}: {
  onAddPlotCard: () => void;
  isOpenSettings: boolean;
}) => {
  // Fetch session
  const queryClient = useQueryClient();
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const scrollAreaVieportRef = useRef<HTMLDivElement>(null);
  const { data: session } = useQuery(
    sessionQueries.detail(selectedSessionId ?? undefined),
  );

  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(selectedSessionId ?? undefined).queryKey,
    });
  }, [queryClient, selectedSessionId]);

  // Mutations
  const saveSessionMutation = useSaveSession();
  const addMessageMutation = useAddMessage(selectedSessionId!);
  const deleteMessageMutation = useDeleteMessage(selectedSessionId!);
  const updateTurnMutation = useUpdateTurn();

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: session?.turnIds.length ?? 0,
    getScrollElement: () => scrollAreaVieportRef.current,
    estimateSize: useCallback(
      (index) => {
        // Check if this turn has media (image/video)
        const turnId = session?.turnIds[index];
        if (!turnId) return 250;

        const turn = queryClient.getQueryData(
          turnQueries.detail(turnId).queryKey,
        ) as Turn | undefined;
        const hasMedia =
          turn?.options?.[turn?.selectedOptionIndex || 0]?.assetId;

        if (hasMedia) {
          // For media items with 16:9 aspect ratio
          // Container max width is 890px, with 32px padding on each side
          // So effective width is ~890px, height would be 890 * 9/16 = ~500px
          // Add extra padding for controls, spacing, and margin
          return 1000;
        }

        // Regular text messages
        return 250;
      },
      [session?.turnIds, queryClient],
    ),
    overscan: 10, // Increase overscan for smoother scrolling
    getItemKey: (index) =>
      session?.turnIds[index]?.toString() ?? index.toString(),
    paddingStart: 100,
    measureElement: (element) => element?.getBoundingClientRect().height,
  });
  const scrollToBottom = useCallback(
    (options?: { wait?: number; behavior?: ScrollBehavior }) => {
      if (!scrollAreaVieportRef.current) {
        return;
      }
      const wait = options?.wait ?? 50;
      const behavior = options?.behavior ?? "instant";
      delay(() => {
        if (!scrollAreaVieportRef.current) {
          return;
        }
        scrollAreaVieportRef.current.scrollTo({
          top: scrollAreaVieportRef.current.scrollHeight,
          behavior: behavior,
        });
      }, wait);
    },
    [],
  );

  // Check if all messages are loaded
  const allMessagesLoaded = useMemo(() => {
    if (!session?.turnIds.length) return false;

    // Check if all message queries are loaded
    return session.turnIds.every((messageId: UniqueEntityID) => {
      const messageQuery = queryClient.getQueryState(
        turnQueries.detail(messageId).queryKey,
      );
      return messageQuery?.status === "success" && messageQuery.data;
    });
  }, [session?.turnIds, queryClient]);

  // Scroll to bottom when session changes and all messages are loaded
  useEffect(() => {
    if (selectedSessionId && session?.turnIds.length && allMessagesLoaded) {
      scrollToBottom();
    }
  }, [
    selectedSessionId,
    session?.turnIds.length,
    rowVirtualizer,
    allMessagesLoaded,
    scrollToBottom,
  ]);

  // Generate character message
  const [streamingMessageId, setStreamingMessageId] =
    useState<UniqueEntityID | null>(null);
  const [streamingAgentName, setStreamingAgentName] = useState<string>("");
  const [streamingModelName, setStreamingModelName] = useState<string>("");
  const refStopGenerate = useRef<AbortController | null>(null);
  const generateCharacterMessage = useCallback(
    async (
      characterCardId: UniqueEntityID,
      regenerateMessageId?: UniqueEntityID,
    ) => {
      // Check session
      if (!session) {
        throw new Error("Session not found");
      }

      let streamingMessage: Turn | null = null;
      let streamingContent = "";
      let streamingVariables = {};
      try {
        // Get dataStore for inheritance - prioritize regeneration context
        let lastDataStore: DataStoreSavedField[] = [];

        if (regenerateMessageId) {
          // For regeneration, get dataStore from the turn before the regenerated message
          let dataStoreForRegeneration: DataStoreSavedField[] = [];

          for (const turnId of session.turnIds) {
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
        } else if (session.turnIds.length > 0) {
          // For new messages, use last turn's dataStore
          const lastTurnId = session.turnIds[session.turnIds.length - 1];
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
          const character = await fetchCharacterCard(characterCardId);

          // Create new empty message
          const messageOrError = Turn.create({
            sessionId: session.id,
            characterCardId: characterCardId,
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
        if (!regenerateMessageId) {
          addMessageMutation.mutate({
            sessionId: session.id,
            message: streamingMessage,
          });
        }

        // Set streaming message id
        setStreamingMessageId(streamingMessage.id);
        scrollToBottom({ behavior: "smooth" });

        // Execute flow
        refStopGenerate.current = new AbortController();
        const flowResult = executeFlow({
          flowId: session.props.flowId,
          sessionId: session.id,
          characterCardId: characterCardId,
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

          // If we have structured output (variables), show the JSON during streaming
          // if (streamingVariables && Object.keys(streamingVariables).length > 0 && !streamingContent.trim()) {
          //   // Show prettified JSON as temporary content during streaming
          //   const prettyJson = JSON.stringify(streamingVariables, null, 2);
          //   streamingMessage.setContent(prettyJson);
          // } else {
          //   // Normal text streaming
          //   streamingMessage.setContent(streamingContent);
          // }

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
          if (!regenerateMessageId) {
            scrollToBottom({ behavior: "smooth" });
          }
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
            toastError({
              title: "Failed to generate message",
              details: parsedError.message,
            });
          } else {
            toast.info(parsedError.message);
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

            toastError({
              title: "Failed to generate message",
              details: JSON.stringify(errorDetails, null, 2),
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
                sessionId: session.id,
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
        // Reset streaming states
        setStreamingMessageId(null);
        setStreamingAgentName("");
        setStreamingModelName("");
        refStopGenerate.current = null;
      }

      // Invalidate session
      invalidateSession();
    },
    [invalidateSession, queryClient, session, scrollToBottom],
  );

  // Add user message
  const autoReply = session?.autoReply;
  const addUserMessage = useCallback(
    async (messageContent: string) => {
      try {
        // Check session
        if (!session) {
          throw new Error("Session not found");
        }

        // Create user message
        const userMessage = (
          await createMessage({
            sessionId: session.id,
            characterCardId: session.userCharacterCardId,
            defaultCharacterName: "User",
            messageContent: messageContent,
          })
        )
          .throwOnFailure()
          .getValue();

        // Add user message
        (
          await addMessageMutation.mutateAsync({
            sessionId: session.id,
            message: userMessage,
          })
        ).throwOnFailure();

        // Scroll to bottom
        scrollToBottom({ behavior: "smooth" });

        // Auto reply
        switch (autoReply) {
          // No auto reply
          case AutoReply.Off:
            break;

          // Random character reply
          case AutoReply.Random: {
            const randomIndex = Math.floor(
              Math.random() * session.aiCharacterCardIds.length,
            );
            const randomCharacterCardId =
              session.aiCharacterCardIds[randomIndex];
            generateCharacterMessage(randomCharacterCardId);
            break;
          }

          // All characters reply by order
          case AutoReply.Rotate: {
            for (const charId of session.aiCharacterCardIds) {
              await generateCharacterMessage(charId);
            }
            break;
          }

          default:
            throw new Error("Unknown auto reply");
        }
      } catch (error) {
        if (error instanceof Error) {
          toastError({
            title: "Failed to add user message",
            details: JSON.stringify(
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
    [autoReply, generateCharacterMessage, session, scrollToBottom],
  );

  // Set auto reply
  const setAutoReply = useCallback(
    async (autoReply: AutoReply) => {
      if (!session) {
        return;
      }
      session.update({
        autoReply,
      });
      saveSessionMutation.mutate({
        session,
      });
    },
    [session, saveSessionMutation],
  );

  // Add plot card modal
  const [plotCard] = useCard<PlotCard>(session?.plotCard?.id);
  const messageCount = session?.turnIds.length ?? 0;
  const plotCardId = session?.plotCard?.id.toString() ?? "";
  const sessionId = session?.id.toString() ?? "";

  // Select scenario modal
  const [isOpenSelectScenarioModal, setIsOpenSelectScenarioModal] =
    useState(false);
  const plotCardScenarioCount = plotCard?.props.scenarios?.length ?? 0;
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
  }, [messageCount, plotCardScenarioCount, sessionId, plotCardId]);

  // Render scenario
  const [renderedScenarios, setRenderedScenarios] = useState<
    {
      name: string;
      description: string;
    }[]
  >([]);
  const sessionUserCardId = session?.userCharacterCardId?.toString() ?? "";
  const sessionAllCards = JSON.stringify(session?.allCards);
  const plotCardScenario = JSON.stringify(plotCard?.props.scenarios);
  const renderScenarios = useCallback(async () => {
    logger.debug("[Hook] useEffect: Render scenario");

    // Check session and plot card
    if (!session || !plotCard) {
      return;
    }

    // If no scenarios, set empty array
    if (!plotCard.props.scenarios || plotCard.props.scenarios.length === 0) {
      setRenderedScenarios([]);
      return;
    }

    // Create context
    const contextOrError = await makeContext({
      session: session,
      characterCardId: session.aiCharacterCardIds[0],
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
  }, [sessionUserCardId, sessionAllCards, plotCardScenario]);

  // Select scenario - no longer needed as state is managed within SelectScenarioModal
  const addScenario = useCallback(
    async (scenarioIndex: number) => {
      // Check session
      if (!session) {
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
            sessionId: session.id,
            messageContent: scenario.description,
          })
        )
          .throwOnFailure()
          .getValue();

        // Add scenario
        const scenarioMessageOrError = await addMessageMutation.mutateAsync({
          sessionId: session.id,
          message: scenarioMessage,
        });
        if (scenarioMessageOrError.isFailure) {
          toastError({
            title: "Failed to add scenario",
            details: scenarioMessageOrError.getError(),
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
    [addMessageMutation, invalidateSession, renderedScenarios, session],
  );

  // Edit message
  const editMessage = useCallback(
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

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: UniqueEntityID) => {
      // Check session
      if (!session) {
        return;
      }

      // Check if this is a placeholder turn and handle special deletion
      const turnOrNull = await fetchTurnOptional(messageId);
      if (turnOrNull) {
        const turn = turnOrNull;
        if (TurnService.isPlaceholderTurn(turn)) {
          // Use special deletion for placeholder turns with assets
          const deleteResult =
            await TurnService.deletePlaceholderTurnWithAssets(
              session.id,
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
          sessionId: session.id,
          messageId: messageId,
        },
        {
          onError: (error) => {
            logger.error("Failed to delete message", error);
          },
        },
      );
    },
    [invalidateSession, session],
  );

  // Select option
  const selectOption = useCallback(
    async (messageId: UniqueEntityID, prevOrNext: "prev" | "next") => {
      // Get message from DB
      const message = await fetchTurn(messageId);

      // Update selected option
      if (prevOrNext === "prev") {
        message.prevOption();
      } else {
        message.nextOption();
      }

      // Save message to DB
      updateTurnMutation.mutate({
        turn: message,
      });
    },
    [updateTurnMutation],
  );

  // Generate option
  const generateOption = useCallback(
    async (messageId: UniqueEntityID) => {
      // Generate option
      const message = await fetchTurn(messageId);
      await generateCharacterMessage(message.characterCardId!, messageId);
    },
    [generateCharacterMessage],
  );

  // Session data
  const [isOpenSessionData, setIsOpenSessionData] = useState(false);
  const { data: flow } = useQuery(flowQueries.detail(session?.flowId));

  // Session onboarding
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();
  // Show session data tooltip if helpVideo is done but sessionData is not done yet
  const shouldShowSessionDataTooltip =
    sessionOnboardingSteps.helpVideo && !sessionOnboardingSteps.sessionData;
  const isDataSchemaUsed = useMemo(() => {
    if (!flow) {
      return false;
    }
    return (
      flow.props.dataStoreSchema && flow.props.dataStoreSchema.fields.length > 0
    );
  }, [flow]);
  const { data: lastTurn } = useQuery(
    turnQueries.detail(session?.turnIds[session?.turnIds.length - 1]),
  );

  // Image generation hooks for global buttons
  const { generateImage: generateImageBase } = useImageGeneration({
    onSuccess: async () => {
      // Refresh will be handled by updating the turn
    },
  });

  // Video generation hooks for global buttons
  const {
    generateVideo: generateVideoBase,
    isGeneratingVideo: isGeneratingGlobalVideo,
    videoGenerationStatus: globalVideoStatus,
  } = useVideoGeneration({
    onSuccess: async () => {
      // Refresh will be handled by updating the turn
    },
  });

  const [isGeneratingGlobalImage, setIsGeneratingGlobalImage] = useState(false);

  // Use the new enhanced generation prompt hook that properly filters turns
  const {
    prompt: enhancedGenerationPrompt,
    imageUrls: imageUrlsForGeneration,
    // characterIds: involvedCharacterIds,
    // lastGeneratedImageUrl,
    // secondLastGeneratedImageUrl,
  } = useEnhancedGenerationPrompt({
    sessionId: session?.id,
  });

  // Handler for generating video from an existing image in a message
  const handleGenerateVideoFromImage = useCallback(
    async (
      messageId: UniqueEntityID,
      imageUrl: string,
      prompt: string,
      userPrompt: string,
    ) => {
      // Always use "starting" mode with just the current image for video generation
      // The backend will generate video starting from this frame
      const imageUrls: string[] = [imageUrl];
      const imageMode: "start-end" | "starting" | "reference" = "starting";

      // Note: Character reference images are not included in video generation

      try {
        // Generate video using enhanced prompt and multiple images
        const assetId = await generateVideoBase({
          prompt: enhancedGenerationPrompt || prompt, // Use enhanced prompt
          userPrompt: userPrompt, // Keep original for display
          selectedModel: IMAGE_MODELS.SEEDANCE_1_0, // Use Pro model
          imageToImage: true, // We're using images
          imageUrls: imageUrls, // All images including previous, current, and characters
          imageMode: imageMode, // Use appropriate mode based on available images
          videoDuration: 5, // 5 seconds video duration
          ratio: "16:9",
          resolution: "720p",
          isSessionGenerated: true,
        });

        if (assetId) {
          // Update the turn with the video asset
          const turn = await fetchTurn(messageId);

          // Update the selected option with the new assetId
          turn.setAssetId(assetId);

          // Save the updated turn
          const result = await updateTurnMutation.mutateAsync({
            turn: turn,
          });
          if (result.isFailure) {
            console.error("Failed to update turn:", result.getError());
            throw new Error(result.getError());
          } else {
            // Invalidate the turn query to trigger re-render
            await queryClient.invalidateQueries({
              queryKey: turnQueries.detail(messageId).queryKey,
            });

            console.log(
              "[VIDEO FROM IMAGE] Video generated successfully:",
              assetId,
            );
          }
        }
      } catch (error) {
        console.error("[VIDEO FROM IMAGE] Failed to generate video:", error);
        throw error; // Re-throw to let MessageItem handle the error
      }
    },
    [
      updateTurnMutation,
      generateVideoBase,
      queryClient,
      // secondLastGeneratedImageUrl,
      enhancedGenerationPrompt,
    ],
  );

  // Generate image for last turn
  const handleGenerateImageForLastTurn = useCallback(async () => {
    if (!session || !lastTurn || isGeneratingGlobalImage) return;

    const currentOption = lastTurn.options?.[lastTurn.selectedOptionIndex || 0];
    if (!currentOption) {
      toast.error("No message content to generate image from");
      return;
    }

    // Capture the current image URLs at the moment of click
    // This ensures we use the current valid blob URLs
    const currentImageUrls = imageUrlsForGeneration;

    setIsGeneratingGlobalImage(true);

    // Create placeholder turn
    const placeholderResult = await TurnService.createPlaceholderTurn.execute({
      sessionId: session.id,
      placeholderType: PlaceholderType.IMAGE,
      baseTurnId: lastTurn?.id,
    });

    if (placeholderResult.isFailure) {
      const errorMessage =
        placeholderResult.getError() || "Failed to create placeholder";
      console.error("Failed to create image placeholder:", errorMessage);
      toast.error(errorMessage);
      setIsGeneratingGlobalImage(false);
      return;
    }

    const placeholderTurn = placeholderResult.getValue();

    // Generate the image BEFORE invalidating queries to keep blob URL alive
    let assetId;
    try {
      assetId = await generateImageBase({
        prompt: enhancedGenerationPrompt || currentOption.content,
        userPrompt: "",
        selectedModel: IMAGE_MODELS.SEEDREAM_4_0,
        imageToImage: currentImageUrls.length > 0,
        imageUrls: currentImageUrls,
        // size: "1280x720", // 16:9 aspect ratio, 720p resolution (921,600 pixels)
        size: "1920x1088", // 16:9 aspect ratio with reduced size
        isSessionGenerated: true, // Mark as session-generated
      });

      if (assetId) {
        // Update placeholder with the actual image
        const updateResult =
          await TurnService.updatePlaceholderWithAsset.execute({
            placeholderTurnId: placeholderTurn.id,
            assetId,
          });

        if (updateResult.isFailure) {
          console.error(
            "Failed to update placeholder:",
            updateResult.getError(),
          );
          toast.error("Failed to update placeholder with image");
          return;
        }

        // Now invalidate the turn query to trigger re-render (same pattern as MessageItem)
        await queryClient.invalidateQueries({
          queryKey: turnQueries.detail(placeholderTurn.id).queryKey,
        });

        // Also invalidate session to ensure UI updates
        await queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(session.id).queryKey,
        });

        toast.success("Image generated successfully!");
      } else {
        // Remove placeholder if no asset generated
        await TurnService.deletePlaceholderTurnWithAssets(
          session.id,
          placeholderTurn.id,
        );

        // Invalidate to remove placeholder
        queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(session.id).queryKey,
        });
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error("Failed to generate image");

      // Remove placeholder on error
      await TurnService.deletePlaceholderTurnWithAssets(
        session.id,
        placeholderTurn.id,
      );

      queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(session.id).queryKey,
      });

      // Scroll to bottom to show the newly generated image
      scrollToBottom({ wait: 500, behavior: "smooth" });
    } finally {
      setIsGeneratingGlobalImage(false);
    }
  }, [
    session,
    lastTurn,
    enhancedGenerationPrompt,
    imageUrlsForGeneration,
    generateImageBase,
    isGeneratingGlobalImage,
    queryClient,
    scrollToBottom,
  ]);

  // Generate video for last turn
  const handleGenerateVideoForLastTurn = useCallback(async () => {
    if (!session || !lastTurn || isGeneratingGlobalVideo) return;

    const currentOption = lastTurn.options?.[lastTurn.selectedOptionIndex || 0];
    if (!currentOption) {
      toast.error("No message content to generate video from");
      return;
    }
    // Create placeholder turn
    const placeholderResult = await TurnService.createPlaceholderTurn.execute({
      sessionId: session.id,
      placeholderType: PlaceholderType.VIDEO,
      baseTurnId: lastTurn?.id,
    });

    if (placeholderResult.isFailure) {
      const errorMessage =
        placeholderResult.getError() || "Failed to create placeholder";
      console.error("Failed to create video placeholder:", errorMessage);
      toast.error(errorMessage);
      return;
    }

    const placeholderTurn = placeholderResult.getValue();

    // Invalidate to show placeholder and wait for it to complete
    await queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(session.id).queryKey,
    });

    try {
      // Determine which mode to use based on available images
      // For last turn generation, first image is previous scene, rest are character refs
      const hasPreviousImage =
        imageUrlsForGeneration.length > 0 && imageUrlsForGeneration[0];
      let imageMode: "start-end" | "starting" | "reference";

      // Note: For this function, we're generating a NEW image that will be the end frame
      // So we need at least the previous image to use start-end mode
      if (hasPreviousImage) {
        // We have previous image and will generate current - can use start-end
        imageMode = "start-end";
      } else {
        // No previous image, will generate from scratch
        imageMode = "reference";
      }

      const assetId = await generateVideoBase({
        prompt: enhancedGenerationPrompt || currentOption.content,
        userPrompt: currentOption.content,
        selectedModel: IMAGE_MODELS.SEEDANCE_LITE_1_0, // Lite model
        imageToImage: imageUrlsForGeneration.length > 0,
        imageUrls: imageUrlsForGeneration,
        imageMode: imageMode, // Use appropriate mode based on available images
        videoDuration: 5,
        ratio: "16:9",
        resolution: "720p",
        isSessionGenerated: true, // Mark as session-generated
      });

      if (assetId) {
        // Update placeholder with the actual video
        const updateResult =
          await TurnService.updatePlaceholderWithAsset.execute({
            placeholderTurnId: placeholderTurn.id,
            assetId,
          });

        if (updateResult.isFailure) {
          console.error(
            "Failed to update placeholder:",
            updateResult.getError(),
          );
          toast.error("Failed to update placeholder with video");
          return;
        }

        // Clear the query cache for this turn first
        queryClient.removeQueries({
          queryKey: turnQueries.detail(placeholderTurn.id).queryKey,
        });

        // Force refetch the turn to get updated data
        await queryClient.fetchQuery(turnQueries.detail(placeholderTurn.id));

        // Also invalidate session to ensure UI updates
        await queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(session.id).queryKey,
        });

        toast.success("Video generated successfully!");

        // Scroll to bottom to show the newly generated video
        scrollToBottom({ wait: 500, behavior: "smooth" });
      } else {
        // Remove placeholder if no asset generated
        await TurnService.deletePlaceholderTurnWithAssets(
          session.id,
          placeholderTurn.id,
        );

        // Invalidate to remove placeholder
        queryClient.invalidateQueries({
          queryKey: sessionQueries.detail(session.id).queryKey,
        });
      }
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast.error("Failed to generate video");

      // Remove placeholder on error
      await TurnService.deletePlaceholderTurnWithAssets(
        session.id,
        placeholderTurn.id,
      );

      queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(session.id).queryKey,
      });
    }
  }, [
    session,
    lastTurn,
    enhancedGenerationPrompt,
    imageUrlsForGeneration,
    generateVideoBase,
    isGeneratingGlobalVideo,
    queryClient,
    scrollToBottom,
  ]);

  const isInitialDataStore = useMemo(() => {
    if (!session || session.turnIds.length === 0) return true;

    // Only scenario message exists if:
    // 1. There's only one message
    // 2. That message is a scenario (no characterCardId and no characterName)
    if (session.turnIds.length === 1 && lastTurn) {
      const isScenarioMessage =
        !lastTurn.characterCardId && !lastTurn.characterName;
      return isScenarioMessage;
    }

    // Multiple messages mean conversation has started
    return false;
  }, [session, lastTurn]);
  const lastTurnDataStore: Record<string, string> = useMemo(() => {
    if (!lastTurn) {
      return {};
    }
    return Object.fromEntries(
      lastTurn.dataStore.map((field: DataStoreSavedField) => [
        field.name,
        field.value,
      ]),
    );
  }, [lastTurn]);

  // Sort data schema fields according to dataSchemaOrder
  const sortedDataSchemaFields = useMemo(() => {
    const fields = flow?.props.dataStoreSchema?.fields || [];
    const dataSchemaOrder = session?.dataSchemaOrder || [];

    return [
      // 1. Fields in dataSchemaOrder come first, in order
      ...dataSchemaOrder
        .map((name: string) =>
          fields.find((f: DataStoreSchemaField) => f.name === name),
        )
        .filter(
          (f: DataStoreSchemaField | undefined): f is NonNullable<typeof f> =>
            f !== undefined,
        ),

      // 2. Fields not in dataSchemaOrder come after, in original order
      ...fields.filter(
        (f: DataStoreSchemaField) => !dataSchemaOrder.includes(f.name),
      ),
    ];
  }, [flow?.props.dataStoreSchema?.fields, session?.dataSchemaOrder]);

  // DnD sensors for data schema reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end for data schema field reordering
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !session) {
        return;
      }

      const oldIndex = sortedDataSchemaFields.findIndex(
        (f) => f.name === active.id,
      );
      const newIndex = sortedDataSchemaFields.findIndex(
        (f) => f.name === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reorderedFields = arrayMove(
        sortedDataSchemaFields,
        oldIndex,
        newIndex,
      );
      const newOrder = reorderedFields.map((f) => f.name);

      try {
        session.setDataSchemaOrder(newOrder);
        saveSessionMutation.mutate({
          session,
        });
      } catch (error) {
        logger.error("Failed to update data schema order", error);
        toast.error("Failed to update field order");
      }
    },
    [sortedDataSchemaFields, session, saveSessionMutation],
  );

  // Update last turn data store
  const updateDataStore = useCallback(
    async (name: string, value: string) => {
      if (!lastTurn) {
        logger.error("No message");
        toast.error("No message");
        return;
      }

      try {
        // Find the field to update
        const updatedDataStore = lastTurn.dataStore.map(
          (field: DataStoreSavedField) =>
            field.name === name ? { ...field, value } : field,
        );

        // Update the turn with new dataStore
        lastTurn.setDataStore(updatedDataStore);

        // Save to database
        updateTurnMutation.mutate({
          turn: lastTurn,
        });
      } catch (error) {
        logger.error("Failed to update data store", error);
        toast.error("Failed to update data store field");
      }
    },
    [updateTurnMutation, lastTurn],
  );

  if (!selectedSessionId) {
    return null;
  }

  if (!session) {
    return null;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className={cn("h-full overflow-hidden")}>
      <div
        ref={scrollAreaVieportRef}
        id={`session-${session.id}`}
        className={cn(
          "session-scrollbar relative z-10 h-full w-full overflow-auto contain-strict",
          "pr-0 transition-[padding-right] duration-200",
          // Desktop: data schema panel
          isDataSchemaUsed && isOpenSessionData && "md:pr-[320px]",
          // Mobile: no side panel (data schema hidden)
          isDataSchemaUsed && isOpenSessionData && "max-md:pr-0",
          // Bottom padding to prevent UserInputs overlap
          // Desktop: UserInputs height (~220px) + topbar height (40px)
          "pb-[250px]",
          // Mobile: UserInputs height (~220px) + safe area
          "max-md:pb-[220px]",
        )}
      >
        <div
          className={cn(
            "relative w-full",
            // Desktop: min-height for empty state
            "min-h-[calc(100dvh-270px)]",
            // Mobile: minimal min-height (virtualizer controls actual height)
            "max-md:min-h-[200px]",
          )}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          <InlineChatStyles
            container={`#session-${session.id}`}
            chatStyles={session.props.chatStyles}
          />

          <div
            className={cn(
              "relative mx-auto max-w-[1196px]",
              // Mobile: add horizontal padding
              "max-md:px-[16px]",
            )}
          >
            <SessionMessages
              session={session}
              virtualItems={virtualItems}
              messageCount={messageCount}
              streamingMessageId={streamingMessageId}
              streamingAgentName={streamingAgentName}
              streamingModelName={streamingModelName}
              editMessage={editMessage}
              deleteMessage={deleteMessage}
              selectOption={selectOption}
              generateOption={generateOption}
              handleGenerateVideoFromImage={handleGenerateVideoFromImage}
              measureElement={rowVirtualizer.measureElement}
            />
          </div>
        </div>

        {/* Select Scenario Modal - absolute on mobile (inside scroll area), fixed on desktop (full viewport) */}
        {isOpenSelectScenarioModal && (
          <div
            className={cn(
              "z-[100] overflow-y-auto bg-black/50 px-[16px] py-[16px]",
              // Mobile: absolute positioning inside scroll area (respects header)
              "absolute inset-0",
              // Desktop: fixed positioning (full viewport overlay)
              "md:fixed md:inset-0",
            )}
          >
            <div className="flex min-h-full items-center justify-center">
              <SelectScenarioDialog
                onSkip={() => {
                  setIsOpenSelectScenarioModal(false);
                }}
                onAdd={addScenario}
                renderedScenarios={renderedScenarios}
                onRenderScenarios={renderScenarios}
                sessionId={sessionId}
                plotCardId={plotCardId}
              />
            </div>
          </div>
        )}
      </div>

      {!isOpenSelectScenarioModal && (
        <UserInputs
          userCharacterCardId={session.userCharacterCardId}
          aiCharacterCardIds={session.aiCharacterCardIds}
          generateCharacterMessage={generateCharacterMessage}
          addUserMessage={addUserMessage}
          isOpenSettings={isOpenSettings}
          disabled={isOpenSelectScenarioModal}
          streamingMessageId={streamingMessageId ?? undefined}
          onStopGenerate={() => {
            refStopGenerate.current?.abort("Stop generate by user");
          }}
          autoReply={session.autoReply}
          setAutoReply={setAutoReply}
          onAdd={() => {
            onAddPlotCard();
          }}
          handleGenerateImageForLastTurn={handleGenerateImageForLastTurn}
          handleGenerateVideoForLastTurn={handleGenerateVideoForLastTurn}
          isGeneratingGlobalImage={isGeneratingGlobalImage}
          isGeneratingGlobalVideo={isGeneratingGlobalVideo}
          globalVideoStatus={globalVideoStatus}
        />
      )}

      {/* Data schema toggle & list - Desktop only */}
      <div
        className={cn(
          "absolute top-[72px] right-[32px] bottom-[80px] flex flex-col items-end gap-[16px]",
          !isDataSchemaUsed && "hidden",
          // Mobile: hide data schema panel completely
          "max-md:hidden",
        )}
      >
        <FloatingActionButton
          icon={<Database size={24} />}
          label="Session data"
          position="top-right"
          className="top-0 right-0"
          openned={isOpenSessionData}
          onClick={() => {
            setIsOpenSessionData((isOpen) => !isOpen);
            // Complete the entire onboarding if on sessionData step
            console.log(
              "shouldShowSessionDataTooltip",
              shouldShowSessionDataTooltip,
            );
            setSessionOnboardingStep("sessionData", true);
          }}
          onboarding={shouldShowSessionDataTooltip}
          onboardingTooltip={
            shouldShowSessionDataTooltip
              ? "Click to view and edit session stats"
              : undefined
          }
          tooltipClassName="!top-[0px] !right-[50px]"
        />
        <div
          className={cn(
            "relative z-10 mt-[48px] w-[320px] rounded-[12px]",
            "border-text-primary/10 border bg-[#3b3b3b]/50 backdrop-blur-xl",
            "flex flex-col overflow-hidden",
            "transition-opacity duration-200",
            isOpenSessionData
              ? "visible opacity-100"
              : "pointer-events-none invisible opacity-0",
          )}
        >
          <div className="border-text-primary/10 text-text-primary flex h-[72px] shrink-0 flex-row items-center border-b-1 p-[16px]">
            {streamingMessageId ? (
              <>
                <SvgIcon
                  name="astrsk_symbol"
                  size={40}
                  className="mr-[2px] animate-spin"
                />
                <div className="mr-[4px] text-[16px] leading-[25.6px] font-[400]">
                  {streamingAgentName}
                </div>
                <div className="text-[16px] leading-[25.6px] font-[600]">
                  {streamingModelName}
                </div>
              </>
            ) : (
              <div className="text-[16px] leading-[25.6px] font-[600]">
                Session data
              </div>
            )}
          </div>
          <div className="relative overflow-hidden">
            <ScrollArea className="h-full w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={sortedDataSchemaFields.map((field) => field.name)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedDataSchemaFields.map((field) => (
                    <SortableDataSchemaFieldItem
                      key={field.name}
                      name={field.name}
                      type={field.type}
                      value={
                        isInitialDataStore
                          ? field.initialValue
                          : field.name in lastTurnDataStore
                            ? lastTurnDataStore[field.name]
                            : "--"
                      }
                      onEdit={isInitialDataStore ? undefined : updateDataStore}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionContent;
