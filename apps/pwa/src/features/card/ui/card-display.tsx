import { useCallback, useState } from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { CharacterCard } from "@/entities/card/domain/character-card";
import { IconCardTypeCharacter, IconCardTypePlot } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { downloadFile } from "@/shared/lib/file-utils";
import { CardType } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { MediaDisplay, DeleteConfirm } from "@/shared/ui";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { cardQueries } from "@/app/queries/card-queries";
import { TableName } from "@/db/schema/table-name";

const CONTAINER_TEXT_SIZES = {
  name: "@[200px]:text-2xl @[250px]:text-3xl @[300px]:text-4xl @[350px]:text-5xl @[400px]:text-6xl @[500px]:text-7xl",
  nameVertical:
    "@[200px]:text-lg @[250px]:text-xl @[300px]:text-2xl @[350px]:text-3xl @[400px]:text-4xl @[500px]:text-5xl",
  meta: "@[200px]:text-sm @[300px]:text-base @[400px]:text-xl @[500px]:text-2xl",
  icon: "@[200px]:h-6 @[200px]:w-6 @[300px]:h-8 @[300px]:w-8 @[400px]:h-10 @[400px]:w-10 @[500px]:h-12 @[500px]:w-12",
  spacing: {
    gap: "@[300px]:gap-3 @[400px]:gap-4 @[500px]:gap-6",
    padding:
      "@[300px]:px-3 @[300px]:py-4 @[400px]:px-4 @[400px]:py-6 @[500px]:px-6 @[500px]:py-8",
  },
  radius:
    "rounded-lg @[300px]:rounded-xl @[400px]:rounded-2xl @[500px]:rounded-3xl",
};

interface CardDisplayProps {
  card: CharacterCard;
  isSelected: boolean;
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
  /**
   * Preview image URL for temporary preview (e.g., during card creation)
   * If provided, this will be used instead of fetching from useAsset
   */
  previewImageUrl?: string;
}

const tagContainerWidth = 152;

/**
 * Card display component for showing character/plot cards
 * Supports both Character and Plot card types (differentiated by icon only)
 * Used in selection dialogs and card listings
 * Supports preview mode via previewImageUrl for temporary image display
 */
