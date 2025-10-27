import { Upload, Download, Menu, Ellipsis, CircleHelp } from "lucide-react";
import { SearchInput, Button } from "@/shared/ui/forms";

interface SessionsPageHeaderProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onHelpClick?: () => void;
}

/**
 * Sessions page header with search and action buttons
 * Responsive: Desktop shows title + actions horizontally, Mobile shows stacked layout
 */
export function SessionsPageHeader({
  keyword,
  onKeywordChange,
  onImportClick,
  onExportClick,
  onHelpClick,
}: SessionsPageHeaderProps) {
  return (
    <div className="border-border flex flex-col border-b">
      {/* Desktop Header */}
      <div className="hidden items-center justify-between px-8 py-6 md:flex">
        {/* Left: Title */}
        <h1 className="text-text-primary text-2xl font-semibold">Sessions</h1>

        {/* Right: Search, Import, Export */}
        <div className="flex items-center gap-3">
          <SearchInput
            name="session-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-[160px]"
          />
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={onImportClick}
          >
            Import
          </Button>
          <Button
            variant="secondary"
            icon={<Upload size={16} />}
            onClick={onExportClick}
          >
            Export
          </Button>
          {onHelpClick && (
            <Button
              variant="secondary"
              icon={<CircleHelp size={20} />}
              onClick={onHelpClick}
            />
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col md:hidden">
        {/* Top Row: Menu, Title, More */}
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="secondary"
            icon={<Menu size={20} />}
            size="sm"
            aria-label="Menu"
            className="bg-transparent"
          />
          <h1 className="text-text-primary text-lg font-semibold">Sessions</h1>
          <Button
            variant="secondary"
            icon={<Ellipsis size={20} />}
            size="sm"
            aria-label="More buttons"
            className="bg-transparent"
          />
        </div>

        {/* Bottom Row: Search Input */}
        <div className="px-4 pb-4">
          <SearchInput
            name="session-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
