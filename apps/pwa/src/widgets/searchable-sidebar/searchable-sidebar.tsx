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
        "bg-surface flex flex-col overflow-hidden border-r border-border-default transition-all duration-300",
        isExpanded ? "w-80" : "w-12",
        className,
      )}
    >
      {/* Header: Search Input + Toggle Button - Fixed at top */}
      <div
        className={cn(
          "border-border-default flex shrink-0 items-center border-b p-2",
          isExpanded ? "gap-2" : "justify-center",
        )}
      >
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
          className={cn(
            "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-default transition-colors hover:text-fg-muted",
            isExpanded ? "bg-transparent" : "bg-surface-raised hover:bg-hover",
          )}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-6 w-6" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Scrollable List Content */}
      {isExpanded && (
        <div className="h-[calc(100dvh-4rem)] overflow-y-auto">{children}</div>
      )}
    </div>
  );
}
