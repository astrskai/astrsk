import { Button } from "./forms";

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
  /**
   * Callback when clear search button is clicked
   */
  onClearSearch?: () => void;
  /**
   * Custom clear button text
   * @default "Clear search"
   */
  clearButtonText?: string;
}

/**
 * Empty state component for search results
 * Displays a message when search returns no results
 * Optionally shows a clear search button
 */
export function SearchEmptyState({
  keyword,
  message = "No results found",
  description,
  onClearSearch,
  clearButtonText = "Clear search",
}: SearchEmptyStateProps) {
  return (
    <div className="text-text-secondary flex h-full flex-col items-center justify-center gap-4">
      <div className="text-center">
        <p className="mb-2 text-lg">{message}</p>
        {description && <p className="text-sm">{description}</p>}
      </div>
      {keyword && onClearSearch && (
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          {clearButtonText}
        </Button>
      )}
    </div>
  );
}
