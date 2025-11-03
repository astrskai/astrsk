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

import { cn } from "@/shared/lib";

import { MediaPlaceholderMessage } from "./media-placeholder-message";

import { SvgIcon } from "@/shared/ui";
import { CharacterCard } from "@/entities/card/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { DataStoreSavedField } from "@/entities/turn/domain/option";

import { PlaceholderType } from "@/entities/turn/domain/placeholder-type";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import ScenarioMessage from "./scenario-message";

const MessageAvatar = ({
  characterCard,
  icon,
  iconIsVideo,
  avatarVideoRef,
  onMouseEnter,
  onMouseLeave,
}: {
  characterCard?: CharacterCard;
  icon?: string | null;
  iconIsVideo?: boolean;
  avatarVideoRef?: React.RefObject<HTMLVideoElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center",
        // Desktop: gap
        "gap-[8px]",
        // Mobile: smaller gap
        "max-md:gap-[4px]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "border-border-selected-inverse/50 grid shrink-0 place-items-center overflow-hidden rounded-full border-1 select-none",
          !icon && "bg-background-surface-3",
          // Desktop: 80px
          "h-[80px] w-[80px]",
          // Mobile: 48px
          "max-md:h-[48px] max-md:w-[48px]",
        )}
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
            src={
              characterCard
                ? "/img/placeholder/avatar.png"
                : "/img/message-avatar-default.svg"
            }
            alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? "User"}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div
        className={cn(
          "text-text-primary truncate font-medium",
          // Desktop: size
          "max-w-[80px] text-[16px] leading-[19px]",
          // Mobile: smaller
          "max-md:max-w-[48px] max-md:text-[12px] max-md:leading-[14px]",
        )}
      >
        {characterCard?.props.name ?? "User"}
      </div>
    </div>
  );
};

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
    <div
      className={cn(
        "group/message relative",
        // Desktop: horizontal padding
        "px-[56px]",
        // Mobile: horizontal padding
        "max-md:px-[16px]",
      )}
      tabIndex={0}
    >
      <div
        className={cn(
          "flex items-start",
          // Desktop: gap
          "gap-[16px]",
          // Mobile: smaller gap
          "max-md:gap-[12px]",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "user-chat-style" : "ai-chat-style",
        )}
      >
        <MessageAvatar
          characterCard={characterCardId ? characterCard : undefined}
          icon={icon}
          iconIsVideo={iconIsVideo}
          avatarVideoRef={avatarVideoRef}
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-[8px]",
            isUser ? "items-end" : "items-start",
          )}
          onMouseEnter={() => handleMediaHover(true)}
          onMouseLeave={() => handleMediaHover(false)}
        >
          <div
            className={cn(
              "chat-style-chat-bubble rounded-[8px] p-[8px] break-words md:p-[16px]",
              // Desktop: max width
              "max-w-[600px]",
              // Mobile: same behavior (text length only)
              "max-md:max-w-full",
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
                  "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                  "break-words",
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
              "flex flex-row items-center rounded-[8px] px-[8px] py-[4px] md:px-[16px] md:py-[8px]",
              "chat-style-chat-bubble message-buttons",
              // Desktop: hover to show
              "opacity-0 transition-opacity duration-200 ease-in-out",
              "md:group-hover/message:opacity-100",
              // Mobile: always visible with touch support
              "max-md:opacity-100",
              !streaming && disabled && "!opacity-0",
              streaming && streamingAgentName && "opacity-100",
            )}
          >
            {streaming && streamingAgentName ? (
              <div
                className={cn(
                  "flex flex-row items-center",
                  // Mobile: smaller text
                  "max-md:text-[14px]",
                )}
              >
                <SvgIcon
                  name="astrsk_symbol"
                  size={28}
                  className={cn(
                    "chat-style-text mr-[2px] animate-spin",
                    // Mobile: smaller icon
                    "max-md:h-[20px] max-md:w-[20px]",
                  )}
                />
                <div
                  className={cn(
                    "mr-[8px] font-[400]",
                    // Desktop
                    "text-[16px] leading-[25.6px]",
                    // Mobile
                    "max-md:text-[14px] max-md:leading-[20px]",
                  )}
                >
                  {streamingAgentName}
                </div>
                <div
                  className={cn(
                    "font-[600]",
                    // Desktop
                    "text-[16px] leading-[25.6px]",
                    // Mobile
                    "max-md:text-[14px] max-md:leading-[20px]",
                  )}
                >
                  {streamingModelName}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-row items-center",
                  // Desktop: gap
                  "gap-[12px]",
                  // Mobile: smaller gap
                  "max-md:gap-[8px]",
                )}
              >
                {isEditing ? (
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={onEditDone}
                  >
                    <Check
                      className={cn(
                        // Desktop
                        "h-[20px] w-[20px]",
                        // Mobile
                        "max-md:h-[18px] max-md:w-[18px]",
                      )}
                    />
                  </button>
                ) : (
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={async () => {
                      setEditedContent(content ?? "");
                      setIsEditing(true);
                    }}
                  >
                    <SvgIcon
                      name="edit"
                      className={cn(
                        // Desktop
                        "h-[20px] w-[20px]",
                        // Mobile
                        "max-md:h-[18px] max-md:w-[18px]",
                      )}
                    />
                  </button>
                )}
                {isShowDataStore ? (
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={() => {
                      setIsShowDataStore(false);
                    }}
                  >
                    <SvgIcon
                      name="history_solid"
                      className={cn(
                        // Desktop
                        "h-[20px] w-[20px]",
                        // Mobile
                        "max-md:h-[18px] max-md:w-[18px]",
                      )}
                    />
                  </button>
                ) : (
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={() => {
                      setIsShowDataStore(true);
                    }}
                  >
                    <History
                      className={cn(
                        // Desktop
                        "h-[20px] w-[20px]",
                        // Mobile
                        "max-md:h-[18px] max-md:w-[18px]",
                      )}
                    />
                  </button>
                )}
                <button
                  className={cn(
                    "cursor-pointer",
                    // Mobile: larger touch target
                    "max-md:p-[4px]",
                  )}
                  onClick={onDelete}
                >
                  <Trash2
                    className={cn(
                      // Desktop
                      "h-[20px] w-[20px]",
                      // Mobile
                      "max-md:h-[18px] max-md:w-[18px]",
                    )}
                  />
                </button>
                <div className="flex flex-row items-center gap-[2px]">
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={onPrevOption}
                  >
                    <ChevronLeft
                      className={cn(
                        // Desktop
                        "h-[16px] w-[16px]",
                        // Mobile
                        "max-md:h-[14px] max-md:w-[14px]",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "min-w-[24px] text-center font-[600] select-none",
                      // Desktop
                      "text-[10px] leading-[12px]",
                      // Mobile
                      "max-md:text-[9px] max-md:leading-[11px]",
                    )}
                  >{`${selectedOptionIndex + 1} / ${optionsLength}`}</div>
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={onNextOption}
                  >
                    <ChevronRight
                      className={cn(
                        // Desktop
                        "h-[16px] w-[16px]",
                        // Mobile
                        "max-md:h-[14px] max-md:w-[14px]",
                      )}
                    />
                  </button>
                </div>
                <button
                  className={cn(
                    "cursor-pointer",
                    // Mobile: larger touch target
                    "max-md:p-[4px]",
                  )}
                  onClick={onRegenerate}
                >
                  <RefreshCcw
                    className={cn(
                      // Desktop
                      "h-[20px] w-[20px]",
                      // Mobile
                      "max-md:h-[18px] max-md:w-[18px]",
                    )}
                  />
                </button>
              </div>
            )}
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
      <ScenarioMessage
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

export { MessageItem, MessageItemInternal, SortableDataSchemaFieldItem };
