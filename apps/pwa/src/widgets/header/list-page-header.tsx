import { Download, Plus } from "lucide-react";
import { Button, SearchInput, Select, type SelectOption } from "@astrsk/design-system";

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
    <div className="sticky top-0 z-30 flex-shrink-0 bg-black p-4 md:px-8">
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
              onClick={onImportClick}
              title="Import"
            >
              <Download size={14} />
              <span className="hidden md:inline">Import</span>
            </Button>
            {/* Create (Primary Action) */}
            <Button onClick={onCreateClick}>
              <Plus size={14} />
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
            onClear={() => onKeywordChange("")}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="h-9 flex-1 md:h-10 md:max-w-lg"
          />

          {/* Sort Dropdown */}
          {showSort && (
            <Select
              options={sortOptions}
              value={sortValue}
              onChange={onSortChange}
              align="end"
            />
          )}
        </div>
      </div>
    </div>
  );
}
