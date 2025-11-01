import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import {
  CaseUpper,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Hash,
  History,
  Loader2,
  Pencil,
  RefreshCcw,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/shared/hooks/use-asset";

import { useCard } from "@/shared/hooks/use-card";
import { generatedImageQueries } from "@/app/queries/generated-image/query-factory";

import {
  fetchTurn,
  turnQueries,
  useUpdateTurn,
} from "@/app/queries/turn-queries";

import { TurnService } from "@/app/services/turn-service";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib";
import { ScenarioItem } from "@/features/session/components/scenario/scenario-item";

import { MediaPlaceholderMessage } from "@/features/session/media-placeholder-message";

import { Avatar, Button, ScrollAreaSimple, SvgIcon } from "@/shared/ui";
import { CharacterCard } from "@/entities/card/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { DataStoreSavedField } from "@/entities/turn/domain/option";

import { PlaceholderType } from "@/entities/turn/domain/placeholder-type";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const MessageItemInternal = ({
  characterCardId,
  isUser,
  content,
  translation,
  selectedOptionIndex = 0,
  optionsLength = 1,
  disabled,
  streaming,
  streamingAgentName,
  streamingModelName,
  assetId,
  dataStoreFields,
  onEdit,
  onDelete,
  onPrevOption,
  onNextOption,
  onRegenerate,
}: {
  messageId?: UniqueEntityID;
  sessionId?: UniqueEntityID;
  characterCardId?: UniqueEntityID;
  isUser?: boolean;
  content?: string;
  translation?: string;
  selectedOptionIndex?: number;
  optionsLength?: number;
  disabled?: boolean;
  streaming?: boolean;
  streamingAgentName?: string;
  streamingModelName?: string;
  assetId?: string;
  dataStoreFields?: DataStoreSavedField[];
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPrevOption?: () => Promise<void>;
  onNextOption?: () => Promise<void>;
  onRegenerate?: () => Promise<void>;
  onUpdateAssetId?: (assetId: string) => Promise<void>;
  onGenerateVideoFromImage?: (
    imageUrl: string,
    prompt: string,
    userPrompt: string,
  ) => Promise<void>;
}) => {
  // Character card
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [icon, iconIsVideo] = useAsset(characterCard?.props.iconAssetId);

  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  // Toggle data store
  const [isShowDataStore, setIsShowDataStore] = useState(false);

  // Asset URL for displaying generated media
  const [assetUrl, assetIsVideo] = useAsset(
    assetId ? new UniqueEntityID(assetId) : undefined,
  );

  // Shared hover state for avatar and generated video
  const [isMediaHovered, setIsMediaHovered] = useState(false);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const generatedVideoRef = useRef<HTMLVideoElement>(null);

  // Handle media hover to play both videos
  const handleMediaHover = useCallback(
    (hovered: boolean) => {
      setIsMediaHovered(hovered);

      // Play/pause avatar video if it exists
      if (iconIsVideo && avatarVideoRef.current) {
        if (hovered) {
          avatarVideoRef.current.play().catch(() => {
            // Silently handle autoplay errors
          });
        } else {
          avatarVideoRef.current.pause();
        }
      }

      // Play/pause generated video if it exists
      if (assetIsVideo && generatedVideoRef.current) {
        if (hovered) {
          generatedVideoRef.current.play().catch(() => {
            // Silently handle autoplay errors
          });
        } else {
          generatedVideoRef.current.pause();
        }
      }
    },
    [iconIsVideo, assetIsVideo],
  );

  return (
    <div className="group/message relative px-[56px]" tabIndex={0}>
      <div
        className={cn(
          "flex items-start gap-[16px]",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "user-chat-style" : "ai-chat-style",
        )}
      >
        <div
          className="flex flex-col items-center gap-[8px]"
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        >
          {characterCardId ? (
            <>
              <div
                className={cn(
                  "border-border-selected-inverse/50 grid shrink-0 place-items-center overflow-hidden rounded-full border-1 select-none",
                  !icon && "bg-background-surface-3",
                )}
                style={{
                  width: 80,
                  height: 80,
                }}
              >
                {iconIsVideo ? (
                  <video
                    ref={avatarVideoRef}
                    src={icon || undefined}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : icon ? (
                  <img
                    src={icon}
                    alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/img/placeholder/avatar.png"
                    alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="text-text-primary max-w-[80px] truncate text-[16px] leading-[19px] font-medium">
                {characterCard?.props.name}
              </div>
            </>
          ) : (
            <>
              <Avatar src="/img/message-avatar-default.svg" size={80} />
              <div className="text-text-primary max-w-[80px] truncate text-[16px] leading-[19px] font-medium">
                User
              </div>
            </>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col gap-[8px]",
            isUser ? "items-end" : "items-start",
          )}
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        >
          <div
            className={cn(
              "chat-style-chat-bubble max-w-[600px] rounded-[8px] p-[16px]",
              // !streaming && "min-w-[300px]",
            )}
          >
            {/* Display generated image if exists */}
            {assetUrl && (
              <div className="mb-[12px] overflow-hidden rounded-[8px]">
                {assetIsVideo ? (
                  <video
                    ref={generatedVideoRef}
                    src={assetUrl}
                    controls
                    className="h-auto w-full rounded-[8px]"
                  />
                ) : (
                  <img
                    src={assetUrl}
                    alt="Generated content"
                    className="h-auto w-full rounded-[8px]"
                  />
                )}
              </div>
            )}

            {isEditing && !disabled ? (
              <TextareaAutosize
                className={cn(
                  "no-resizer w-[568px] rounded-none border-0 bg-transparent p-0 outline-0",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                )}
                autoFocus
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onEditDone();
                  }
                }}
              />
            ) : (
              <>
                <Markdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  className="markdown chat-style-text"
                  components={{
                    pre: ({ children }) => (
                      <pre
                        tabIndex={0}
                        className="my-2 max-w-full overflow-x-auto rounded-md p-3"
                      >
                        {children}
                      </pre>
                    ),
                    code: ({ children, className }) => {
                      const isInlineCode = !className;
                      return isInlineCode ? (
                        <code className="rounded px-1 py-0.5 text-sm">
                          {children}
                        </code>
                      ) : (
                        <code className="text-sm break-words whitespace-pre-wrap">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {translation ?? content}
                </Markdown>
                {!streaming && isShowDataStore && (
                  <div className="bg-background-surface-0/5 data-history mt-[10px] rounded-[12px] border-[1px] p-[16px]">
                    <div className="text-text-subtle mb-[16px] flex flex-row items-center gap-[8px]">
                      <History size={20} />
                      <div className="text-[14px] leading-[20px] font-[500]">
                        Data history
                      </div>
                    </div>
                    {dataStoreFields?.map((field) => (
                      <div
                        key={field.id}
                        className="chat-style-text !text-[14px] !leading-[20px]"
                      >
                        <span className="font-[600]">{field.name} : </span>
                        <span>{field.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className={cn(
              "flex flex-row items-center rounded-[8px] px-[16px] py-[8px]",
              "opacity-0 transition-opacity duration-200 ease-in-out",
              "group-hover/message:opacity-100 pointer-coarse:group-focus-within/message:opacity-100",
              "chat-style-chat-bubble message-buttons",
              !streaming && disabled && "!opacity-0",
              streaming && streamingAgentName && "opacity-100",
            )}
          >
            {streaming && streamingAgentName ? (
              <div className="flex flex-row items-center">
                <SvgIcon
                  name="astrsk_symbol"
                  size={28}
                  className="chat-style-text mr-[2px] animate-spin"
                />
                <div className="mr-[8px] text-[16px] leading-[25.6px] font-[400]">
                  {streamingAgentName}
                </div>
                <div className="text-[16px] leading-[25.6px] font-[600]">
                  {streamingModelName}
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-[12px]">
                {isEditing ? (
                  <button className="cursor-pointer" onClick={onEditDone}>
                    <Check size={20} />
                  </button>
                ) : (
                  <button
                    className="cursor-pointer"
                    onClick={async () => {
                      setEditedContent(content ?? "");
                      setIsEditing(true);
                    }}
                  >
                    <SvgIcon name="edit" size={20} />
                  </button>
                )}
                {isShowDataStore ? (
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setIsShowDataStore(false);
                    }}
                  >
                    <SvgIcon name="history_solid" size={20} />
                  </button>
                ) : (
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setIsShowDataStore(true);
                    }}
                  >
                    <History size={20} />
                  </button>
                )}
                <button className="cursor-pointer" onClick={onDelete}>
                  <Trash2 size={20} />
                </button>
                <div className="flex flex-row items-center gap-[2px]">
                  <button className="cursor-pointer" onClick={onPrevOption}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="min-w-[24px] text-center text-[10px] leading-[12px] font-[600] select-none">{`${selectedOptionIndex + 1} / ${optionsLength}`}</div>
                  <button className="cursor-pointer" onClick={onNextOption}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button className="cursor-pointer" onClick={onRegenerate}>
                  <RefreshCcw size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioMessageItem = ({
  content,
  onEdit,
  onDelete,
}: {
  content?: string;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}) => {
  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  return (
    <div className="group/scenario px-[56px]">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[890px] min-w-[400px] rounded-[4px] p-[24px]",
          "bg-background-container text-text-placeholder text-[16px] leading-[19px] font-[400]",
          "transition-all duration-200 ease-in-out",
          "group-hover/scenario:inset-ring-text-primary group-hover/scenario:inset-ring-1",
          isEditing && "inset-ring-text-primary inset-ring-1",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer -mb-[4px] w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
            )}
            autoFocus
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEditDone();
              }
            }}
          />
        ) : (
          <Markdown
            className="markdown"
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {content}
          </Markdown>
        )}
        <div className="absolute top-0 right-[-45px] flex flex-col gap-2">
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                onEditDone();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? (
              <Check size={20} />
            ) : (
              <SvgIcon name="edit" size={20} />
            )}
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                // Cancel editing and restore original content
                setEditedContent(content ?? "");
                setIsEditing(false);
              } else {
                onDelete?.();
              }
            }}
          >
            {isEditing ? <X size={20} /> : <Trash2 size={20} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({
  messageId,
  userCharacterCardId,
  translationConfig,
  disabled,
  streaming,
  dataSchemaOrder,
  editMessage,
  deleteMessage,
  selectOption,
  generateOption,
  onGenerateVideoFromImage,
}: {
  messageId: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
  translationConfig?: TranslationConfig;
  disabled?: boolean;
  streaming?: {
    agentName?: string;
    modelName?: string;
  };
  isLastMessage?: boolean;
  dataSchemaOrder?: string[];
  editMessage: (messageId: UniqueEntityID, content: string) => Promise<void>;
  deleteMessage: (messageId: UniqueEntityID) => Promise<void>;
  selectOption: (
    messageId: UniqueEntityID,
    prevOrNext: "prev" | "next",
  ) => Promise<void>;
  generateOption: (messageId: UniqueEntityID) => Promise<void>;
  onGenerateVideoFromImage?: (
    messageId: UniqueEntityID,
    imageUrl: string,
    prompt: string,
    userPrompt: string,
  ) => Promise<void>;
}) => {
  const queryClient = useQueryClient();
  const { data: message } = useQuery(turnQueries.detail(messageId));
  const selectedOption = message?.options[message.selectedOptionIndex];

  // Mutations
  const updateTurnMutation = useUpdateTurn();

  // Display language
  const content = selectedOption?.content;
  const language = translationConfig?.displayLanguage ?? "none";
  const translation = selectedOption?.translations.get(language);

  // Sort dataStoreFields according to dataSchemaOrder
  const sortedDataStoreFields = useMemo(() => {
    const fields = selectedOption?.dataStore;
    if (!fields) return undefined;

    const order = dataSchemaOrder || [];
    return [
      // Fields in dataSchemaOrder come first, in order
      ...order
        .map((name: string) =>
          fields.find((f: DataStoreSavedField) => f.name === name),
        )
        .filter(
          (f: DataStoreSavedField | undefined): f is NonNullable<typeof f> =>
            f !== undefined,
        ),
      // Fields not in dataSchemaOrder come after, in original order
      ...fields.filter((f: DataStoreSavedField) => !order.includes(f.name)),
    ];
  }, [selectedOption?.dataStore, dataSchemaOrder]);

  // State for video generation from image - must be before any returns
  const [isGeneratingVideoFromImage, setIsGeneratingVideoFromImage] =
    useState(false);

  // Get asset URL for the generated image (using existing selectedOption variable)
  const [assetUrl, assetIsVideo] = useAsset(
    selectedOption?.assetId
      ? new UniqueEntityID(selectedOption.assetId)
      : undefined,
  );

  // Get thumbnail for video (original image)
  const { data: generatedImageData } = useQuery({
    ...generatedImageQueries.list(),
    enabled: assetIsVideo && !!selectedOption?.assetId,
    select: (images) => {
      if (!images || !Array.isArray(images)) return null;
      // Find the generated image with matching assetId
      return (
        images.find((img: any) => img.asset_id === selectedOption?.assetId) ||
        null
      );
    },
  });

  // Get thumbnail URL if it's a video, otherwise use the image URL
  const [thumbnailUrl] = useAsset(
    assetIsVideo && generatedImageData?.thumbnail_asset_id
      ? new UniqueEntityID(generatedImageData.thumbnail_asset_id)
      : undefined,
  );

  // For video generation, use thumbnail if available (for videos), otherwise use the asset URL (for images)
  const imageUrlForVideoGeneration = thumbnailUrl || assetUrl;

  if (!message) {
    return null;
  }

  // Check if it's a media placeholder message using the TurnService helper
  const isMediaPlaceholder = TurnService.isPlaceholderTurn(message);
  const placeholderType = isMediaPlaceholder
    ? TurnService.getPlaceholderType(message)
    : null;

  // Media placeholder message (image or video generation)
  if (isMediaPlaceholder && placeholderType) {
    const isVideo = placeholderType === PlaceholderType.VIDEO;

    // Video generation from existing image or regeneration from video
    const handleGenerateVideoFromImage = async () => {
      if (
        !selectedOption?.assetId ||
        !imageUrlForVideoGeneration ||
        isGeneratingVideoFromImage ||
        !onGenerateVideoFromImage
      )
        return;

      setIsGeneratingVideoFromImage(true);

      try {
        // Call the parent's video generation function
        // Use thumbnail for videos (regeneration) or original image for first generation
        await onGenerateVideoFromImage(
          messageId,
          imageUrlForVideoGeneration,
          content || "",
          content || "",
        );

        toast.success("Video generated successfully!");
      } catch (error) {
        console.error("[VIDEO FROM IMAGE] Failed to generate video:", error);
        toast.error("Failed to generate video from image");
        // On failure, we keep the original image (no changes needed)
      } finally {
        setIsGeneratingVideoFromImage(false);
      }
    };

    return (
      <MediaPlaceholderMessage
        content={content || ""}
        assetId={selectedOption?.assetId}
        isVideo={isVideo}
        onDelete={() => deleteMessage(messageId)}
        onGenerateVideo={handleGenerateVideoFromImage} // Always show button for regeneration
        isGeneratingVideo={isGeneratingVideoFromImage}
      />
    );
  }

  // Scenario message (regular scenario without media)
  if (
    typeof message.characterCardId === "undefined" &&
    typeof message.characterName === "undefined"
  ) {
    return (
      <ScenarioMessageItem
        content={content}
        onEdit={(content) => editMessage(messageId, content)}
        onDelete={() => deleteMessage(messageId)}
      />
    );
  }

  const isUser = userCharacterCardId
    ? userCharacterCardId.equals(message.characterCardId)
    : typeof message.characterCardId === "undefined";

  return (
    <MessageItemInternal
      messageId={messageId}
      sessionId={message.sessionId}
      characterCardId={message.characterCardId}
      isUser={isUser}
      content={content}
      translation={translation}
      selectedOptionIndex={message.selectedOptionIndex}
      optionsLength={message.options.length}
      disabled={disabled}
      streaming={typeof streaming !== "undefined"}
      streamingAgentName={streaming?.agentName}
      streamingModelName={streaming?.modelName}
      assetId={selectedOption?.assetId}
      dataStoreFields={sortedDataStoreFields}
      onEdit={(content) => editMessage(messageId, content)}
      onDelete={() => deleteMessage(messageId)}
      onPrevOption={() => selectOption(messageId, "prev")}
      onNextOption={() => selectOption(messageId, "next")}
      onRegenerate={() => generateOption(messageId)}
      onUpdateAssetId={async (assetId) => {
        // Update the option with the new assetId
        try {
          const turn = await fetchTurn(messageId);

          // Update the selected option with the new assetId
          turn.setAssetId(assetId);

          // Save the updated turn
          const result = await updateTurnMutation.mutateAsync({
            turn: turn,
          });
          if (result.isFailure) {
            console.error("Failed to update turn:", result.getError());
          } else {
            // Invalidate the turn query to trigger re-render
            await queryClient.invalidateQueries({
              queryKey: turnQueries.detail(messageId).queryKey,
            });
          }
        } catch (error) {
          console.error("Failed to update asset ID:", error);
        }
      }}
      onGenerateVideoFromImage={
        onGenerateVideoFromImage
          ? async (imageUrl: string, prompt: string, userPrompt: string) => {
              await onGenerateVideoFromImage(
                messageId,
                imageUrl,
                prompt,
                userPrompt,
              );
            }
          : undefined
      }
    />
  );
};

const SelectScenarioModal = ({
  onSkip,
  onAdd,
  renderedScenarios,
  onRenderScenarios,
  sessionId,
  plotCardId,
}: {
  onSkip: () => void;
  onAdd: (scenarioIndex: number) => void;
  renderedScenarios: Array<{ name: string; description: string }> | null;
  onRenderScenarios: () => void;
  sessionId: string;
  plotCardId: string;
}) => {
  const isMobile = useIsMobile();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState(false);

  // Render scenarios on mount and when plotCardId changes
  useEffect(() => {
    onRenderScenarios();
  }, [plotCardId, onRenderScenarios]);

  // Reset selected index when sessionId or plotCardId changes
  useEffect(() => {
    setSelectedScenarioIndex(null);
  }, [sessionId, plotCardId]);

  // Handle adding scenario
  const handleAddScenario = async () => {
    if (selectedScenarioIndex !== null) {
      setIsAddingScenario(true);
      try {
        await onAdd(selectedScenarioIndex);
      } finally {
        setIsAddingScenario(false);
      }
    }
  };

  if (isMobile) {
    return null; // Mobile uses Dialog component instead
  }

  // Always show scenario selection view directly
  if (renderedScenarios) {
    // Scenario selection view
    return (
      <div className="bg-background-surface-2 outline-border-light mx-auto inline-flex w-[600px] flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg p-6 outline-1">
        <div className="flex flex-col items-end justify-start gap-6 self-stretch">
          <div className="flex flex-col items-start justify-start gap-2 self-stretch">
            <div className="text-text-primary justify-start self-stretch text-2xl font-semibold">
              Scenario
            </div>
            <div className="text-text-body justify-start self-stretch text-base leading-tight font-medium">
              Select a scenario for your new session.
            </div>
          </div>
          <div className="relative self-stretch">
            <ScrollAreaSimple className="flex max-h-[600px] flex-col items-start justify-start gap-4">
              {renderedScenarios.length > 0 ? (
                renderedScenarios.map((scenario, index) => (
                  <ScenarioItem
                    key={index}
                    name={scenario.name}
                    contents={scenario.description}
                    active={selectedScenarioIndex === index}
                    onClick={() => {
                      setSelectedScenarioIndex(index);
                    }}
                  />
                ))
              ) : (
                <div className="inline-flex w-full flex-col items-start justify-start gap-4 self-stretch py-6">
                  <div className="text-text-body justify-start self-stretch text-center text-2xl font-bold">
                    No scenarios yet
                  </div>
                  <div className="text-background-surface-5 justify-start self-stretch text-center text-base leading-normal font-medium">
                    Start by adding a scenario to your plot card.
                    <br />
                    Scenarios set the opening scene for your session <br />—
                    like a narrator kicking things off.
                  </div>
                </div>
              )}
            </ScrollAreaSimple>
          </div>
          <div className="inline-flex items-center justify-start gap-2">
            <Button
              variant="ghost"
              className="flex h-auto min-w-20 items-center justify-center gap-2 rounded-[20px] px-3 py-2.5"
              onClick={onSkip}
            >
              <div className="text-button-background-primary justify-center text-sm leading-tight font-medium">
                Skip
              </div>
            </Button>
            <Button
              disabled={selectedScenarioIndex === null || isAddingScenario}
              onClick={handleAddScenario}
              className="bg-button-background-primary inline-flex h-10 min-w-20 flex-col items-center justify-center gap-2.5 rounded-[20px] px-4 py-2.5"
            >
              <div className="inline-flex items-center justify-start gap-2">
                {isAddingScenario && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <div className="text-button-foreground-primary justify-center text-sm leading-tight font-semibold">
                  Add
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while scenarios are being rendered
  return null;
};

const getSchemaTypeIcon = (type: string) => {
  switch (type) {
    case "string":
      return <CaseUpper size={20} />;
    case "number":
      return <Hash size={20} />;
    case "integer":
      return <SvgIcon name="integer" size={20} />;
    case "boolean":
      return <ToggleRight size={20} />;
    default:
      return <></>;
  }
};

const SortableDataSchemaFieldItem = ({
  name,
  type,
  value,
  onEdit,
}: {
  name: string;
  type: string;
  value: string;
  onEdit?: (name: string, value: string) => Promise<void>;
}) => {
  // Edit value
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState<string>(value ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(name, editedValue);
    setIsEditing(false);
  }, [editedValue, name, onEdit]);
  const onEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditedValue(value);
  }, [value]);

  // Sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Collapse long value
  const valueRef = useRef<HTMLDivElement>(null);
  const [isOpenValue, setIsOpenValue] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  useEffect(() => {
    const element = valueRef.current;
    if (element) {
      setIsClamped(element.scrollHeight > element.clientHeight);
    }
  }, [value]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="my-[24px] flex flex-row gap-[8px] pr-[24px] pl-[8px]"
    >
      <div className="shrink-0">
        <div
          className="grid size-[24px] cursor-grab place-items-center active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} className="text-text-info" />
        </div>
      </div>
      <div className="flex grow flex-col gap-[8px]">
        <div className="group/field-name flex flex-row items-center justify-between">
          <div className="text-text-subtle group-hover/field-name:text-text-primary flex flex-row items-center gap-[8px]">
            {getSchemaTypeIcon(type)}
            <div className="text-[14px] leading-[20px] font-[500]">{name}</div>
            {onEdit &&
              (isEditing ? (
                <>
                  <Check
                    size={20}
                    className="!text-text-body"
                    onClick={() => {
                      onEditDone();
                    }}
                  />
                  <X
                    size={20}
                    className="!text-text-body"
                    onClick={() => {
                      onEditCancel();
                    }}
                  />
                </>
              ) : (
                <Pencil
                  size={20}
                  className="!text-text-body hidden group-hover/field-name:inline-block"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                />
              ))}
          </div>
          {isClamped && (
            <div
              className="text-background-surface-5"
              onClick={() => {
                setIsOpenValue((open) => !open);
              }}
            >
              {isOpenValue ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
            )}
            autoFocus
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEditDone();
              }
            }}
          />
        ) : (
          <div
            ref={valueRef}
            className={cn("text-text-primary", !isOpenValue && "line-clamp-3")}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
};

export {
  MessageItem,
  MessageItemInternal,
  SelectScenarioModal,
  SortableDataSchemaFieldItem,
};
