import { useState, useRef, useEffect } from "react";
import { Card, CharacterCard } from "@/modules/card/domain";
import { CardType } from "@/modules/card/domain";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { generatedImageKeys } from "@/app/queries/generated-image/query-factory";
import { TradingCard } from "@/features/card/components/trading-card";
import { useCardPanelContext } from "@/features/card/panels/card-panel-provider";
import { CardItem } from "@/widgets/left-navigation/card-list";
import { useAsset } from "@/app/hooks/use-asset";
import { cn } from "@/shared/lib";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { cardQueries, useUpdateCardTitle } from "@/app/queries/card";
import { useUpdateCardIconAsset } from "@/app/queries/card/mutations";
import { BookOpen, Pencil, Check, X, Image } from "lucide-react";
import { Avatar, Button, ButtonPill, SvgIcon } from "@/shared/ui";
import { useLeftNavigationWidth } from "@/widgets/left-navigation/hooks/use-left-navigation-width";
import { useAppStore } from "@/app/stores/app-store";

interface CardPanelProps {
  cardId: string;
  card?: Card | null;
}

type CardPanelType =
  | "metadata"
  | "content"
  | "lorebooks"
  | "scenarios"
  | "variables"
  | "imageGenerator"
  | "vibe";

// Trading card item component with proper scaling
const TradingCardItem = ({
  cardId,
  isActive,
  onClick,
  disabled,
  placeholder,
}: {
  cardId?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[196/289] w-full max-w-[320px] rounded-[8px]",
        !cardId && "bg-background-input",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        <TradingCard cardId={cardId} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-background-dialog px-4 text-center">
            {placeholder}
          </div>
        </div>
      )}
      <div className="ring-border-light pointer-events-none absolute inset-0 rounded-[19px] ring-2" />
      {/*
      todo: remove this
      */}
      {/*
      {isActive ? (
        <div className="absolute inset-0 rounded-[19px] ring-2 ring-border-light pointer-events-none" />
      ) : (
        // Default border
        <div className="absolute inset-0 rounded-[19px] ring-2 ring-border-light pointer-events-none" />
      )} */}
    </div>
  );
};

