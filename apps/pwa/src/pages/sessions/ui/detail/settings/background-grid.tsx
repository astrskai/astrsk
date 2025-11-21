import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib";
import {
  useBackgroundStore,
  isDefaultBackground,
  DefaultBackground,
  fetchBackgrounds,
} from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Background } from "@/entities/background/domain/background";
import { BackgroundService } from "@/app/services/background-service";

interface BackgroundGridProps {
  sessionId: UniqueEntityID;
  currentBackgroundId?: UniqueEntityID;
  onSelect: (backgroundId: UniqueEntityID | undefined) => void;
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
  isEditable = false,
  isLoading = false,
  onSelect,
  onDelete,
}: BackgroundItemProps) => {
  const [assetUrl] = useAsset(
    isDefaultBackground(background) ? undefined : background.assetId,
  );

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
        "hover:border-blue-500 hover:brightness-110",
        isSelected ? "border-blue-500" : "border-gray-700",
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
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
          </div>
        )}

        {/* Name overlay */}
        {!isEditable && (
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="truncate text-xs text-white">{background.name}</p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500" />
          </div>
        )}
      </button>

      {/* Selected indicator */}
      {isSelected && (
        <div className="pointer-events-none absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Delete button (only for editable items) */}
      {isEditable && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(background.id)}
          className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/70 hover:opacity-100"
          aria-label={`Delete ${background.name}`}
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      )}
    </div>
  );
};

export default function BackgroundGrid({
  sessionId,
  currentBackgroundId,
  onSelect,
}: BackgroundGridProps) {
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyingBackgroundId, setCopyingBackgroundId] = useState<string | null>(null);

  const hasUserBackgrounds = backgrounds.length > 0;

  // Fetch backgrounds for this session when component mounts or sessionId changes
  useEffect(() => {
    fetchBackgrounds(sessionId);
  }, [sessionId]);

  // Handle selecting a default background by copying it to session-local
  const handleDefaultBackgroundSelect = useCallback(
    async (defaultBackground: DefaultBackground) => {
      setCopyingBackgroundId(defaultBackground.id.toString());
      try {
        // Fetch the image from CDN
        const response = await fetch(defaultBackground.src);
        if (!response.ok) {
          throw new Error("Failed to fetch background image");
        }

        const blob = await response.blob();
        const file = new File([blob], `${defaultBackground.name}.jpg`, {
          type: blob.type || "image/jpeg",
        });

        // Save as session-local background
        const backgroundOrError =
          await BackgroundService.saveFileToBackground.execute({
            file,
            sessionId,
          });

        if (backgroundOrError.isFailure) {
          toast.error("Failed to copy background");
          return;
        }

        const newBackground = backgroundOrError.getValue();

        // Refresh backgrounds for this session
        await fetchBackgrounds(sessionId);

        // Select the newly created background
        onSelect(newBackground.id);
      } catch (error) {
        toast.error("Failed to copy background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setCopyingBackgroundId(null);
      }
    },
    [sessionId, onSelect],
  );

  // Handle add new background
  const handleAddBackground = useCallback(async (file: File) => {
    try {
      // Save file to background with sessionId
      const backgroundOrError =
        await BackgroundService.saveFileToBackground.execute({
          file,
          sessionId,
        });

      if (backgroundOrError.isFailure) {
        toast.error("Failed to upload background");
        return;
      }

      // Refresh backgrounds for this session
      await fetchBackgrounds(sessionId);

      toast.success("Background uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload background", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [sessionId]);

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
          toast.error("Failed to delete background");
          return;
        }

        // If we deleted the currently selected background, clear the selection
        if (isDeletingCurrentBackground) {
          onSelect(undefined);
        }

        // Refresh backgrounds for this session
        await fetchBackgrounds(sessionId);

        toast.success("Background deleted successfully");
      } catch (error) {
        toast.error("Failed to delete background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionId, currentBackgroundId, onSelect],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-200">
          Select Background
        </h4>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
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

      <div className="custom-scrollbar max-h-96 space-y-4 overflow-y-auto">
        {/* User added backgrounds */}
        {hasUserBackgrounds && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-400">
              User added backgrounds
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {backgrounds.map((background) => (
                <BackgroundItem
                  key={background.id.toString()}
                  background={background}
                  isSelected={
                    currentBackgroundId?.equals(background.id) ?? false
                  }
                  isEditable
                  onSelect={onSelect}
                  onDelete={handleDeleteBackground}
                />
              ))}
            </div>
          </div>
        )}

        {/* astrsk.ai provided backgrounds */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-400">
            astrsk.ai provided backgrounds
          </h5>
          <div className="grid grid-cols-3 gap-2">
            {/* No background option */}
            <button
              type="button"
              onClick={() => onSelect(undefined)}
              className={cn(
                "relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
                "hover:border-blue-500 hover:brightness-110",
                !currentBackgroundId ? "border-blue-500" : "border-gray-700",
              )}
            >
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                <p className="text-xs text-gray-400">No background</p>
              </div>
              {/* Selected indicator */}
              {!currentBackgroundId && (
                <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {defaultBackgrounds.map((background) => (
              <BackgroundItem
                key={background.id.toString()}
                background={background}
                isSelected={false}
                isLoading={copyingBackgroundId === background.id.toString()}
                onSelect={() => handleDefaultBackgroundSelect(background)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
