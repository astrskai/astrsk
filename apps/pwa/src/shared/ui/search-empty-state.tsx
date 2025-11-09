interface SearchEmptyStateProps {
  /**
   * Search keyword that produced no results
   */
  keyword?: string;
  /**
   * Message to display when no results found
   * @default "No results found"
   */
  message?: string;
  /**
   * Optional description text
   */
  description?: string;
}

/**
 * Empty state component for search results
 * Displays a message when search returns no results
 * Optionally shows a clear search button
 */
export function SearchEmptyState({
  keyword,
  message,
  description,
}: SearchEmptyStateProps) {
  return (
    <div className="text-text-secondary flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="max-w-[300px] text-center">
        <p className="text-text-primary mb-2 line-clamp-2 text-2xl font-semibold text-ellipsis">
          {message || `No results for '${keyword}'`}
        </p>
        <p className="text-sm">
          {description || `Try a different name, tag or keyword`}
        </p>
      </div>
    </div>
  );
}
