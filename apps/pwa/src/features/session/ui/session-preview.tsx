import { cn } from "@/shared/lib";
import {
  MessageCircle,
  CircleAlert,
  EllipsisVertical,
  User,
} from "lucide-react";
import { SessionPlaceholder } from "@/shared/assets/placeholders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CardAction } from "@/features/common/ui";

interface CharacterAvatar {
  name: string;
  iconAssetId?: string;
}

/**
 * Character Avatar Component
 * Displays character avatar with useAsset hook
 */
const CharacterAvatarImage = ({ iconAssetId, name }: CharacterAvatar) => {
  // Convert string to UniqueEntityID if exists
  const assetId = iconAssetId ? { toString: () => iconAssetId } : undefined;
  const [imageUrl] = useAsset(assetId as any);

  return (
    <div
      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-gray-700 bg-gray-800"
      title={name}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <User className="h-4 w-4 text-gray-500" />
      )}
    </div>
  );
};

interface SessionPreviewProps {
  title: string;
  imageUrl?: string | null;
  messageCount?: number;
  isInvalid?: boolean;
  actions?: CardAction[];
  className?: string;
  isShowActions?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  characterAvatars?: CharacterAvatar[];
}

const SessionPreview = ({
  title,
  imageUrl,
  messageCount = 0,
  isInvalid = false,
  actions = [],
  className,
  isShowActions = false,
  isDisabled = false,
  onClick,
  characterAvatars = [],
}: SessionPreviewProps) => {
  return (
    <article
      className={cn(
        "group/preview relative flex aspect-[1/1] w-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200 transition-all duration-300",
        !isDisabled && onClick && "cursor-pointer",
        isDisabled
          ? "pointer-events-none"
          : "hover:border-gray-500 hover:shadow-lg",
        className,
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      {/* Disabled overlay */}
      {isDisabled && (
        <div className="absolute inset-0 z-20 bg-white opacity-40" />
      )}

      {/* Action buttons - Desktop (hover) */}
      {isShowActions && actions.length > 0 && (
        <div className="absolute top-2 right-2 z-30 hidden -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover/preview:translate-y-0 group-hover/preview:opacity-100 md:flex">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(e);
              }}
              disabled={action.disabled}
              aria-label={action.label}
              className={cn(
                "bg-normal-primary hover:bg-normal-primary/80 flex h-8 w-8 items-center justify-center rounded-full text-sm text-blue-900 transition-opacity",
                action.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              )}
            >
              <action.icon
                className={cn("h-4", action.loading && "animate-pulse")}
              />
            </button>
          ))}
        </div>
      )}

      {/* Action buttons - Mobile (dropdown menu) */}
      {isShowActions && actions.length > 0 && (
        <div className="absolute top-2 right-2 z-30 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                aria-label="More actions"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-gray-50 hover:bg-gray-800/80"
              >
                <EllipsisVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-700 md:hidden"
            >
              {actions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(e);
                  }}
                  disabled={action.disabled}
                  className="flex items-center gap-2"
                >
                  <action.icon
                    className={cn("h-4 w-4", action.loading && "animate-pulse")}
                  />
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Top : Cover Image */}
      <div className="relative h-[55%] w-full overflow-hidden bg-gray-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              !isDisabled && "group-hover/preview:scale-105",
            )}
            loading="lazy"
          />
        ) : (
          <SessionPlaceholder
            className="h-full w-full text-gray-600"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
      </div>

      {/* Bottom : Content */}
      <div className="relative flex h-[45%] overflow-hidden px-4 py-2">
        {/* Background image with blur on hover */}
        {!isDisabled && imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-0 blur-md transition-opacity duration-300 group-hover/preview:opacity-20"
            style={{
              backgroundImage: `url(${imageUrl})`,
            }}
          />
        )}

        {/* Content layer */}
        <div className="relative z-10 flex h-full w-full flex-col justify-around gap-1">
          {/* Title with invalid indicator */}
          <div className="flex items-start gap-1">
            <h3
              className={cn(
                "line-clamp-2 flex-1 overflow-hidden text-left text-sm font-semibold text-gray-50 md:text-base",
                "transition-all duration-300 group-hover/preview:text-gray-200",
              )}
            >
              {title}
            </h3>
            {isInvalid && (
              <CircleAlert
                size={16}
                className="mt-0.5 flex-shrink-0 text-red-500"
              />
            )}
          </div>

          {/* Message Count */}
          <div className="flex items-center gap-1 text-left text-xs md:text-sm">
            {messageCount === 0 ? (
              <span className="text-gray-400">New session</span>
            ) : (
              <>
                <MessageCircle className="mr-1 h-3 w-3 text-white md:h-4 md:w-4" />
                <span className="font-semibold text-gray-50">
                  {messageCount.toLocaleString()}
                </span>
                <span className="text-gray-400">
                  {messageCount === 1 ? "Message" : "Messages"}
                </span>
              </>
            )}
          </div>

          {/* Character Avatars */}
          {characterAvatars.length > 0 && (
            <div className="flex items-center gap-1">
              {characterAvatars.slice(0, 3).map((avatar, idx) => (
                <CharacterAvatarImage
                  key={`${avatar.iconAssetId}-${idx}`}
                  iconAssetId={avatar.iconAssetId}
                  name={avatar.name}
                />
              ))}
              {characterAvatars.length > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-gray-800 text-xs text-gray-400">
                  +{characterAvatars.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default SessionPreview;
