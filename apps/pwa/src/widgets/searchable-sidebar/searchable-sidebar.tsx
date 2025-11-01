import { useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchInput } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";

interface SearchableSidebarProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Simple searchable collapsible sidebar
 * - Collapse/expand toggle
 * - Search input at top
 * - Custom list content via children
 */
export function SearchableSidebar({
  keyword,
  onKeywordChange,
  children,
  defaultExpanded = true,
  className,
}: SearchableSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "border-border bg-background-surface-1 flex h-full flex-col border-r transition-all duration-300",
        isExpanded ? "w-80" : "w-12",
        className,
      )}
    >
      {/* Header: Search Input + Toggle Button */}
      <div className="border-border flex items-center gap-2 border-b p-2">
        {isExpanded && (
          <SearchInput
            name="sidebar-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Search..."
            className="flex-1"
          />
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-background-surface-2 hover:bg-background-surface-3 border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Scrollable List Content */}
      {isExpanded && <div className="flex-1 overflow-y-auto">{children}</div>}
    </div>
  );
}
