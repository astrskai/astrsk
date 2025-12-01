import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  BaseCard,
  CardActionToolbar,
  CardMetadataContainer,
  CardMetadataItem,
  type CardAction,
} from '../Card';

export interface CharacterCardProps {
  /** Character name */
  name: string;
  /** Character image URL */
  imageUrl?: string | null;
  /** Character summary/description */
  summary?: string;
  /** Character tags */
  tags: string[];
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
  /** Whether to show the type indicator badge */
  showTypeIndicator?: boolean;
  /** Custom content for the type indicator badge (icon and/or text) */
  typeIndicator?: React.ReactNode;
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
}

// Re-export for backward compatibility
export const MetadataContainer = CardMetadataContainer;
export const MetadataItem = CardMetadataItem;

export function CharacterCard({
  name,
  imageUrl,
  summary,
  tags,
  tokenCount = 0,
  updatedAt,
  className,
  actions = [],
  isDisabled = false,
  onClick,
  showTypeIndicator = false,
  typeIndicator,
  placeholderImageUrl,
  renderMetadata,
  emptySummaryText = 'No summary',
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);

  // Show image if URL exists and no error
  const shouldShowImage = (imageUrl || placeholderImageUrl) && !imageError;
  // Show initial fallback when no image URL or image fails to load
  const shouldShowInitial = !shouldShowImage;

  return (
    <BaseCard
      className={cn('min-h-[380px]', className)}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Image Area - Portrait ratio */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        {shouldShowImage && (
          <img
            src={imageUrl || placeholderImageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {shouldShowInitial && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-zinc-600">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />

        {/* Action Toolbar (Responsive) */}
        <CardActionToolbar actions={actions} />

        {/* Type Badge */}
        {showTypeIndicator && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              {typeIndicator || 'CHARACTER'}
            </div>
          </div>
        )}
      </div>

      {/* Content Area - Overlapping with image */}
      <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-xl font-bold break-words text-white drop-shadow-md">
          {name}
        </h3>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  +{tags.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-600">No tags</span>
          )}
        </div>

        {(summary || emptySummaryText) && (
          <p className="mb-4 line-clamp-3 flex-grow text-xs leading-relaxed break-words text-zinc-400">
            {summary || emptySummaryText}
          </p>
        )}

        {/* Metadata */}
        {renderMetadata ? (
          renderMetadata()
        ) : (
          <CardMetadataContainer>
            <CardMetadataItem>{tokenCount} Tokens</CardMetadataItem>
            {updatedAt && <CardMetadataItem>{updatedAt}</CardMetadataItem>}
          </CardMetadataContainer>
        )}
      </div>
    </BaseCard>
  );
}

export type { CardAction };
