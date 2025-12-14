import React, { useState, useEffect } from 'react';
import { cn, formatCompactNumber } from '../../lib/utils';
import {
  BaseCard,
  CardActionToolbar,
  CardBadges,
  CardMetadataContainer,
  CardMetadataItem,
  CardLikeButton,
  CardPopularityStats,
  type CardAction,
  type CardBadge,
  type LikeButtonProps,
} from '../Card';
import { type ImageComponentProps } from '../../provider';
import { useImageRenderer } from '../../hooks';

export interface CharacterCardProps {
  /** Character name */
  name: string;
  /** Character image URL */
  imageUrl?: string | null;
  /** Character summary/description */
  summary?: string;
  /** Character tags */
  tags: string[];
  /**
   * Maximum number of tags to display before showing "+n" indicator.
   * @default 3
   */
  maxVisibleTags?: number;
  /** Token count for the character (used in default metadata) */
  tokenCount?: number;
  /** Last updated timestamp (used in default metadata) */
  updatedAt?: string;
  /** Action buttons displayed on the card */
  actions?: CardAction[];
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is disabled */
  isDisabled?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /**
   * Badges to display on the card (e.g., type indicator, private, owner).
   */
  badges?: CardBadge[];
  /** Placeholder image URL when imageUrl is not provided */
  placeholderImageUrl?: string;
  /**
   * Custom render function for the metadata section.
   * When provided, replaces the default tokenCount/updatedAt display.
   * Use CardMetadataContainer and CardMetadataItem for consistent styling.
   */
  renderMetadata?: () => React.ReactNode;
  /** Text to display when summary is empty. Defaults to "No summary". Set to empty string to hide. */
  emptySummaryText?: string;
  /**
   * Like button configuration (displays in top-right corner).
   * Controlled component - parent manages isLiked state and handles onClick.
   * @example
   * ```tsx
   * const [isLiked, setIsLiked] = useState(false);
   * <CharacterCard
   *   likeButton={{
   *     isLiked: isLiked,
   *     onClick: () => setIsLiked(!isLiked),
   *     isLoading: false
   *   }}
   * />
   * ```
   */
  likeButton?: LikeButtonProps;
  /** Like count to display in popularity stats */
  likeCount?: number;
  /** Download count to display in popularity stats */
  downloadCount?: number;
  /**
   * The sizes attribute for the image element.
   * Helps browser select appropriate image size for responsive loading.
   * @example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
   */
  imageSizes?: string;
  /**
   * Loading strategy for the image.
   * Use 'eager' for above-the-fold images (e.g., first few cards in a list).
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager';
  /**
   * Priority loading hint for LCP optimization.
   * When true, the image will be preloaded with high priority (adds <link rel="preload">).
   * Use for the first visible card in a list to improve LCP score.
   * @default false
   */
  priority?: boolean;
  /**
   * Custom image renderer for framework-specific optimization.
   * Takes precedence over DesignSystemProvider's imageComponent.
   * @example Next.js usage:
   * ```tsx
   * renderImage={(props) => (
   *   <NextImage {...props} fill style={{ objectFit: 'cover' }} />
   * )}
   * ```
   */
  renderImage?: (props: ImageComponentProps) => React.ReactNode;
  /**
   * Custom footer actions to display at the bottom of the card.
   * Renders below the content area with a top border separator.
   * Useful for action buttons like "Play", "Add", "Edit", etc.
   * @example
   * ```tsx
   * <CharacterCard
   *   footerActions={
   *     <>
   *       <button className="flex-1 py-2">Play</button>
   *       <button className="flex-1 py-2">Add</button>
   *     </>
   *   }
   * />
   * ```
   */
  footerActions?: React.ReactNode;
}

// Re-export for backward compatibility
export const MetadataContainer = CardMetadataContainer;
export const MetadataItem = CardMetadataItem;

