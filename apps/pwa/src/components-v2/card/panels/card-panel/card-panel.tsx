import { useState, useRef, useEffect } from "react";
import { Card, CharacterCard } from "@/modules/card/domain";
import { CardType } from "@/modules/card/domain";
import { UniqueEntityID } from "@/shared/domain";
import { CardService } from "@/app/services/card-service";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { generatedImageKeys } from "@/app/queries/generated-image/query-factory";
import { TradingCard } from "@/components-v2/card/components/trading-card";
import { useCardPanelContext } from "@/components-v2/card/panels/card-panel-provider";
import { CardItem } from "@/components-v2/left-navigation/card-list";
import { useAsset } from "@/app/hooks/use-asset";
import { cn } from "@/shared/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { cardQueries, useUpdateCardTitle } from "@/app/queries/card";
import { BookOpen, Pencil, Check, X, Image } from "lucide-react";
import { ButtonPill } from "@/components-v2/ui/button-pill";
import { Button } from "@/components-v2/ui/button";
import { SvgIcon } from "@/components-v2/svg-icon";
import { invalidateSingleCardQueries } from "@/components-v2/card/utils/invalidate-card-queries";
import { useLeftNavigationWidth } from "@/components-v2/left-navigation/hooks/use-left-navigation-width";
import { useUpdateCardCodingPanelState } from "@/app/queries/card/mutations/card-coding-panel-mutations";
import { useRightSidebarState } from "@/components-v2/top-bar";
import { Avatar } from "@/components-v2/avatar";

interface CardPanelProps {
  cardId: string;
  card?: Card | null;
}

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
        "relative w-full max-w-[320px] aspect-[196/289] rounded-[8px]",
        !cardId && "bg-background-input",
        disabled && "opacity-50 pointer-events-none",
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        <TradingCard cardId={cardId} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center text-background-dialog px-4">
            {placeholder}
          </div>
        </div>
      )}
      {isActive ? (
        <div className="absolute inset-0 rounded-[19px] ring-2 ring-border-light pointer-events-none" />
      ) : (
        // Default border
        <div className="absolute inset-0 rounded-[19px] ring-2 ring-border-light pointer-events-none" />
      )}
    </div>
  );
};

