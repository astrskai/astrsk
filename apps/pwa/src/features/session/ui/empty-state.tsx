interface EmptyStateProps {
  keyword: string;
  onClearSearch: () => void;
}

/**
 * Empty state component for sessions page
 * Shows different messages for search results vs no sessions
 */
export function EmptyState({ keyword, onClearSearch }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="text-text-secondary">
        {keyword ? "No sessions found" : "No sessions yet"}
      </div>
      {keyword && (
        <button
          onClick={onClearSearch}
          className="text-primary text-sm hover:underline"
        >
          Clear search
        </button>
      )}
    </div>
  );
}
