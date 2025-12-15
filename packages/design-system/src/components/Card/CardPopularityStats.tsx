import { cn } from '../../lib/utils';

export interface CardPopularityStatsProps {
  /** Like count */
  likeCount?: number;
  /** Download count */
  downloadCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format large numbers to compact form
 * @example
 * formatCount(999) // "999"
 * formatCount(1000) // "1K"
 * formatCount(1234) // "1.2K"
 * formatCount(12345) // "12.3K"
 * formatCount(123456) // "123K"
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  if (count < 10000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  if (count < 1000000) {
    return `${Math.floor(count / 1000)}K`;
  }
  if (count < 10000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  return `${Math.floor(count / 1000000)}M`;
}

/**
 * Heart Icon (Internal)
 */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * Download Icon (Internal)
 */
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

/**
 * CardPopularityStats Component
 *
 * Displays popularity metrics (likes, downloads) for card components.
 * Visually distinct from other metadata with colored icons.
 *
 * @example
 * ```tsx
 * <CardPopularityStats
 *   likeCount={1234}
 *   downloadCount={5678}
 * />
 * ```
 */
export function CardPopularityStats({
  likeCount,
  downloadCount,
  className,
}: CardPopularityStatsProps) {
  const hasLikes = likeCount !== undefined;
  const hasDownloads = downloadCount !== undefined;

  if (!hasLikes && !hasDownloads) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {hasLikes && (
        <div className="flex items-center gap-1">
          <HeartIcon className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-medium text-zinc-300">
            {formatCount(likeCount)}
          </span>
        </div>
      )}
      {hasDownloads && (
        <div className="flex items-center gap-1">
          <DownloadIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-300">
            {formatCount(downloadCount)}
          </span>
        </div>
      )}
    </div>
  );
}