export function CardPanel({ cardId }: CardPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openPanel, panelVisibility } = useCardPanelContext();
  const queryClient = useQueryClient();
  const subscribed = useAppStore.use.subscribed();
  const setIsOpenSubscribeNudge = useAppStore.use.setIsOpenSubscribeNudge();

  // Use fine-grained mutation for title updates with optimistic updates
  const updateTitle = useUpdateCardTitle(cardId);
  const updateIconAsset = useUpdateCardIconAsset(cardId);

  // Get left navigation state for conditional margins
  const { isExpanded, isMobile } = useLeftNavigationWidth();

  // Use React Query to get card data
  const { data: cardFromQuery } = useQuery(cardQueries.detail(cardId));

  // Use provided card or the one from query
  const card = cardFromQuery;

  // Vibe Coding handler - opens the local vibe panel instead of global right panel
  const handleVibeCodingToggle = () => {
    if (!card) return;
    handleOpenPanel("vibe");
  };

  // Helper function to extract character name from card
  const getCharacterName = (card: Card): string => {
    if (card.props.type === CardType.Character) {
      // Cast to CharacterCard to access the name property
      return (
        (card as CharacterCard).props.name || card.props.title || "Untitled"
      );
    }
    return card.props.title || "Untitled";
  };

  // Get the avatar image URL
  const [avatarUrl, isAvatarVideo] = useAsset(card?.props.iconAssetId);

  const handleOpenPanel = (panelType: CardPanelType) => {
    openPanel(panelType);
  };

  const handleSaveTitle = async () => {
    if (!card || editedTitle === card.props.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      // Use the fine-grained mutation with optimistic updates
      await updateTitle.mutateAsync(editedTitle);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error saving card title:", error);
      // The mutation will handle rolling back optimistic updates on error
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !card) return;

    setIsUploadingAvatar(true);
    try {
      // Step 1: Create asset first
      const assetResult = await AssetService.saveFileToAsset.execute({ file });

      if (assetResult.isSuccess) {
        const asset = assetResult.getValue();

        // Step 2: Add to gallery FIRST (this becomes the source of truth)
        const generatedImageResult =
          await GeneratedImageService.saveGeneratedImageFromAsset.execute({
            assetId: asset.id,
            name: file.name.replace(/\.[^/.]+$/, ""),
            prompt: `Card avatar for ${card.props.title || "Untitled"}`,
            style: "uploaded",
            associatedCardId: card.id,
          });

        if (generatedImageResult.isSuccess) {
          // Step 3: Update card icon using mutation (handles all card cache invalidation)
          try {
            await updateIconAsset.mutateAsync(asset.id.toString());

            // Only need to invalidate generated images - card queries handled by mutation
            await queryClient.invalidateQueries({
              queryKey: generatedImageKeys.cardImages(card.id.toString()),
            });
            await queryClient.invalidateQueries({
              queryKey: generatedImageKeys.lists(),
            });
          } catch (error) {
            console.error("Failed to update card icon:", error);
          }
        } else {
          console.error(
            "Failed to add image to gallery:",
            generatedImageResult.getError(),
          );
        }
      } else {
        console.error("Failed to upload file:", assetResult.getError());
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploadingAvatar(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditButtonClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  if (!card) {
    return (
      <div className="text-text-subtle bg-background-surface-2 h-full w-full p-4">
        Card not found
      </div>
    );
  }

  return (
    <div className="bg-background-surface-1 flex h-full w-full flex-col">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header section with card title and panel buttons */}
      <div className="flex w-full flex-col gap-4 p-4">
        {/* Card name header */}
        <div
          className={cn(
            "bg-background-surface-3 flex items-center justify-between gap-2 rounded-lg px-4 py-2 transition-all duration-200",
            isMobile || isExpanded
              ? "ml-0 w-full"
              : "ml-12 w-[calc(100%-48px)]",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
            <div className="text-text-body text-xs font-normal whitespace-nowrap">
              Card title
            </div>
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="text-text-primary border-text-primary max-w-full min-w-[80px] border-b bg-transparent text-xs font-semibold outline-none"
                  style={{
                    width: `${Math.max(editedTitle.length * 6 + 16, 80)}px`,
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={updateTitle.isPending || updateTitle.isEditing}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Check className="text-status-success h-3 w-3" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <div className="text-text-primary truncate text-xs font-semibold">
                  {card.props.title || "Untitled Card"}
                </div>
                <button
                  onClick={() => {
                    setEditedTitle(card.props.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Pencil className="text-text-subtle hover:text-text-primary h-3 w-3 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Panel control buttons */}
        <div className="flex w-full items-start justify-between gap-2">
          {/* Left side buttons */}
          <div className="flex flex-wrap gap-2">
            <ButtonPill
              onClick={() => handleOpenPanel("metadata")}
              // onDoubleClick={() => handleClosePanel("metadata")}
              active={panelVisibility?.["metadata"]}
              size="default"
            >
              Metadata
            </ButtonPill>

            <ButtonPill
              onClick={() => handleOpenPanel("content")}
              // onDoubleClick={() => handleClosePanel("content")}
              active={panelVisibility?.["content"]}
              size="default"
              className="whitespace-nowrap"
            >
              {card.props.type === CardType.Plot
                ? "Plot info"
                : "Character info"}
            </ButtonPill>

            {/* Show Lore books button for both Character and Plot cards */}
            <ButtonPill
              onClick={() => handleOpenPanel("lorebooks")}
              // onDoubleClick={() => handleClosePanel("lorebooks")}
              active={panelVisibility?.["lorebooks"]}
              size="default"
            >
              Lorebook
            </ButtonPill>

            {/* Show First Message button only for Plot cards */}
            {card.props.type === CardType.Plot && (
              <ButtonPill
                onClick={() => handleOpenPanel("scenarios")}
                // onDoubleClick={() => handleClosePanel("scenarios")}
                active={panelVisibility?.["scenarios"]}
                size="default"
              >
                First Message
              </ButtonPill>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonPill
              onClick={() => handleOpenPanel("variables")}
              // onDoubleClick={() => handleClosePanel("variables")}
              active={panelVisibility?.["variables"]}
              size="default"
              icon={<BookOpen />}
            >
              Variables
            </ButtonPill>
            {/** disabled subscribe */}
            {/* <ButtonPill
              onClick={() => {
                if (!subscribed) {
                  setIsOpenSubscribeNudge(true);
                  return;
                }
                handleOpenPanel("imageGenerator");
              }}
              active={panelVisibility?.["imageGenerator"]}
              size="default"
              icon={<Image />}
              className="h-8 w-32"
              isSubscribeBadge={!subscribed}
            >
              Image studio
            </ButtonPill> */}
            {/* <ButtonPill
              icon={<SvgIcon name="ai_assistant" />}
              active={panelVisibility?.["vibe"] || false}
              onClick={() => {
                if (!subscribed) {
                  setIsOpenSubscribeNudge(true);
                  return;
                }
                handleVibeCodingToggle();
              }}
              className="h-8 w-32"
              isSubscribeBadge={!subscribed}
            >
              AI assistant
            </ButtonPill> */}
          </div>
        </div>
      </div>

      {/* Main content area with avatar and trading card - takes remaining space */}
      <div className="flex flex-1 items-center justify-center">
        <div className="inline-flex items-center justify-center gap-12">
          {/* Avatar section */}
          {card?.props.type !== CardType.Plot && (
            <div className="inline-flex w-28 flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    alt={getCharacterName(card)}
                    size={112}
                    isVideo={isAvatarVideo}
                  />
                </div>
                <div className="text-text-primary w-28 truncate text-center text-xl font-normal">
                  {getCharacterName(card)}
                </div>
              </div>
            </div>
          )}

          {/* Trading card and card list item section */}
          <div className="inline-flex w-80 flex-col items-center justify-center gap-6">
            {/* Card list item from left navigation */}
            <div className="flex flex-col items-center justify-center self-stretch">
              <div className="h-16 w-[320px]">
                <CardItem cardId={card.id} disableHover />
              </div>
            </div>
            {/* Trading card with proper scaling */}
            <TradingCardItem cardId={card.id.toString()} />

            {/* Edit button */}
            <Button
              onClick={handleEditButtonClick}
              disabled={isUploadingAvatar}
              size="lg"
            >
              {isUploadingAvatar ? "Uploading..." : "Upload new picture"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
