import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/shared/ui/toast";
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
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyingBackgroundId, setCopyingBackgroundId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"astrsk" | "user">("astrsk");

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
          toastError("Failed to copy background");
          return;
        }

        const newBackground = backgroundOrError.getValue();

        // Refresh backgrounds for this session
        await fetchBackgrounds(sessionId);

        // Select the newly created background
        onSelect(newBackground.id);
      } catch (error) {
        toastError("Failed to copy background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setCopyingBackgroundId(null);
      }
    },
    [sessionId, onSelect],
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

        // Refresh backgrounds for this session
        await fetchBackgrounds(sessionId);

        // Switch to user added tab
        setActiveTab("user");

        toastSuccess("Background uploaded successfully");
      } catch (error) {
        toastError("Failed to upload background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionId],
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

        // Refresh backgrounds for this session
        await fetchBackgrounds(sessionId);

        toastSuccess("Background deleted successfully");
      } catch (error) {
        toastError("Failed to delete background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionId, currentBackgroundId, onSelect],
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

      {/* Tab Navigation */}
      <div className="flex border-b border-border-muted">
        <button
          type="button"
          onClick={() => setActiveTab("astrsk")}
          className={cn(
            "flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "astrsk"
              ? "border-brand-300 text-brand-300"
              : "border-surface-raised text-fg-subtle hover:text-fg-muted",
          )}
        >
          astrsk provided
        </button>
        {hasUserBackgrounds && (
          <button
            type="button"
            onClick={() => setActiveTab("user")}
            className={cn(
              "flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "user"
                ? "border-brand-300 text-brand-300"
                : "border-surface-raised text-fg-subtle hover:text-fg-muted",
            )}
          >
            User added
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="custom-scrollbar max-h-96 overflow-y-auto">
        {activeTab === "astrsk" ? (
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
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {backgrounds.map((background) => (
              <BackgroundItem
                key={background.id.toString()}
                background={background}
                isSelected={currentBackgroundId?.equals(background.id) ?? false}
                onSelect={onSelect}
                onDelete={isEditable ? handleDeleteBackground : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