export function CharacterCard({
  name,
  imageUrl,
  summary,
  tags,
  maxVisibleTags = 3,
  tokenCount = 0,
  updatedAt,
  className,
  actions = [],
  isDisabled = false,
  onClick,
  badges = [],
  placeholderImageUrl,
  renderMetadata,
  emptySummaryText = 'No summary',
  likeButton,
  likeCount,
  downloadCount,
  imageSizes,
  loading = 'lazy',
  priority = false,
  footerActions,
  renderImage,
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);
  const renderImageWithProvider = useImageRenderer({ renderImage });

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl, placeholderImageUrl]);

  // Show image if URL exists and no error
  const shouldShowImage = (imageUrl || placeholderImageUrl) && !imageError;
  // Show initial fallback when no image URL or image fails to load
  const shouldShowInitial = !shouldShowImage;

  const renderImageElement = () => {
    const src = imageUrl || placeholderImageUrl;
    if (!src) return null;

    return renderImageWithProvider({
      src,
      alt: name,
      className:
        'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
      sizes: imageSizes,
      loading,
      onError: () => setImageError(true),
      fill: true,
      priority,
    });
  };

  return (
    <BaseCard
      className={cn('min-h-[380px]', className)}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Image Area - Portrait ratio */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        {shouldShowImage && renderImageElement()}
        {shouldShowInitial && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-zinc-500">
              {name.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

        {/* Like Button (top-right, always visible) */}
        {likeButton && (
          <div className="absolute top-2 right-2 z-20">
            <CardLikeButton {...likeButton} />
          </div>
        )}

        {/* Action Toolbar (Responsive) - positioned below like button if present */}
        <CardActionToolbar
          actions={actions}
          className={likeButton ? 'top-12' : undefined}
        />

        {/* Left Badges */}
        {badges.some((b) => (b.position ?? 'left') === 'left') && (
          <div className="absolute top-3 left-3 z-10 max-w-[45%]">
            <CardBadges badges={badges} position="left" />
          </div>
        )}

        {/* Right Badges */}
        {badges.some((b) => b.position === 'right') && (
          <div className="absolute top-3 right-3 z-10 max-w-[45%]">
            <CardBadges badges={badges} position="right" />
          </div>
        )}
      </div>

      {/* Content Area - Overlapping with image */}
      <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md">
          {name}
        </h3>

        {/* Tags */}
        <div className="mb-2 md:mb-4 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            <>
              {tags.slice(0, maxVisibleTags).map((tag, index) => {
                // Calculate max-width based on maxVisibleTags
                // Formula: ~85% / (n + 1) to leave room for "+n" badge and gaps
                const maxWidthPercent = Math.floor(85 / (maxVisibleTags + 1));
                return (
                  <span
                    key={`${tag}-${index}`}
                    className="truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300"
                    style={{ maxWidth: `${maxWidthPercent}%` }}
                  >
                    {tag}
                  </span>
                );
              })}
              {tags.length > maxVisibleTags && (
                <span className="shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  +{tags.length - maxVisibleTags}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-400">No tags</span>
          )}
        </div>

        {(summary || emptySummaryText) && (
          <p className="mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400">
            {summary || emptySummaryText}
          </p>
        )}

        {/* Popularity Stats (likes, downloads) */}
        {(likeCount !== undefined || downloadCount !== undefined) && (
          <CardPopularityStats
            likeCount={likeCount}
            downloadCount={downloadCount}
            className="mb-2"
          />
        )}

        {/* Metadata */}
        {renderMetadata ? (
          renderMetadata()
        ) : (
          <CardMetadataContainer>
            <CardMetadataItem>{formatCompactNumber(tokenCount)} Tokens</CardMetadataItem>
            {updatedAt && <CardMetadataItem>{updatedAt}</CardMetadataItem>}
          </CardMetadataContainer>
        )}
      </div>

      {/* Footer Actions */}
      {footerActions && (
        <div className="mt-auto flex border-t border-zinc-800">
          {footerActions}
        </div>
      )}
    </BaseCard>
  );
}

export type { CardAction, CardBadge, LikeButtonProps };
