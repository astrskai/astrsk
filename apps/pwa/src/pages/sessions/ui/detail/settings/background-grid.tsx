import { useMemo, useCallback, useRef, useState } from "react";
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
  currentBackgroundId?: UniqueEntityID;
  onSelect: (backgroundId: UniqueEntityID | undefined) => void;
  isEditable?: boolean; // false = no delete button, no name overlay (mobile)
}

interface BackgroundItemProps {
  background: Background | DefaultBackground;
  isSelected: boolean;
  showNameOverlay?: boolean; // Show name overlay at bottom
  onSelect: (backgroundId: UniqueEntityID) => void;
  onDelete?: (backgroundId: UniqueEntityID) => void;
}

const BackgroundItem = ({
  background,
  isSelected,
  showNameOverlay = false,
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
        className="absolute inset-0 h-full w-full"
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
        {showNameOverlay && (
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="truncate text-xs text-white">{background.name}</p>
          </div>
        )}
      </button>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(background.id)}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 transition-opacity hover:bg-blue-300"
          aria-label={`Delete ${background.name}`}
        >
          <Trash2 className="h-3 w-3 text-blue-900" />
        </button>
      )}
    </div>
  );
};

export default function BackgroundGrid({
  currentBackgroundId,
  onSelect,
  isEditable = false,
}: BackgroundGridProps) {
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"astrsk" | "user">("astrsk");

  const hasUserBackgrounds = backgrounds.length > 0;

  // Handle add new background
  const handleAddBackground = useCallback(
    async (file: File) => {
      try {
        // Save file to background
        const backgroundOrError =
          await BackgroundService.saveFileToBackground.execute(file);

        if (backgroundOrError.isFailure) {
          toast.error("Failed to upload background", {
            description: backgroundOrError.getError() || "Unknown error",
          });
          return;
        }

        // Refresh backgrounds
        await fetchBackgrounds();

        // Switch to user added tab
        setActiveTab("user");

        toast.success("Background uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [setActiveTab],
  );

  // Handle delete background
  const handleDeleteBackground = useCallback(
    async (backgroundId: UniqueEntityID) => {
      try {
        const backgroundOrError =
          await BackgroundService.deleteBackground.execute(backgroundId);

        if (backgroundOrError.isFailure) {
          toast.error("Failed to delete background", {
            description: backgroundOrError.getError() || "Unknown error",
          });
          return;
        }

        // Refresh backgrounds
        await fetchBackgrounds();

        toast.success("Background deleted successfully");
      } catch (error) {
        toast.error("Failed to delete background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [],
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
          className="flex items-center gap-1 rounded-full bg-blue-200 px-3 py-1.5 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-300"
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
      <div className="flex border-b border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("astrsk")}
          className={cn(
            "flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "astrsk"
              ? "border-blue-200 text-blue-200"
              : "border-gray-800 text-gray-400 hover:text-gray-200",
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
                ? "border-blue-200 text-blue-200"
                : "border-gray-800 text-gray-400 hover:text-gray-200",
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
                "hover:border-blue-500 hover:brightness-110",
                !currentBackgroundId ? "border-blue-500" : "border-gray-700",
              )}
            >
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                <p className="text-xs text-gray-400">No background</p>
              </div>
            </button>

            {defaultBackgrounds.map((background) => (
              <BackgroundItem
                key={background.id.toString()}
                background={background}
                isSelected={currentBackgroundId?.equals(background.id) ?? false}
                showNameOverlay={isEditable}
                onSelect={onSelect}
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
                showNameOverlay={false}
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
