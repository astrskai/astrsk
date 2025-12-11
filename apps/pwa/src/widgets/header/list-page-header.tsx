import { ChevronDown, Download, Plus } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import type { SelectOption } from "@/shared/ui/forms";
import { SimpleDropdownMenu } from "@/shared/ui/simple-dropdown-menu";

export interface ListPageHeaderProps {
  /**
   * Page title
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Search keyword value
   */
  keyword: string;

  /**
   * Search keyword change handler
   */
  onKeywordChange: (keyword: string) => void;

  /**
   * Import button click handler
   */
  onImportClick: () => void;

  /**
   * Optional help button click handler
   */
  onHelpClick?: () => void;

  /**
   * Create button label (e.g., "New Session", "Create Character")
   */
  createLabel: string;

  /**
   * Create button click handler
   */
  onCreateClick: () => void;

  /**
   * Sort options for the dropdown (optional)
   */
  sortOptions?: SelectOption[];

  /**
   * Current sort value (optional)
   */
  sortValue?: string;

  /**
   * Sort change handler (optional)
   */
  onSortChange?: (value: string) => void;
}

/**
 * List page header component with two-row layout
 *
 * Layout:
 * - Top Row: Title + Subtitle (left) | Import + Create (right)
 * - Bottom Row: Search (left, expands) | Sort (right)
 *
 * Used by: Sessions, Characters, Scenarios, Workflows pages
 */
export function ListPageHeader({
  title,
  subtitle,
  keyword,
  onKeywordChange,
  onImportClick,
  createLabel,
  onCreateClick,
  sortOptions,
  sortValue,
  onSortChange,
}: ListPageHeaderProps) {
  const showSort = sortOptions && sortValue !== undefined && onSortChange;

  return (
    <div className="sticky top-0 z-30 flex-shrink-0 bg-black p-2 md:px-8">
      <div className="flex flex-col gap-2 md:gap-4">
        {/* Top Row: Title & Primary Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 hidden text-zinc-500 md:block">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Import - Icon only on mobile */}
            <Button
              variant="secondary"
              size="md"
              icon={<Download size={14} />}
              onClick={onImportClick}
              title="Import"
            >
              <span className="hidden md:inline">Import</span>
            </Button>
            {/* Create (Primary Action) */}
            <Button
              size="md"
              icon={<Plus size={14} />}
              onClick={onCreateClick}
            >
              {createLabel}
            </Button>
          </div>
        </div>

        {/* Bottom Row: Search & Sort Toolbar */}
        <div className="flex items-center justify-between gap-2">
          {/* Search Input (Expands) */}
          <SearchInput
            name="page-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="h-9 flex-1 md:h-10 md:max-w-lg"
          />

          {/* Sort Dropdown */}
          {showSort && (
            <SimpleDropdownMenu
              align="end"
              trigger={
                <button className="flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 md:h-10 md:px-3">
                  <span className="mr-1 hidden text-xs font-bold tracking-wider text-zinc-500 uppercase md:inline">
                    Sort:
                  </span>
                  <span className="max-w-[80px] truncate md:max-w-none">
                    {sortOptions.find((o) => o.value === sortValue)?.label}
                  </span>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>
              }
              items={sortOptions.map((option) => ({
                label: option.label,
                onClick: () => onSortChange(option.value),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
