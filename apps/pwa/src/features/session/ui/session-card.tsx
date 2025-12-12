import React from "react";
import {
  Layers,
  MessageSquare,
  MessagesSquare,
  CircleAlert,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import {
  BaseCard,
  CardActionToolbar,
  type CardAction,
} from "@/features/common/ui";

interface CharacterAvatar {
  name: string;
  iconAssetId?: string;
}

/**
 * Character Avatar Skeleton Component
 * Displays loading skeleton for character avatars
 */
const CharacterAvatarSkeleton = () => {
  return (
    <div className="h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700" />
  );
};

/**
 * Character Avatar Component
 * Displays character avatar with useAsset hook
 */
const CharacterAvatarImage = ({ iconAssetId, name }: CharacterAvatar) => {
  // Convert string to UniqueEntityID if exists
  const assetId = iconAssetId ? new UniqueEntityID(iconAssetId) : undefined;
  const [imageUrl] = useAsset(assetId);

  return (
    <div
      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700"
      title={name}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <User className="h-4 w-4 text-zinc-500" />
      )}
    </div>
  );
};

interface SessionCardProps {
  title: string;
  imageUrl?: string | null;
  messageCount?: number;
  isInvalid?: boolean;
  actions?: CardAction[];
  className?: string;
  isDisabled?: boolean;
  onClick?: () => void;
  characterAvatars?: CharacterAvatar[];
  areCharactersLoading?: boolean;
  showTypeIndicator?: boolean;
  isGenerating?: boolean;
}

const SessionCard = ({
  title,
  imageUrl,
  messageCount = 0,
  isInvalid = false,
  actions = [],
  className,
  isDisabled = false,
  onClick,
  characterAvatars = [],
  areCharactersLoading = false,
  showTypeIndicator = false,
  isGenerating = false,
}: SessionCardProps) => {
  // Disable card interaction while generating
  const cardDisabled = isDisabled || isGenerating;

  return (
    <BaseCard
      className={cn(
        "min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",
        !cardDisabled && onClick && "hover:ring-zinc-600",
        isGenerating && "cursor-not-allowed",
        className,
      )}
      isDisabled={cardDisabled}
      onClick={cardDisabled ? undefined : onClick}
    >
      {/* Generating Overlay - fully covers card content */}
      {isGenerating ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-3 text-sm font-medium text-zinc-300">Generating workflow...</p>
        </div>
      ) : (
        <>
          {/* Header Image Area */}
          <div className="relative h-56 overflow-hidden bg-zinc-800">
        {/* Cover Image - use placeholder if no cover image */}
        <img
          src={imageUrl || "/img/placeholder/scenario-placeholder.png"}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

        {/* Action Toolbar (Responsive) */}
        <CardActionToolbar actions={actions} />

        {/* Invalid Indicator Badge */}
        {isInvalid && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded border border-red-900/50 bg-red-950/50 px-2 py-1 text-[10px] font-bold text-red-400 backdrop-blur-md">
              <CircleAlert size={12} />
              INVALID
            </div>
          </div>
        )}

        {/* Session Badge & Title */}
        <div className="absolute bottom-0 left-0 w-full p-5">
          {showTypeIndicator && (
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded bg-indigo-500/20 p-1.5 text-indigo-400 backdrop-blur-md">
                <Layers size={16} />
              </div>
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
                Session
              </span>
            </div>
          )}
          <h2 className="line-clamp-2 h-[3.75rem] text-2xl leading-tight font-bold break-words text-white">
            {title}
          </h2>
        </div>
      </div>

      {/* Session Details */}
      <div className="flex flex-grow flex-col justify-between p-5">
        <div className="space-y-3">
          {/* Separator */}
          <div className="border-b border-zinc-800 pb-2" />

          {/* Character Avatars */}
          {areCharactersLoading ? (
            // Loading skeleton - show 3 placeholder avatars
            <div className="flex -space-x-2 pt-1">
              <CharacterAvatarSkeleton />
              <CharacterAvatarSkeleton />
              <CharacterAvatarSkeleton />
            </div>
          ) : (
            characterAvatars.length > 0 && (
              <div className="flex -space-x-2 pt-1">
                {characterAvatars.slice(0, 3).map((avatar, idx) => (
                  <CharacterAvatarImage
                    key={`${avatar.iconAssetId}-${idx}`}
                    iconAssetId={avatar.iconAssetId}
                    name={avatar.name}
                  />
                ))}
                {characterAvatars.length > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-500">
                    +{characterAvatars.length - 3}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
        </>
      )}
    </BaseCard>
  );
};

export default SessionCard;