export default function CardDisplay({
  card,
  isSelected,
  showActions = false,
  className,
  onClick,
  previewImageUrl,
}: CardDisplayProps) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [usedSessionsCount, setUsedSessionsCount] = useState<number>(0);

  const [assetImageUrl, isVideo] = useAsset(card?.props.iconAssetId);
  const imageUrl = previewImageUrl || assetImageUrl;
  const queryClient = useQueryClient();

  /**
   * Handle card download/export as PNG file
   */
  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isDownloading) return;

      setIsDownloading(true);

      try {
        // Export card as PNG file
        const result = await CardService.exportCardToFile.execute({
          cardId: card.id,
          options: { format: "png" },
        });

        if (result.isFailure) {
          toast.error("Failed to download card", {
            description: result.getError(),
          });
          return;
        }

        const file = result.getValue();

        // Download file
        downloadFile(file);

        toast.success("Card downloaded", {
          description: card.props.title,
        });
      } catch (error) {
        toast.error("Failed to download card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [card.id, card.props.title, isDownloading],
  );

  /**
   * Handle card copy/clone
   * Creates a duplicate of the card without navigating away
   */
  const handleCopyClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isCopying) return;

      setIsCopying(true);

      try {
        // Clone card
        const result = await CardService.cloneCard.execute({
          cardId: card.id,
        });

        if (result.isFailure) {
          toast.error("Failed to copy card", {
            description: result.getError(),
          });
          return;
        }

        // Successfully cloned card
        toast.success("Card copied", {
          description: `Created copy of "${card.props.title}"`,
        });

        // Refresh card list
        await queryClient.invalidateQueries({
          queryKey: cardQueries.lists(),
        });
      } catch (error) {
        toast.error("Failed to copy card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCopying(false);
      }
    },
    [card.id, card.props.title, isCopying, queryClient],
  );

  /**
   * Handle delete button click
   * Opens confirmation dialog and fetches used sessions count
   */
  const handleDeleteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      // Fetch sessions using this card
      try {
        const result = await SessionService.listSessionByCard.execute({
          cardId: card.id,
        });

        if (result.isSuccess) {
          const sessions = result.getValue();
          setUsedSessionsCount(sessions.length);
        }
      } catch (error) {
        // Continue with delete even if session check fails
        console.error("Failed to check used sessions:", error);
      }

      setIsDeleteDialogOpen(true);
    },
    [card.id],
  );

  /**
   * Handle card deletion
   * Removes card and invalidates related queries
   */
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);

    try {
      // Delete card
      const result = await CardService.deleteCard.execute(card.id);

      if (result.isFailure) {
        toast.error("Failed to delete card", {
          description: result.getError(),
        });
        return;
      }

      toast.success("Card deleted", {
        description: card.props.title,
      });

      // Refresh card list
      await queryClient.invalidateQueries({
        queryKey: cardQueries.lists(),
      });

      // If card was used in sessions, invalidate those session queries
      if (usedSessionsCount > 0) {
        // Invalidate all session validation and detail queries
        // This ensures sessions detect the missing card
        await queryClient.invalidateQueries({
          queryKey: [TableName.Sessions],
        });
      }
    } catch (error) {
      toast.error("Failed to delete card", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [card.id, card.props.title, queryClient, usedSessionsCount]);

  const estimateTextWidth = (text: string): number => {
    const avgCharWidth = 5;
    return text.length * avgCharWidth;
  };

  const getTagString = (tags: string[]) => {
    if (tags.length === 0) return "";

    const visibleTags: string[] = [];
    let totalWidth = 0;

    // Space for tag padding (px-1.5 = 12px) and spacing between tags
    const tagPadding = 6;
    const tagSpacing = 2;
    const reservedSpace = 4; // Space for "+N" text
    const maxWidth = tagContainerWidth - reservedSpace;

    // Calculate how many tags fit
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const tagTextWidth = estimateTextWidth(tag);
      const tagTotalWidth =
        tagTextWidth + tagPadding + (i > 0 ? tagSpacing : 0);

      if (totalWidth + tagTotalWidth > maxWidth) {
        // This tag won't fit, break the loop
        const remainingCount = tags.length - i;
        if (remainingCount > 0) {
          return (
            visibleTags.join(" ") +
            (visibleTags.length > 0 ? " " : "") +
            "+" +
            remainingCount
          );
        }
        break;
      }

      totalWidth += tagTotalWidth;
      visibleTags.push(tag);
    }

    // All tags fit
    return visibleTags.join(" ");
  };

  return (
    <div className={cn("@container w-full")}>
      <article
        onClick={onClick}
        className={cn(
          "relative flex aspect-[4/6] w-full overflow-hidden",
          "transition-[transform,filter] duration-300 ease-out",
          "group-hover:brightness-105",
          "group-hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
          CONTAINER_TEXT_SIZES.radius,
          className,
          isSelected && "border-text-primary border-2",
          onClick && "cursor-pointer",
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          <MediaDisplay
            src={imageUrl || null}
            fallbackSrc={
              card.props.type === CardType.Character
                ? "/img/placeholder/character-card-image.png"
                : "/img/placeholder/plot-card-image.png"
            }
            alt={card.props.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            isVideo={isVideo}
            showControls={false}
            autoPlay={false}
            muted={true}
            loop={true}
            playOnHover={true}
            clickToToggle={false}
          />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {showActions && (
            <>
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="text-button-foreground-primary absolute top-2 left-2 flex -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  aria-label={`Download ${card.props.title}`}
                  className={cn(
                    "hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-opacity",
                    isDownloading && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Download
                    className={cn("h-4", isDownloading && "animate-pulse")}
                  />
                </button>
                <button
                  onClick={handleCopyClick}
                  disabled={isCopying}
                  aria-label={`Copy ${card.props.title}`}
                  className={cn(
                    "hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-opacity",
                    isCopying && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Copy className={cn("h-4", isCopying && "animate-pulse")} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  aria-label={`Delete ${card.props.title}`}
                  className={cn(
                    "hover:bg-primary-strong flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm backdrop-blur-sm transition-opacity",
                    isDeleting && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Trash2
                    className={cn("h-4", isDeleting && "animate-pulse")}
                  />
                </button>
              </div>
            </>
          )}

          <div
            className={cn(
              "relative flex min-w-0 flex-col gap-2 p-2",
              CONTAINER_TEXT_SIZES.spacing.gap,
              CONTAINER_TEXT_SIZES.spacing.padding,
            )}
          >
            <h3
              className={cn(
                "text-text-primary font-pragati-narrow line-clamp-2 text-xl font-bold text-ellipsis",
                CONTAINER_TEXT_SIZES.name,
              )}
            >
              {card.props.name || card.props.title}
            </h3>
            <p
              className={cn(
                "text-text-secondary truncate text-[0.625rem]",
                CONTAINER_TEXT_SIZES.meta,
              )}
            >
              {card.props.tags &&
                card.props.tags.length > 0 &&
                getTagString(card.props.tags || [])}
            </p>
            <p
              className={cn(
                "text-text-secondary text-[0.625rem]",
                CONTAINER_TEXT_SIZES.meta,
              )}
            >
              {card.props.tokenCount || 0} Tokens
            </p>
          </div>
        </div>

        <div
          className={cn(
            "bg-background-surface-1/60 relative flex flex-col items-center gap-2 overflow-hidden rounded-tr-lg rounded-br-lg px-2 py-3 backdrop-blur-md",
            CONTAINER_TEXT_SIZES.spacing.padding,
          )}
        >
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full p-[6px]",
              CONTAINER_TEXT_SIZES.icon,
              card.props.type === CardType.Character
                ? "bg-purple-200"
                : "bg-blue-200",
            )}
          >
            {card.props.type === CardType.Character ? (
              <IconCardTypeCharacter className="h-5 w-5" />
            ) : (
              <IconCardTypePlot className="h-5 w-5" />
            )}
          </div>
          <div
            className={cn(
              "text-text-secondary truncate text-sm [writing-mode:vertical-rl]",
              CONTAINER_TEXT_SIZES.nameVertical,
            )}
          >
            {card.props.title}
          </div>
        </div>
      </article>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirm
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Card"
        description={
          usedSessionsCount > 0 ? (
            <>
              This card is used in{" "}
              <span className="text-secondary-normal font-semibold">
                {usedSessionsCount}{" "}
                {usedSessionsCount === 1 ? "session" : "sessions"}
              </span>
              .
              <br />
              Deleting it might corrupt or disable these sessions.
            </>
          ) : (
            "Are you sure you want to delete this card? This action cannot be undone."
          )
        }
        deleteLabel="Yes, delete"
        onDelete={handleDelete}
      />
    </div>
  );
}
