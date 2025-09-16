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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CaseUpper,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  GripVertical,
  Hash,
  History,
  Loader2,
  Pencil,
  RefreshCcw,
  Send,
  Shuffle,
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
import { parseAiSdkErrorMessage } from "@/shared/utils/error-utils";
import { logger } from "@/shared/utils/logger";
import { TemplateRenderer } from "@/shared/utils/template-renderer";
import { cloneDeep } from "lodash-es";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { useImageGeneration } from "@/components-v2/card/panels/card-panel/components/image-generator/hooks/use-image-generation";
import { useVideoGeneration } from "@/components-v2/card/panels/card-panel/components/image-generator/hooks/use-video-generation";
import { useEnhancedGenerationPrompt } from "@/components-v2/session/hooks/use-enhanced-generation-prompt";
import { IMAGE_MODELS } from "@/app/stores/model-store";
import { flowQueries } from "@/app/queries/flow-queries";
import { generatedImageQueries } from "@/app/queries/generated-image/query-factory";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { CardService } from "@/app/services";
import {
  addMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { useAppStore } from "@/app/stores/app-store";
import { AutoReply, useSessionStore } from "@/app/stores/session-store";
import { Avatar } from "@/components-v2/avatar";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { ScenarioItem } from "@/components-v2/scenario/scenario-item";
import { InlineChatStyles } from "@/components-v2/session/inline-chat-styles";
import { MediaPlaceholderMessage } from "@/components-v2/session/media-placeholder-message";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { toastError } from "@/components-v2/ui/toast-error";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { CharacterCard, PlotCard } from "@/modules/card/domain";
import { TranslationConfig } from "@/modules/session/domain/translation-config";
import { DataStoreSavedField, Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";
import { PlaceholderType } from "@/modules/turn/domain/placeholder-type";
import { DataStoreSchemaField } from "@/modules/flow/domain/flow";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import delay from "lodash-es/delay";

const MessageItemInternal = ({
  messageId,
  sessionId,
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
  onUpdateAssetId,
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
          "flex gap-[16px] items-start",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "user-chat-style" : "ai-chat-style",
        )}
      >
        <div
          className="flex flex-col gap-[8px] items-center"
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        >
          {characterCardId ? (
            <>
              <div
                className={cn(
                  "shrink-0 overflow-hidden rounded-full grid place-items-center select-none border-1 border-border-selected-inverse/50",
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
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : icon ? (
                  <img
                    src={icon}
                    alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/img/placeholder/avatar.png"
                    alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="max-w-[80px] truncate font-medium text-[16px] leading-[19px] text-text-primary">
                {characterCard?.props.name}
              </div>
            </>
          ) : (
            <>
              <Avatar src="/img/message-avatar-default.svg" size={80} />
              <div className="max-w-[80px] truncate font-medium text-[16px] leading-[19px] text-text-primary">
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
              "max-w-[600px] p-[16px] rounded-[8px] chat-style-chat-bubble",
              // !streaming && "min-w-[300px]",
            )}
          >
            {/* Display generated image if exists */}
            {assetUrl && (
              <div className="mb-[12px] rounded-[8px] overflow-hidden">
                {assetIsVideo ? (
                  <video
                    ref={generatedVideoRef}
                    src={assetUrl}
                    controls
                    className="w-full h-auto rounded-[8px]"
                  />
                ) : (
                  <img
                    src={assetUrl}
                    alt="Generated content"
                    className="w-full h-auto rounded-[8px]"
                  />
                )}
              </div>
            )}

            {isEditing && !disabled ? (
              <TextareaAutosize
                className={cn(
                  "w-[568px] p-0 border-0 outline-0 bg-transparent rounded-none no-resizer",
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
                        className="overflow-x-auto max-w-full my-2 p-3 rounded-md"
                      >
                        {children}
                      </pre>
                    ),
                    code: ({ children, className }) => {
                      const isInlineCode = !className;
                      return isInlineCode ? (
                        <code className="px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ) : (
                        <code className="text-sm whitespace-pre-wrap break-words">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {translation ?? content}
                </Markdown>
                {!streaming && isShowDataStore && (
                  <div className="mt-[10px] p-[16px] border-[1px] rounded-[12px] bg-background-surface-0/5 data-history">
                    <div className="mb-[16px] flex flex-row gap-[8px] items-center text-text-subtle">
                      <History size={20} />
                      <div className="font-[500] text-[14px] leading-[20px]">
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
              "px-[16px] py-[8px] rounded-[8px] flex flex-row items-center",
              "transition-opacity duration-200 ease-in-out opacity-0",
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
                  className="mr-[2px] animate-spin chat-style-text"
                />
                <div className="mr-[8px] font-[400] text-[16px] leading-[25.6px]">
                  {streamingAgentName}
                </div>
                <div className="font-[600] text-[16px] leading-[25.6px]">
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
                <div className="flex flex-row gap-[2px] items-center">
                  <button className="cursor-pointer" onClick={onPrevOption}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="min-w-[24px] text-center font-[600] text-[10px] leading-[12px] select-none">{`${selectedOptionIndex + 1} / ${optionsLength}`}</div>
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
          "relative mx-auto w-full min-w-[400px] max-w-[890px] p-[24px] rounded-[4px]",
          "bg-background-container font-[400] text-[16px] leading-[19px] text-text-placeholder",
          "transition-all duration-200 ease-in-out",
          "group-hover/scenario:inset-ring-1 group-hover/scenario:inset-ring-text-primary",
          isEditing && "inset-ring-1 inset-ring-text-primary",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "w-full p-0 -mb-[4px] border-0 outline-0 bg-transparent rounded-none no-resizer",
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
              "p-[8px] rounded-[8px] cursor-pointer",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-1 hover:inset-ring-text-primary",
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
              "p-[8px] rounded-[8px] cursor-pointer",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-1 hover:inset-ring-text-primary",
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

      console.log("[VIDEO FROM IMAGE] Starting video generation:", {
        assetId: selectedOption.assetId,
        imageUrl: imageUrlForVideoGeneration,
        isVideo: assetIsVideo,
        usingThumbnail: !!thumbnailUrl,
        content,
      });

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
          const turn = (await TurnService.getTurn.execute(messageId))
            .throwOnFailure()
            .getValue();

          // Update the selected option with the new assetId
          turn.setAssetId(assetId);

          // Save the updated turn
          const result = await TurnService.updateTurn.execute(turn);
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

const UserInputCharacterButton = ({
  characterCardId,
  icon,
  label,
  isUser = false,
  onClick = () => {},
  isHighLighted = false,
}: {
  characterCardId?: UniqueEntityID;
  icon?: React.ReactNode;
  label?: string | React.ReactNode;
  isUser?: boolean;
  onClick?: () => void;
  isHighLighted?: boolean;
}) => {
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [characterIcon, characterIconIsVideo] = useAsset(
    characterCard?.props.iconAssetId,
  );

  if (characterCardId && !characterCard) {
    return null;
  }

  return (
    <div
      className="group relative flex flex-col gap-[4px] items-center cursor-pointer"
      onClick={onClick}
    >
      {characterCard ? (
        <>
          <Avatar
            src={characterIcon}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={48}
            isVideo={characterIconIsVideo}
            className={cn(
              isHighLighted &&
                "shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)] border-2 border-primary-normal",
            )}
          />
          <div
            className={cn(
              "truncate text-[12px] leading-[15px] font-[500] text-text-primary",
              "max-w-[48px]",
            )}
          >
            {characterCard.props.name}
          </div>
          <div
            className={cn(
              "absolute top-0 left-0 size-[48px] pointer-events-none",
              "border-[3px] border-border-selected-inverse rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity ease-out duration-300",
            )}
          />
          {isUser && (
            <div className="absolute top-0 right-0 border-[2px] rounded-full size-[12px] bg-status-optional" />
          )}
        </>
      ) : (
        <>
          <div
            className={cn(
              "grid place-items-center size-[48px] rounded-full text-text-primary",
              "bg-background-surface-4 group-hover:bg-background-surface-5 transition-colors ease-out duration-300 border-1 border-border-normal",
              isHighLighted &&
                "shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)] border-2 border-primary-normal",
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "font-[500] text-[12px] leading-[15px] text-text-body text-center",
              "max-w-[72px]",
            )}
          >
            {label}
          </div>
        </>
      )}
    </div>
  );
};

const UserInputAutoReplyButton = ({
  autoReply,
  setAutoReply,
  characterCount,
}: {
  autoReply: AutoReply;
  setAutoReply: (autoReply: AutoReply) => void;
  characterCount: number;
}) => {
  const hasMultipleCharacters = characterCount > 1;

  return (
    <div
      className="group relative flex flex-col gap-[4px] items-center cursor-pointer"
      onClick={() => {
        switch (autoReply) {
          case AutoReply.Off:
            setAutoReply(AutoReply.Random);
            break;
          case AutoReply.Random:
            // Skip Rotate option if only one character
            setAutoReply(
              hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off,
            );
            break;
          case AutoReply.Rotate:
            setAutoReply(AutoReply.Off);
            break;
          default:
            throw new Error("Unknown auto reply");
        }
      }}
    >
      <div
        className={cn(
          "m-[2px] grid place-items-center size-[44px] rounded-[5.25px]",
          "transition-colors ease-out duration-300 border-1 border-border-normal",
          autoReply === AutoReply.Off
            ? "bg-background-surface-4 group-hover:bg-background-surface-3"
            : "bg-background-surface-5 group-hover:bg-background-surface-4",
        )}
      >
        {autoReply === AutoReply.Off && (
          <div
            className={cn(
              "text-[15.75px] text-text-subtle leading-[19px] font-[600]",
              "transition-colors group-hover:text-text-primary",
            )}
          >
            Off
          </div>
        )}
        {autoReply === AutoReply.Random && <Shuffle size={21} />}
        {autoReply === AutoReply.Rotate && <SvgIcon name="rotate" size={21} />}
      </div>
      <div
        className={cn(
          "w-[105px] font-[600] text-[12px] leading-[15px] text-text-body text-center select-none",
        )}
      >
        {autoReply === AutoReply.Off ? "Auto-reply off" : "Auto-reply on"}
        <div className="min-h-[15px] font-[400] mt-1">
          {autoReply === AutoReply.Random && "Random character"}
          {autoReply === AutoReply.Rotate && "All characters"}
        </div>
      </div>
    </div>
  );
};

const UserInputs = ({
  userCharacterCardId,
  aiCharacterCardIds = [],
  generateCharacterMessage,
  addUserMessage,
  disabled = false,
  streamingMessageId,
  onStopGenerate,
  autoReply,
  setAutoReply,
  isOpenAddPlotCardModal,
  onSkip = () => {},
  onAdd = () => {},
  handleGenerateImageForLastTurn = () => {},
  handleGenerateVideoForLastTurn = () => {},
  isGeneratingGlobalImage = false,
  isGeneratingGlobalVideo = false,
  globalVideoStatus = "",
}: {
  userCharacterCardId?: UniqueEntityID;
  aiCharacterCardIds?: UniqueEntityID[];
  generateCharacterMessage?: (characterCardId: UniqueEntityID) => void;
  addUserMessage?: (messageContent: string) => void;
  disabled?: boolean;
  isOpenSettings?: boolean;
  streamingMessageId?: UniqueEntityID;
  onStopGenerate?: () => void;
  autoReply: AutoReply;
  setAutoReply: (autoReply: AutoReply) => void;
  isOpenAddPlotCardModal?: boolean;
  onSkip?: () => void;
  onAdd?: () => void;
  handleGenerateImageForLastTurn?: () => void;
  handleGenerateVideoForLastTurn?: () => void;
  isGeneratingGlobalImage?: boolean;
  isGeneratingGlobalVideo?: boolean;
  globalVideoStatus?: string;
}) => {
  const isMobile = useIsMobile();
  const isGroupButtonDonNotShowAgain =
    useAppStore.use.isGroupButtonDonNotShowAgain();
  const setIsGroupButtonDonNotShowAgain =
    useAppStore.use.setIsGroupButtonDonNotShowAgain();
  
  // Session onboarding for inference button
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();

  // Shuffle
  const handleShuffle = useCallback(() => {
    const characterCardIds = [userCharacterCardId, ...aiCharacterCardIds];
    const randomIndex = Math.floor(Math.random() * characterCardIds.length);
    const randomCharacterCardId = characterCardIds[randomIndex];
    randomCharacterCardId && generateCharacterMessage?.(randomCharacterCardId);
  }, [aiCharacterCardIds, generateCharacterMessage, userCharacterCardId]);

  // User message
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [messageContent, setMessageContent] = useState<string>("");

  // Guide: Select to prompt a response
  const [isOpenGuide, setIsOpenGuide] = useState(false);
  
  // Show tooltip if either the old guide is open OR the inference button onboarding is not completed
  const shouldShowTooltip = isOpenGuide || !sessionOnboardingSteps.inferenceButton;
  
  const onFocusUserInput = useCallback(() => {
    if (isGroupButtonDonNotShowAgain) {
      return;
    }
    setIsOpenGuide(true);
  }, [isGroupButtonDonNotShowAgain]);
  
  const onCharacterButtonClicked = useCallback(() => {
    setIsOpenGuide(false);
    setIsGroupButtonDonNotShowAgain(true);
    // Mark inference button onboarding step as completed
    setSessionOnboardingStep('inferenceButton', true);
  }, [setSessionOnboardingStep, setIsGroupButtonDonNotShowAgain]);

  return (
    <div className="sticky bottom-0 inset-x-0 pb-[80px] px-[56px]">
      {isOpenAddPlotCardModal && (
        <AddPlotCardModal onSkip={onSkip} onAdd={onAdd} />
      )}

      <div
        className={cn(
          "mx-auto w-full min-w-[400px] max-w-[892px] p-[24px] rounded-[40px] flex flex-col gap-[16px]",
          "bg-[#3b3b3b]/50 backdrop-blur-xl border border-text-primary/10",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip open={shouldShowTooltip}>
            <TooltipTrigger asChild>
              <div className="p-0 flex flex-row justify-between">
                <div
                  className={cn(
                    "flex flex-row gap-[16px]",
                    streamingMessageId && "pointer-events-none opacity-50",
                  )}
                >
                  {userCharacterCardId && (
                    <UserInputCharacterButton
                      characterCardId={userCharacterCardId}
                      onClick={() => {
                        generateCharacterMessage?.(userCharacterCardId);
                        onCharacterButtonClicked();
                      }}
                      isUser
                      isHighLighted={shouldShowTooltip}
                    />
                  )}
                  {aiCharacterCardIds.map((characterCardId) => (
                    <UserInputCharacterButton
                      key={characterCardId.toString()}
                      characterCardId={characterCardId}
                      onClick={() => {
                        generateCharacterMessage?.(characterCardId);
                        onCharacterButtonClicked();
                      }}
                      isHighLighted={shouldShowTooltip}
                    />
                  ))}
                  <UserInputCharacterButton
                    icon={<Shuffle className="min-w-[24px] min-h-[24px]" />}
                    label="Shuffle"
                    onClick={() => {
                      handleShuffle();
                      onCharacterButtonClicked();
                    }}
                    isHighLighted={shouldShowTooltip}
                  />
                  <div className="w-[1px] h-[48px] bg-border-normal mx-2" />
                  <UserInputCharacterButton
                    icon={
                      isGeneratingGlobalImage ? (
                        <Loader2 className="min-w-[24px] min-h-[24px] animate-spin" />
                      ) : (
                        <SvgIcon name="image_gen" size={24} />
                      )
                    }
                    label={
                      isGeneratingGlobalImage ? (
                        "Generating"
                      ) : (
                        <>
                          Generate
                          <br />
                          Image
                        </>
                      )
                    }
                    onClick={() => {
                      if (!isGeneratingGlobalImage) {
                        handleGenerateImageForLastTurn();
                        onCharacterButtonClicked();
                      }
                    }}
                    isHighLighted={false}
                  />
                  {/* Generate Video button - HIDDEN in user input */}
                  {/* <UserInputCharacterButton
                    icon={
                      isGeneratingGlobalVideo ? (
                        <Loader2 className="min-w-[24px] min-h-[24px] animate-spin" />
                      ) : (
                        <SvgIcon name="video_gen" size={24} />
                      )
                    }
                    label={
                      isGeneratingGlobalVideo ? (
                        "Generating"
                      ) : (
                        <>
                          Generate
                          <br />
                          Video
                        </>
                      )
                    }
                    onClick={() => {
                      if (!isGeneratingGlobalVideo) {
                        handleGenerateVideoForLastTurn();
                        onCharacterButtonClicked();
                      }
                    }}
                    isHighLighted={false}
                  /> */}
                </div>
                <div className="shrink-0">
                  <UserInputAutoReplyButton
                    autoReply={autoReply}
                    setAutoReply={setAutoReply}
                    characterCount={aiCharacterCardIds.length}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="py-[12px] px-[16px] ml-[-16px] mb-[12px] bg-background-surface-2 border-1 border-border-selected-primary shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]"
            >
              <div className="font-[600] text-[14px] leading-[20px] text-text-primary">
                Select to prompt a response
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="p-0">
          <div
            className={cn(
              "rounded-[28px] p-[8px] pl-[32px] flex flex-row gap-[16px] items-center",
              "bg-background-surface-2 border border-border-dark",
              !isMobile && "border-1 border-border-selected-inverse/30", // Add border with 50% opacity for desktop only
            )}
          >
            <div className="grow">
              <TextareaAutosize
                maxRows={5}
                placeholder="Type a message"
                className={cn(
                  "w-full p-0 pt-[4.8px] border-0 outline-0 bg-transparent rounded-none no-resizer",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                  "h-[25.6px] min-h-[25.6px]",
                  "text-[16px] leading-[1.6] font-normal",
                  "text-text-primary placeholder:text-text-placeholder",
                )}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendButtonRef.current?.click();
                  }
                }}
                onFocus={onFocusUserInput}
              />
            </div>
            {streamingMessageId ? (
              <Button
                onClick={() => {
                  onStopGenerate?.();
                }}
                className={cn(
                  "h-[40px] bg-background-surface-3 text-text-primary",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                )}
              >
                <div className="size-[10px] bg-text-primary rounded-[1px]" />
              </Button>
            ) : (
              <Button
                ref={sendButtonRef}
                disabled={messageContent.trim() === ""}
                onClick={() => {
                  addUserMessage?.(messageContent);
                  setMessageContent("");
                }}
                className={cn(
                  "h-[40px] bg-background-surface-3 text-text-primary",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                )}
              >
                <Send />
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddPlotCardModal = ({
  onSkip,
  onAdd,
}: {
  onSkip: () => void;
  onAdd: () => void;
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile uses Dialog component instead
  }

  return (
    <div
      className={cn(
        "mx-auto mb-[40px] w-[600px] p-[24px] rounded-[8px]",
        "bg-background-container",
        "flex flex-col gap-[24px]",
      )}
    >
      <div className="font-[400] text-[16px] leading-[24px] text-text-primary">
        Would you like to start from a list of scenarios from the plot card?
        <br />
        Your choice will appear as the first message.
      </div>
      <div className="flex flex-row justify-end gap-[8px]">
        <Button variant="outline" size="lg" onClick={onAdd}>
          Add a Plot card
        </Button>
        <Button size="lg" onClick={onSkip}>
          Skip and start
        </Button>
      </div>
    </div>
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
      <div className="mx-auto w-[600px] p-6 bg-background-surface-2 rounded-lg outline-1 outline-border-light inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <div className="self-stretch flex flex-col justify-start items-end gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch justify-start text-text-primary text-2xl font-semibold">
              Scenario
            </div>
            <div className="self-stretch justify-start text-text-body text-base font-medium leading-tight">
              Select a scenario for your new session.
            </div>
          </div>
          <div className="self-stretch relative">
            <ScrollAreaSimple className="max-h-[600px] flex flex-col justify-start items-start gap-4">
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
                <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-4 py-6">
                  <div className="self-stretch text-center justify-start text-text-body text-2xl font-bold">
                    No scenarios yet
                  </div>
                  <div className="self-stretch text-center justify-start text-background-surface-5 text-base font-medium leading-normal">
                    Start by adding a scenario to your plot card.
                    <br />
                    Scenarios set the opening scene for your session <br />—
                    like a narrator kicking things off.
                  </div>
                </div>
              )}
            </ScrollAreaSimple>
          </div>
          <div className="inline-flex justify-start items-center gap-2">
            <Button
              variant="ghost"
              className="min-w-20 px-3 py-2.5 rounded-[20px] flex justify-center items-center gap-2 h-auto"
              onClick={onSkip}
            >
              <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
                Skip
              </div>
            </Button>
            <Button
              disabled={selectedScenarioIndex === null || isAddingScenario}
              onClick={handleAddScenario}
              className="h-10 min-w-20 px-4 py-2.5 bg-button-background-primary rounded-[20px] inline-flex flex-col justify-center items-center gap-2.5"
            >
              <div className="inline-flex justify-start items-center gap-2">
                {isAddingScenario && (
                  <Loader2 className="animate-spin h-4 w-4" />
                )}
                <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
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
      className="pl-[8px] pr-[24px] flex flex-row gap-[8px] my-[24px]"
    >
      <div className="shrink-0">
        <div
          className="size-[24px] grid place-items-center cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} className="text-text-info" />
        </div>
      </div>
      <div className="grow flex flex-col gap-[8px]">
        <div className="group/field-name flex flex-row justify-between items-center">
          <div className="flex flex-row gap-[8px] items-center text-text-subtle group-hover/field-name:text-text-primary">
            {getSchemaTypeIcon(type)}
            <div className="font-[500] text-[14px] leading-[20px]">{name}</div>
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
              "w-full p-0 border-0 outline-0 bg-transparent rounded-none no-resizer",
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

const SessionMessagesAndUserInputs = ({
  onAddPlotCard,
  isOpenSettings,
  parentRef,
}: {
  onAddPlotCard: () => void;
  isOpenSettings: boolean;
  parentRef?: React.RefObject<HTMLDivElement>;
}) => {
  const isMobile = useIsMobile();

  // Fetch session
  const queryClient = useQueryClient();
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const { data: session } = useQuery(
    sessionQueries.detail(selectedSessionId ?? undefined),
  );
  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(selectedSessionId ?? undefined).queryKey,
    });
  }, [queryClient, selectedSessionId]);

  // Virtualizer setup
  const parentRefInternal = useRef<HTMLDivElement>(null);
  const effectiveParentRef = parentRef || parentRefInternal;
  const rowVirtualizer = useVirtualizer({
    count: session?.turnIds.length ?? 0,
    getScrollElement: () => effectiveParentRef.current,
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
      if (!parentRef?.current) {
        return;
      }
      const wait = options?.wait ?? 50;
      const behavior = options?.behavior ?? "instant";
      delay(() => {
        if (!parentRef.current) {
          return;
        }
        parentRef.current.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: behavior,
        });
      }, wait);
    },
    [parentRef],
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
              const turn = (await TurnService.getTurn.execute(turnId))
                .throwOnFailure()
                .getValue();

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
            const lastTurn = (await TurnService.getTurn.execute(lastTurnId))
              .throwOnFailure()
              .getValue();
            lastDataStore = cloneDeep(lastTurn.dataStore);
          } catch (error) {
            console.warn(`Failed to get last turn's dataStore: ${error}`);
          }
        }

        // Get streaming message
        if (regenerateMessageId) {
          // Get message from database
          const messageOrError =
            await TurnService.getTurn.execute(regenerateMessageId);
          if (messageOrError.isFailure) {
            throw new Error("Message not found");
          }
          streamingMessage = messageOrError.getValue();
        } else {
          // Get character name
          const character = (await CardService.getCard.execute(characterCardId))
            .throwOnFailure()
            .getValue() as CharacterCard;

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
          await SessionService.addMessage.execute({
            sessionId: session.id,
            message: streamingMessage,
          });
          invalidateSession();
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
        for await (const response of flowResult) {
          streamingContent = response.content;
          streamingMessage.setContent(streamingContent);
          streamingVariables = response.variables;
          streamingMessage.setVariables(streamingVariables);
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
          throw new Error("AI returned an empty message.");
        }

        // Update message to database
        await TurnService.updateTurn.execute(streamingMessage);

        // Invalidate turn query
        queryClient.invalidateQueries({
          queryKey: turnQueries.detail(streamingMessage.id).queryKey,
        });
      } catch (error) {
        // Notify error to user
        const parsedError = parseAiSdkErrorMessage(error);
        if (parsedError) {
          toastError({
            title: "Failed to generate message",
            details: parsedError.message,
          });
        } else if (error instanceof Error) {
          if (error.message.includes("Stop generate by user")) {
            toast.info("Generation stopped.");
          } else {
            toastError({
              title: "Failed to generate message",
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
              await SessionService.deleteMessage.execute({
                sessionId: session.id,
                messageId: streamingMessage.id,
              });

              // Invalidate session query
              invalidateSession();
            }
          } else {
            // Update message to database
            await TurnService.updateTurn.execute(streamingMessage);

            // Invalidate turn query
            queryClient.invalidateQueries({
              queryKey: turnQueries.detail(streamingMessage.id).queryKey,
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

        // Add user message
        const userMessageOrError = await addMessage({
          sessionId: session.id,
          characterCardId: session.userCharacterCardId,
          defaultCharacterName: "User",
          messageContent: messageContent,
          isUser: true,
        });
        if (userMessageOrError.isFailure) {
          throw new Error(userMessageOrError.getError());
        }

        // Invalidate session query
        invalidateSession();

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
      await SessionService.saveSession.execute({ session });

      // Invalidate session query
      queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(selectedSessionId ?? undefined)
          .queryKey,
      });
    },
    [session, queryClient, selectedSessionId],
  );

  // Add plot card modal
  const [plotCard] = useCard<PlotCard>(session?.plotCard?.id);
  const [isOpenAddPlotCardModal, setIsOpenAddPlotCardModal] = useState(false);
  const messageCount = session?.turnIds.length ?? 0;
  const plotCardId = session?.plotCard?.id.toString() ?? "";
  const sessionId = session?.id.toString() ?? "";

  useEffect(() => {
    // Check session has plot card
    if (plotCardId !== "") {
      setIsOpenAddPlotCardModal(false);
      return;
    }

    // Check message ids
    if (messageCount > 0) {
      setIsOpenAddPlotCardModal(false);
      return;
    }

    // Show add plot card modal
    setIsOpenAddPlotCardModal(true);
  }, [messageCount, plotCardId]);

  // Select scenario modal
  const [isOpenSelectScenarioModal, setIsOpenSelectScenarioModal] =
    useState(false);
  const plotCardScenarioCount = plotCard?.props.scenarios?.length ?? 0;
  useEffect(() => {
    // Check scenario count
    if (plotCardId === "") {
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
        // Add scenario
        const scenarioMessageOrError = await addMessage({
          sessionId: session.id,
          messageContent: scenario.description,
          isUser: true,
        });
        if (scenarioMessageOrError.isFailure) {
          toastError({
            title: "Failed to add scenario",
            details: scenarioMessageOrError.getError(),
          });
          return;
        }

        // Invalidate session
        invalidateSession();

        // Close modal
        setIsOpenSelectScenarioModal(false);
      } finally {
        // Modal handles its own loading state
      }
    },
    [invalidateSession, renderedScenarios, session],
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: UniqueEntityID, content: string) => {
      // Get message from DB
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        logger.error("Failed to fetch message", messageOrError.getError());
        return;
      }
      const message = messageOrError.getValue();

      // Set content
      message.setContent(content);

      // Save message to DB
      const savedMessageOrError = await TurnService.updateTurn.execute(message);
      if (savedMessageOrError.isFailure) {
        logger.error("Failed to save message", savedMessageOrError.getError());
        return;
      }

      // Invalidate message
      queryClient.invalidateQueries({
        queryKey: turnQueries.detail(messageId).queryKey,
      });
    },
    [queryClient],
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: UniqueEntityID) => {
      // Check session
      if (!session) {
        return;
      }

      // Check if this is a placeholder turn and handle special deletion
      const turnResult = await TurnService.getTurn.execute(messageId);
      if (turnResult.isSuccess) {
        const turn = turnResult.getValue();
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
      const deletedMessageOrError = await SessionService.deleteMessage.execute({
        sessionId: session.id,
        messageId: messageId,
      });
      if (deletedMessageOrError.isFailure) {
        logger.error(
          "Failed to delete message",
          deletedMessageOrError.getError(),
        );
        return;
      }

      // Invalidate session query
      invalidateSession();
    },
    [invalidateSession, session],
  );

  // Select option
  const selectOption = useCallback(
    async (messageId: UniqueEntityID, prevOrNext: "prev" | "next") => {
      // Get message from DB
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        logger.error("Failed to fetch message", messageOrError.getError());
        return;
      }
      const message = messageOrError.getValue();

      // Update selected option
      if (prevOrNext === "prev") {
        message.prevOption();
      } else {
        message.nextOption();
      }

      // Save message to DB
      const savedMessageOrError = await TurnService.updateTurn.execute(message);
      if (savedMessageOrError.isFailure) {
        logger.error("Failed to save message", savedMessageOrError.getError());
        return;
      }

      // Invalidate message
      queryClient.invalidateQueries({
        queryKey: turnQueries.detail(messageId).queryKey,
      });
    },
    [queryClient],
  );

  // Generate option
  const generateOption = useCallback(
    async (messageId: UniqueEntityID) => {
      // Get message from database
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        throw new Error(messageOrError.getError());
      }

      // Generate option
      const message = messageOrError.getValue();
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
  const shouldShowSessionDataTooltip = sessionOnboardingSteps.helpVideo && !sessionOnboardingSteps.sessionData;
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

  // Handler for generating video from an existing image in a message
  const handleGenerateVideoFromImage = useCallback(
    async (
      messageId: UniqueEntityID,
      imageUrl: string,
      prompt: string,
      userPrompt: string,
    ) => {
      console.log("[VIDEO FROM IMAGE] Starting video generation:", {
        messageId: messageId.toString(),
        imageUrl,
        prompt,
        userPrompt,
      });

      try {
        // Generate video using only the generated image (not character images)
        const assetId = await generateVideoBase({
          prompt: prompt, // Use enhanced prompt
          userPrompt: userPrompt, // Keep original for display
          selectedModel: IMAGE_MODELS.SEEDANCE_1_0, // Use Seedance Pro
          imageToImage: true, // We're using the generated image as starting frame
          imageUrl: imageUrl, // Use only the generated image
          videoDuration: 5, // 5 seconds video duration
          ratio: "16:9",
          resolution: "720p",
          isSessionGenerated: true,
        });

        if (assetId) {
          // Update the turn with the video asset
          const turn = (await TurnService.getTurn.execute(messageId))
            .throwOnFailure()
            .getValue();

          // Update the selected option with the new assetId
          turn.setAssetId(assetId);

          // Save the updated turn
          const result = await TurnService.updateTurn.execute(turn);
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
    [generateVideoBase, queryClient],
  );

  // Use the new enhanced generation prompt hook that properly filters turns
  const {
    prompt: enhancedGenerationPrompt,
    imageUrls: imageUrlsForGeneration,
    characterIds: involvedCharacterIds,
  } = useEnhancedGenerationPrompt({
    sessionId: session?.id,
  });

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
        userPrompt: currentOption.content,
        selectedModel: IMAGE_MODELS.SEEDDREAM_4_0,
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
  ]);

  // Generate video for last turn
  const handleGenerateVideoForLastTurn = useCallback(async () => {
    if (!session || !lastTurn || isGeneratingGlobalVideo) return;

    const currentOption = lastTurn.options?.[lastTurn.selectedOptionIndex || 0];
    if (!currentOption) {
      toast.error("No message content to generate video from");
      return;
    }

    console.log("[VIDEO GEN] ========================================");
    console.log("[VIDEO GEN] Starting video generation");
    console.log("[VIDEO GEN] Image URLs to use:", {
      count: imageUrlsForGeneration.length,
      urls: imageUrlsForGeneration.map((url, i) => ({
        index: i + 1,
        type: url?.startsWith("blob:")
          ? "blob"
          : url?.startsWith("data:")
            ? "base64"
            : url?.startsWith("http")
              ? "http"
              : "unknown",
        preview: url?.substring(0, 80) + "...",
      })),
      imageMode: "reference", // Use reference mode for style consistency
      timestamp: new Date().toISOString(),
    });
    console.log(
      "[VIDEO GEN] Prompt:",
      enhancedGenerationPrompt?.substring(0, 200) + "...",
    );
    console.log("[VIDEO GEN] ========================================");

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
      const assetId = await generateVideoBase({
        prompt: enhancedGenerationPrompt || currentOption.content,
        userPrompt: currentOption.content,
        selectedModel: IMAGE_MODELS.SEEDANCE_1_0, // Lite model supports multiple images
        imageToImage: imageUrlsForGeneration.length > 0,
        imageUrls: imageUrlsForGeneration,
        imageMode: "reference", // Use reference mode for style consistency
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
        await SessionService.saveSession.execute({ session });
        // Invalidate session cache to reflect the change immediately
        invalidateSession();
      } catch (error) {
        logger.error("Failed to update data schema order", error);
        toast.error("Failed to update field order");
      }
    },
    [sortedDataSchemaFields, session, invalidateSession],
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
        await TurnService.updateTurn.execute(lastTurn);

        // Invalidate turn query
        queryClient.invalidateQueries({
          queryKey: turnQueries.detail(lastTurn.id).queryKey,
        });
      } catch (error) {
        logger.error("Failed to update data store", error);
        toast.error("Failed to update data store field");
      }
    },
    [lastTurn, queryClient],
  );

  if (!session) {
    return null;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div
        ref={effectiveParentRef}
        id={`session-${session.id}`}
        className={cn(
          "z-10 relative w-full h-full overflow-auto contain-strict session-scrollbar",
          "transition-[padding-right] duration-200 pr-0",
          isDataSchemaUsed && isOpenSessionData && "pr-[320px]",
        )}
      >
        <div
          className="w-full min-h-[calc(100dvh-270px)] relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          <InlineChatStyles
            container={`#session-${session.id}`}
            chatStyles={session.props.chatStyles}
          />

          <div className="relative max-w-[1196px] mx-auto">
            {virtualItems.map((virtualItem) => {
              const messageId = session.turnIds[virtualItem.index];
              const isLastMessage = virtualItem.index === messageCount - 1;

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: 16,
                  }}
                >
                  <MessageItem
                    messageId={messageId}
                    userCharacterCardId={session.userCharacterCardId}
                    translationConfig={session.translation}
                    disabled={!!streamingMessageId}
                    streaming={
                      messageId.equals(streamingMessageId)
                        ? {
                            agentName: streamingAgentName,
                            modelName: streamingModelName,
                          }
                        : undefined
                    }
                    isLastMessage={isLastMessage}
                    dataSchemaOrder={session.dataSchemaOrder}
                    editMessage={editMessage}
                    deleteMessage={deleteMessage}
                    selectOption={selectOption}
                    generateOption={generateOption}
                    onGenerateVideoFromImage={handleGenerateVideoFromImage}
                  />
                </div>
              );
            })}
            {isOpenSelectScenarioModal && (
              <div className="z-[20] absolute w-full flex flex-row py-[100px]">
                <SelectScenarioModal
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
            )}
          </div>
        </div>

        {/* Mobile Add Plot Card Dialog */}
        <Dialog
          open={isOpenAddPlotCardModal && isMobile}
          onOpenChange={(open) => {
            if (!open) {
              setIsOpenAddPlotCardModal(false);
            }
          }}
        >
          <DialogContent
            hideClose
            className="w-80 p-6 bg-background-surface-2 rounded-lg outline-1 outline-border-light inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden"
          >
            <div className="self-stretch flex flex-col justify-start items-end gap-6">
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <DialogTitle className="self-stretch justify-start text-text-primary text-xl font-semibold">
                  Want to add a plot card?
                </DialogTitle>
                <DialogDescription className="self-stretch justify-start text-text-body text-sm font-medium leading-tight">
                  You will not be able to add a scenario, because you have not
                  selected a plot card for this session.
                </DialogDescription>
              </div>
              <div className="inline-flex justify-start items-center gap-2">
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setIsOpenAddPlotCardModal(false);
                    }}
                  >
                    <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
                      Skip
                    </div>
                  </Button>
                </DialogClose>
                <Button
                  size="lg"
                  onClick={() => {
                    setIsOpenAddPlotCardModal(false);
                    onAddPlotCard();
                  }}
                >
                  <div className="inline-flex justify-start items-center gap-2">
                    <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
                      Add plot card
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Select Scenario Prompt Dialog */}
        <Dialog
          open={isOpenSelectScenarioModal && isMobile}
          onOpenChange={(open) => {
            if (!open) {
              setIsOpenSelectScenarioModal(false);
            }
          }}
        >
          <DialogContent hideClose className="max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>Want to add a plot card?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-text-body">
                You will not be able to add a scenario, because you have not
                selected a plot card for this session.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setIsOpenSelectScenarioModal(false);
                  }}
                >
                  Skip
                </Button>
              </DialogClose>
              <Button
                size="lg"
                onClick={() => {
                  renderScenarios();
                  setIsOpenSelectScenarioModal(false);
                  setIsOpenSelectScenarioModal(true);
                }}
              >
                Add plot card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UserInputs
          userCharacterCardId={session.userCharacterCardId}
          aiCharacterCardIds={session.aiCharacterCardIds}
          generateCharacterMessage={generateCharacterMessage}
          addUserMessage={addUserMessage}
          isOpenSettings={isOpenSettings}
          disabled={isOpenAddPlotCardModal || isOpenSelectScenarioModal}
          streamingMessageId={streamingMessageId ?? undefined}
          onStopGenerate={() => {
            refStopGenerate.current?.abort("Stop generate by user");
          }}
          autoReply={session.autoReply}
          setAutoReply={setAutoReply}
          isOpenAddPlotCardModal={isOpenAddPlotCardModal}
          onSkip={() => {
            setIsOpenAddPlotCardModal(false);
          }}
          onAdd={() => {
            onAddPlotCard();
          }}
          handleGenerateImageForLastTurn={handleGenerateImageForLastTurn}
          handleGenerateVideoForLastTurn={handleGenerateVideoForLastTurn}
          isGeneratingGlobalImage={isGeneratingGlobalImage}
          isGeneratingGlobalVideo={isGeneratingGlobalVideo}
          globalVideoStatus={globalVideoStatus}
        />
      </div>

      {/* Data schema toggle & list */}
      <div
        className={cn(
          "absolute top-[72px] bottom-[80px] right-[32px] flex flex-col items-end gap-[16px]",
          !isDataSchemaUsed && "hidden",
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
            console.log("shouldShowSessionDataTooltip", shouldShowSessionDataTooltip);
            setSessionOnboardingStep('sessionData', true);
          }}
          onboarding={shouldShowSessionDataTooltip}
          onboardingTooltip={shouldShowSessionDataTooltip ? "You can edit your session data" : undefined}
          tooltipClassName="!top-[0px] !right-[50px]"
        />
        <div
          className={cn(
            "z-10 relative w-[320px] mt-[48px] rounded-[12px]",
            "bg-[#3b3b3b]/50 backdrop-blur-xl border border-text-primary/10",
            "flex flex-col overflow-hidden",
            "transition-opacity duration-200",
            isOpenSessionData
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none",
          )}
        >
          <div className="shrink-0 h-[72px] p-[16px] border-b-1 border-text-primary/10 flex flex-row items-center text-text-primary">
            {streamingMessageId ? (
              <>
                <SvgIcon
                  name="astrsk_symbol"
                  size={40}
                  className="animate-spin mr-[2px]"
                />
                <div className="font-[400] text-[16px] leading-[25.6px] mr-[4px]">
                  {streamingAgentName}
                </div>
                <div className="font-[600] text-[16px] leading-[25.6px]">
                  {streamingModelName}
                </div>
              </>
            ) : (
              <div className="font-[600] text-[16px] leading-[25.6px]">
                Session data
              </div>
            )}
          </div>
          <div className="relative overflow-hidden">
            <ScrollArea className="w-full h-full">
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
    </>
  );
};

export { MessageItemInternal, SessionMessagesAndUserInputs, UserInputs };
