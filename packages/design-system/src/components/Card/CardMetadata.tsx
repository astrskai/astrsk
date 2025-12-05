import * as React from 'react';

/**
 * Container for metadata items in card components.
 * Provides consistent styling for the metadata section.
 *
 * @example
 * ```tsx
 * <CardMetadataContainer>
 *   <CardMetadataItem icon={<Clock />}>2 days ago</CardMetadataItem>
 *   <CardMetadataItem>1500 Tokens</CardMetadataItem>
 * </CardMetadataContainer>
 * ```
 */
export function CardMetadataContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
      {children}
    </div>
  );
}

/**
 * Individual metadata item with optional icon.
 * Use inside CardMetadataContainer for consistent styling.
 *
 * @example
 * ```tsx
 * <CardMetadataItem icon={<Heart className="size-3" />}>2.5k likes</CardMetadataItem>
 * <CardMetadataItem>Just now</CardMetadataItem>
 * ```
 */
export function CardMetadataItem({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      {children}
    </div>
  );
}
