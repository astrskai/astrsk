import { useMemo, useCallback, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { cn } from "@/shared/lib";
import {
  backgroundQueries,
  defaultBackgrounds,
  isDefaultBackground,
  getBackgroundAssetId,
  DefaultBackground,
} from "@/entities/background/api";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Background } from "@/entities/background/domain/background";
import { BackgroundService } from "@/app/services/background-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface BackgroundGridProps {
  sessionId: UniqueEntityID;
  currentBackgroundId?: UniqueEntityID;
  onSelect: (backgroundId: UniqueEntityID | undefined) => void;
  isEditable?: boolean; // false = no delete button, no name overlay (mobile)
}

interface BackgroundItemProps {
  background: Background | DefaultBackground;
  isSelected: boolean;
  isEditable?: boolean;
  isLoading?: boolean;
  onSelect: (backgroundId: UniqueEntityID) => void;
  onDelete?: (backgroundId: UniqueEntityID) => void;
}

const BackgroundItem = ({
  background,
  isSelected,
  isLoading = false,
  onSelect,
  onDelete,
}: BackgroundItemProps) => {
  const [assetUrl] = useAsset(getBackgroundAssetId(background));

  const imageSrc = useMemo(() => {
    if (isDefaultBackground(background)) {
      return background.src;
    }
    return assetUrl;
  }, [background, assetUrl]);

  return (
    <div
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
        "hover:border-brand-500 hover:brightness-110",
        isSelected ? "border-brand-500" : "border-border-muted",
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        onClick={() => onSelect(background.id)}
        disabled={isLoading}
        className="absolute inset-0 h-full w-full disabled:cursor-wait"
        aria-label={`Select ${background.name}`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={background.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-raised">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg-disabled border-t-brand-500" />
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500" />
          </div>
        )}
      </button>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(background.id)}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-300 transition-opacity hover:bg-brand-400"
          aria-label={`Delete ${background.name}`}
        >
          <Trash2 className="h-3 w-3 text-brand-700" />
        </button>
      )}
    </div>
  );
};

export default function BackgroundGrid({
  sessionId,
  currentBackgroundId,
  onSelect,
  isEditable = false,
}: BackgroundGridProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query user backgrounds for this session
  const { data: userBackgrounds = [] } = useQuery(
    backgroundQueries.listBySession(sessionId),
  );

  // Handle add new background
  const handleAddBackground = useCallback(
    async (file: File) => {
      try {
        // Save file to background with sessionId
        const backgroundOrError =
          await BackgroundService.saveFileToBackground.execute({
            file,
            sessionId,
          });

        if (backgroundOrError.isFailure) {
          toastError("Failed to upload background", {
            description: backgroundOrError.getError() || "Unknown error",
          });
          return;
        }

        // Invalidate query to refresh backgrounds
        queryClient.invalidateQueries({
          queryKey: backgroundQueries.listBySession(sessionId).queryKey,
        });

        toastSuccess("Background uploaded successfully");
      } catch (error) {
        toastError("Failed to upload background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionId, queryClient],
  );

  // Handle delete background
  const handleDeleteBackground = useCallback(
    async (backgroundId: UniqueEntityID) => {
      try {
        // Check if the background being deleted is currently selected
        const isDeletingCurrentBackground =
          currentBackgroundId?.equals(backgroundId) ?? false;

        const backgroundOrError =
          await BackgroundService.deleteBackground.execute(backgroundId);

        if (backgroundOrError.isFailure) {
          toastError("Failed to delete background", {
            description: backgroundOrError.getError() || "Unknown error",
          });
          return;
        }

        // If we deleted the currently selected background, clear the selection
        if (isDeletingCurrentBackground) {
          onSelect(undefined);
        }

        // Invalidate query to refresh backgrounds
        queryClient.invalidateQueries({
          queryKey: backgroundQueries.listBySession(sessionId).queryKey,
        });

        toastSuccess("Background deleted successfully");
      } catch (error) {
        toastError("Failed to delete background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionId, currentBackgroundId, onSelect, queryClient],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-fg-default text-sm font-semibold">
          Select Background
        </h4>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded-full bg-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Background
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={async (e) => {
          if (!e.target.files || e.target.files.length === 0) {
            return;
          }
          const file = e.target.files[0];
          await handleAddBackground(file);
          e.target.value = "";
        }}
      />

      {/* Combined grid: No Background → User added (deletable) → Default backgrounds */}
      <div className="custom-scrollbar max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {/* No background option */}
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className={cn(
              "relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
              "hover:border-brand-500 hover:brightness-110",
              !currentBackgroundId ? "border-brand-500" : "border-border-muted",
            )}
          >
            <div className="flex h-full w-full items-center justify-center bg-surface">
              <p className="text-xs text-fg-subtle">No background</p>
            </div>
          </button>

          {/* User added backgrounds (deletable) */}
          {userBackgrounds.map((background) => (
            <BackgroundItem
              key={background.id.toString()}
              background={background}
              isSelected={currentBackgroundId?.equals(background.id) ?? false}
              onSelect={onSelect}
              onDelete={isEditable ? handleDeleteBackground : undefined}
            />
          ))}

          {/* Default astrsk backgrounds (not deletable) */}
          {defaultBackgrounds.map((background) => (
            <BackgroundItem
              key={background.id.toString()}
              background={background}
              isSelected={currentBackgroundId?.equals(background.id) ?? false}
              onSelect={(id) => onSelect(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
