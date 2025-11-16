import { useMemo } from "react";
import { cn } from "@/shared/lib";
import {
  useBackgroundStore,
  isDefaultBackground,
  DefaultBackground,
} from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Background } from "@/entities/background/domain/background";

interface BackgroundGridProps {
  currentBackgroundId?: UniqueEntityID;
  onSelect: (backgroundId: UniqueEntityID) => void;
}

interface BackgroundItemProps {
  background: Background | DefaultBackground;
  isSelected: boolean;
  onSelect: (backgroundId: UniqueEntityID) => void;
}

const BackgroundItem = ({
  background,
  isSelected,
  onSelect,
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
    <button
      type="button"
      onClick={() => onSelect(background.id)}
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
        "hover:border-blue-500 hover:brightness-110",
        isSelected ? "border-blue-500" : "border-gray-700",
      )}
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
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="truncate text-xs text-white">{background.name}</p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
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
  );
};

export default function BackgroundGrid({
  currentBackgroundId,
  onSelect,
}: BackgroundGridProps) {
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();

  // Combine default + user backgrounds
  const allBackgrounds = useMemo(() => {
    return [...defaultBackgrounds, ...backgrounds];
  }, [defaultBackgrounds, backgrounds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-200">
          Select Background
        </h4>
        <span className="text-xs text-gray-400">
          {allBackgrounds.length} backgrounds
        </span>
      </div>

      <div className="custom-scrollbar grid max-h-96 grid-cols-3 gap-2 overflow-y-auto">
        {allBackgrounds.map((background) => (
          <BackgroundItem
            key={background.id.toString()}
            background={background}
            isSelected={currentBackgroundId?.equals(background.id) ?? false}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
