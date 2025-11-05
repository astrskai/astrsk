import { useState, useCallback } from "react";
import { Upload, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { cn, downloadFile } from "@/shared/lib";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { cardQueries } from "@/entities/card/api/card-queries";
import { TableName } from "@/db/schema/table-name";
import { ActionConfirm } from "@/shared/ui/dialogs";

interface CharacterPreview {
  cardId?: UniqueEntityID;
  title: string;
  iconAssetId?: UniqueEntityID;
  summary?: string;
  className?: string;
  tags: string[];
  tokenCount?: number;
  isShowActions?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-card-image.png";

const CharacterPreview = ({
  cardId,
  iconAssetId,
  title,
  summary,
  tags,
  tokenCount = 0,
  className,
  isShowActions = false,
  isDisabled = false,
  onClick,
}: CharacterPreview) => {
  const [imageUrl] = useAsset(iconAssetId);
  const queryClient = useQueryClient();

  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [usedSessionsCount, setUsedSessionsCount] = useState(0);

  const handleExportClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isExporting || !cardId) return;

      setIsExporting(true);
      try {
        const result = await CardService.exportCardToFile.execute({
          cardId,
          options: { format: "png" },
        });

        if (result.isFailure) {
          toast.error("Failed to export", { description: result.getError() });
          return;
        }

        downloadFile(result.getValue());
        toast.success("Successfully exported!", {
          description: `"${title}" exported`,
        });
      } catch (error) {
        toast.error("Failed to export", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [cardId, title, isExporting],
  );

  const handleCopyClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCopying || !cardId) return;

      setIsCopying(true);
      try {
        const result = await CardService.cloneCard.execute({ cardId });

        if (result.isFailure) {
          toast.error("Failed to copy card", {
            description: result.getError(),
          });
          return;
        }

        toast.success("Card copied", {
          description: `Created copy of "${title}"`,
        });
        await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });
      } catch (error) {
        toast.error("Failed to copy card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCopying(false);
      }
    },
    [cardId, title, isCopying, queryClient],
  );

  const handleDeleteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!cardId) return;

      try {
        const result = await SessionService.listSessionByCard.execute({
          cardId,
        });
        if (result.isSuccess) {
          setUsedSessionsCount(result.getValue().length);
        }
      } catch (error) {
        console.error("Failed to check used sessions:", error);
      }

      setIsDeleteDialogOpen(true);
    },
    [cardId],
  );

  const handleDelete = useCallback(async () => {
    if (!cardId) return;

    setIsDeleting(true);
    try {
      const result = await CardService.deleteCard.execute(cardId);

      if (result.isFailure) {
        toast.error("Failed to delete card", {
          description: result.getError(),
        });
        return;
      }

      toast.success("Card deleted", { description: title });
      await queryClient.invalidateQueries({ queryKey: cardQueries.lists() });

      if (usedSessionsCount > 0) {
        await queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });
      }
    } catch (error) {
      toast.error("Failed to delete card", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [cardId, title, usedSessionsCount, queryClient]);

  const getCompactedTagString = (tags: string[]) => {
    const compactedTags = tags.slice(0, 3).map((tag, index) => {
      return (
        <span
          key={`${title}-tag-${index}-${tag}`}
          className={cn(
            "text-black-alternate rounded-md bg-gray-300/80 px-2.5 py-0.5 text-xs font-semibold lg:text-sm",
            "transition-all duration-300 group-hover/preview:bg-gray-900/50 group-hover/preview:text-gray-50",
            index === 2 && "hidden lg:inline-flex",
          )}
        >
          {tag}
        </span>
      );
    });

    if (tags.length > 2) {
      compactedTags.push(
        <span
          key={`${title}-tag-mobile-count-${tags.length}`}
          className="text-xs text-gray-300 transition-all duration-300 group-hover/preview:text-gray-50 lg:hidden"
        >
          +{tags.length - 2}
        </span>,
      );
    }

    if (tags.length > 3) {
      compactedTags.push(
        <span
          key={`${title}-tag-desktop-count-${tags.length}`}
          className="hidden text-xs text-gray-300 transition-all duration-300 group-hover/preview:text-gray-50 lg:inline-flex"
        >
          +{tags.length - 3}
        </span>,
      );
    }

    return compactedTags;
  };

  return (
    <>
      <article
        className={cn(
          "group/preview relative flex aspect-[2/1] w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200 transition-all duration-300 lg:aspect-[3/1]",
          !isDisabled && onClick && "cursor-pointer",
          isDisabled
            ? "pointer-events-none"
            : "group-hover/preview:border-gray-400 group-hover/preview:shadow-lg",
          className,
        )}
        onClick={isDisabled ? undefined : onClick}
      >
        {/* Disabled overlay */}
        {isDisabled && (
          <div className="absolute inset-0 z-20 bg-white opacity-40" />
        )}

        {/* Action buttons - 최상단 오른쪽 */}
        {isShowActions && (
          <div className="absolute top-2 right-2 z-30 flex -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover/preview:translate-y-0 group-hover/preview:opacity-100">
            <button
              onClick={handleExportClick}
              disabled={isExporting}
              aria-label={`Export ${title}`}
              className={cn(
                "hover:bg-normal-primary/80 bg-normal-primary flex h-8 w-8 items-center justify-center rounded-full text-sm text-blue-900 transition-opacity",
                isExporting && "cursor-not-allowed opacity-50",
              )}
            >
              <Upload className={cn("h-4", isExporting && "animate-pulse")} />
            </button>
            <button
              onClick={handleCopyClick}
              disabled={isCopying}
              aria-label={`Copy ${title}`}
              className={cn(
                "bg-normal-primary hover:bg-normal-primary/80 flex h-8 w-8 items-center justify-center rounded-full text-sm text-blue-900 transition-opacity",
                isCopying && "cursor-not-allowed opacity-50",
              )}
            >
              <Copy className={cn("h-4", isCopying && "animate-pulse")} />
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              aria-label={`Delete ${title}`}
              className={cn(
                "bg-normal-primary hover:bg-normal-primary/80 flex h-8 w-8 items-center justify-center rounded-full text-sm text-blue-900 transition-opacity",
                isDeleting && "cursor-not-allowed opacity-50",
              )}
            >
              <Trash2 className={cn("h-4", isDeleting && "animate-pulse")} />
            </button>
          </div>
        )}

        <img
          src={imageUrl || PLACEHOLDER_IMAGE_URL}
          alt={title}
          className={cn(
            "h-full w-24 flex-shrink-0 object-cover transition-transform duration-300 md:w-36",
            !isDisabled && "group-hover/preview:scale-105",
          )}
          loading="lazy"
        />

        <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-4">
          {/* Background image with blur on hover */}
          {!isDisabled && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-0 blur-md transition-opacity duration-300 group-hover/preview:opacity-20"
              style={{
                backgroundImage: `url(${imageUrl || PLACEHOLDER_IMAGE_URL})`,
              }}
            />
          )}

          {/* Content layer */}
          <div className="relative z-10 flex h-full flex-col justify-around gap-1 lg:justify-between lg:gap-2">
            <h3
              className={cn(
                "text-base font-semibold text-gray-50 lg:text-lg",
                isShowActions &&
                  "transition-all duration-300 group-hover/preview:text-gray-200",
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                "line-clamp-2 text-xs lg:text-sm",
                isShowActions &&
                  "transition-all duration-300 group-hover/preview:text-gray-50",
              )}
            >
              {summary || "No summary"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs lg:text-sm">
              {tags.length > 0 ? getCompactedTagString(tags) : "No tags"}
            </div>
            <div className="flex items-center gap-1 text-xs lg:text-sm">
              <span className="font-semibold text-gray-50">{tokenCount}</span>{" "}
              Tokens
            </div>
          </div>
        </div>
      </article>

      <ActionConfirm
        open={isDeleteDialogOpen}
        onOpenChange={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Character"
        description={
          usedSessionsCount > 0
            ? `This character is used in ${usedSessionsCount} session(s). Deleting it may affect those sessions.`
            : "This character will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
};

export default CharacterPreview;