export function CardPanel({ cardId, card: providedCard }: CardPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openPanel, closePanel, panelVisibility } = useCardPanelContext();
  const queryClient = useQueryClient();

  // Use fine-grained mutation for title updates with optimistic updates
  const updateTitle = useUpdateCardTitle(cardId);

  // Get left navigation state for conditional margins
  const { isExpanded, isMobile } = useLeftNavigationWidth();
  
  // Use React Query to get card data
  const { data: cardFromQuery } = useQuery(cardQueries.detail(cardId));

  // Use provided card or the one from query
  const card = providedCard || cardFromQuery;

  // Right sidebar state and card coding panel mutation
  const rightSidebar = useRightSidebarState();
  const updateCodingPanelState = useUpdateCardCodingPanelState(cardId);

  // Sync card coding panel state with global sidebar when card changes (same as flow)
  useEffect(() => {
    if (card && rightSidebar && card.props.isCodingPanelOpen !== rightSidebar.isOpen) {
      rightSidebar.setIsOpen(card.props.isCodingPanelOpen || false);
    }
  }, [card?.props.isCodingPanelOpen, rightSidebar]);

  // Vibe Coding handler (only opens, doesn't close) - same as flow implementation
  const handleVibeCodingToggle = () => {
    if (!card) return;
    
    // Always set to true for redundancy - ensures panel opens even if state gets out of sync
    updateCodingPanelState.mutate(true, {
      onError: (error) => {
        console.error('Failed to update card coding panel state:', error);
      }
    });
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
  const [avatarUrl] = useAsset(card?.props.iconAssetId);

  const handleOpenPanel = (panelType: string) => {
    openPanel(panelType);
  };

  const handleClosePanel = (panelType: string) => {
    closePanel(panelType);
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
      console.log("🖼️ [CARD-PANEL] Creating asset from uploaded file");
      const assetResult = await AssetService.saveFileToAsset.execute({ file });

      if (assetResult.isSuccess) {
        const asset = assetResult.getValue();
        console.log("✅ [CARD-PANEL] Asset created:", asset.id.toString());

        // Step 2: Add to gallery FIRST (this becomes the source of truth)
        console.log("🖼️ [CARD-PANEL] Adding image to gallery first");
        const generatedImageResult = await GeneratedImageService.saveGeneratedImageFromAsset.execute({
          assetId: asset.id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          prompt: `Card avatar for ${card.props.title || "Untitled"}`,
          style: "uploaded",
          associatedCardId: card.id,
        });

        if (generatedImageResult.isSuccess) {
          console.log("✅ [CARD-PANEL] Image added to gallery");

          // Step 3: Update card to reference the SAME asset (no separate asset creation)
          const updateResult = card.update({ iconAssetId: asset.id });
          
          if (updateResult.isSuccess) {
            const saveResult = await CardService.saveCard.execute(card);
            
            if (saveResult.isSuccess) {
              // Invalidate all queries for this card
              await invalidateSingleCardQueries(queryClient, card.id);
              
              // Also invalidate generated images for this card
              console.log("🔄 [CARD-PANEL] Invalidating generated images query for card:", card.id.toString());
              await queryClient.invalidateQueries({
                queryKey: generatedImageKeys.cardImages(card.id.toString()),
              });
              console.log("✅ [CARD-PANEL] Image added to gallery and set as card icon using same asset");
            } else {
              console.error("Failed to save card:", saveResult.getError());
            }
          } else {
            console.error("Failed to update card:", updateResult.getError());
          }
        } else {
          console.error("Failed to add image to gallery:", generatedImageResult.getError());
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
      <div className="h-full w-full p-4 text-text-subtle bg-background-surface-2">
        Card not found
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background-surface-1 flex flex-col">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header section with card title and panel buttons */}
      <div className="flex flex-col gap-4 p-4 w-full">
        {/* Card name header */}
        <div
          className={cn(
            "px-4 py-2 bg-background-surface-3 rounded-lg flex justify-between items-center gap-2 transition-all duration-200",
            {
              "w-full": isMobile || isExpanded, // Full width when mobile or navigation expanded
              "w-[calc(100%-48px)] ml-12": !isMobile && !isExpanded, // Narrower width with left margin when navigation collapsed
            },
          )}
        >
          <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
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
                  className="text-text-primary text-xs font-semibold bg-transparent border-b border-text-primary outline-none min-w-[80px] max-w-full"
                  style={{
                    width: `${Math.max(editedTitle.length * 6 + 16, 80)}px`,
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={updateTitle.isPending || updateTitle.isEditing}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <Check className="w-3 h-3 text-status-success" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <div className="text-text-primary text-xs font-semibold truncate">
                  {card.props.title || "Untitled Card"}
                </div>
                <button
                  onClick={() => {
                    setEditedTitle(card.props.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <Pencil className="w-3 h-3 text-text-subtle hover:text-text-primary transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Panel control buttons */}
        <div className="w-full flex justify-between items-start gap-2">
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
              {card.props.type === CardType.Plot ? "Plot info" : "Character info"}
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

            {/* Show Scenarios button only for Plot cards */}
            {card.props.type === CardType.Plot && (
              <ButtonPill
                onClick={() => handleOpenPanel("scenarios")}
                // onDoubleClick={() => handleClosePanel("scenarios")}
                active={panelVisibility?.["scenarios"]}
                size="default"
              >
                Scenarios
              </ButtonPill>
            )}
          </div>
          
          {/* Right side buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <ButtonPill
              onClick={() => handleOpenPanel("variables")}
              // onDoubleClick={() => handleClosePanel("variables")}
              active={panelVisibility?.["variables"]}
              size="default"
              icon={<BookOpen />}
            >
              Variables
            </ButtonPill>
            <ButtonPill
              onClick={() => handleOpenPanel("imageGenerator")}
              // onDoubleClick={() => handleClosePanel("imageGenerator")}
              active={panelVisibility?.["imageGenerator"]}
              size="default"
              icon={<Image />}
              className="w-32 h-8"
            >
              Image studio
            </ButtonPill>
            <ButtonPill
              size="default"
              variant="gradient"
              icon={<SvgIcon name="ai_assistant" />}
              active={card?.props.isCodingPanelOpen || false}
              onClick={handleVibeCodingToggle}
              className="w-32 h-8"
            >
              AI assistant  
            </ButtonPill>
          </div>
        </div>
      </div>

      {/* Main content area with avatar and trading card - takes remaining space */}
      <div className="flex-1 flex justify-center items-center">
        <div className="inline-flex justify-center items-center gap-12">
          {/* Avatar section */}
          {card?.props.type !== CardType.Plot && (
            <div className="w-28 inline-flex flex-col justify-center items-center">
              <div className="flex flex-col justify-center items-center gap-1.5">
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    alt={getCharacterName(card)}
                    size={112}
                  />
                </div>
                <div className="w-28 text-center text-text-primary text-xl font-normal truncate">
                  {getCharacterName(card)}
                </div>
              </div>
            </div>
          )}

          {/* Trading card and card list item section */}
          <div className="w-80 inline-flex flex-col justify-center items-center gap-6">
            {/* Card list item from left navigation */}
            <div className="self-stretch flex flex-col justify-center items-center">
              <div className="w-[320px] h-16">
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