import { Upload, Download, Menu, Ellipsis, CircleHelp } from "lucide-react";
import { SearchInput, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";

export type AssetType = "characters" | "plots" | "flows";

interface AssetsPageHeaderProps {
  activeTab: AssetType;
  onTabChange: (tab: AssetType) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onHelpClick?: () => void;
}

const TAB_LABELS: Record<AssetType, string> = {
  characters: "Characters",
  plots: "Plots",
  flows: "Flows",
};

/**
 * Assets page header with tab navigation and action buttons
 * Responsive: Desktop shows tabs + actions horizontally, Mobile shows stacked layout
 */
export function AssetsPageHeader({
  activeTab,
  onTabChange,
  keyword,
  onKeywordChange,
  onImportClick,
  onExportClick,
  onHelpClick,
}: AssetsPageHeaderProps) {
  return (
    <div className="border-border flex flex-col border-b">
      {/* Desktop Header */}
      <div className="hidden items-center justify-between px-8 py-6 md:flex">
        {/* Left: Tab Buttons */}
        <div className="flex items-center gap-2">
          {(Object.keys(TAB_LABELS) as AssetType[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "secondary"}
              onClick={() => onTabChange(tab)}
              className={cn(
                "transition-colors",
                activeTab === tab && "font-semibold",
              )}
            >
              {TAB_LABELS[tab]}
            </Button>
          ))}
        </div>

        {/* Right: Search, Import, Export, Help */}
        <div className="flex items-center gap-3">
          <SearchInput
            name="asset-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-[200px]"
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
        {/* Top Row: Menu, Active Tab Title, More */}
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="secondary"
            icon={<Menu size={20} />}
            size="sm"
            aria-label="Menu"
            className="bg-transparent"
          />
          <h1 className="text-text-primary text-lg font-semibold">
            {TAB_LABELS[activeTab]}
          </h1>
          <Button
            variant="secondary"
            icon={<Ellipsis size={20} />}
            size="sm"
            aria-label="More buttons"
            className="bg-transparent"
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-border flex border-b px-4">
          {(Object.keys(TAB_LABELS) as AssetType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "text-text-secondary relative flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab && "text-text-primary font-semibold",
              )}
            >
              {TAB_LABELS[tab]}
              {/* Active Tab Indicator */}
              {activeTab === tab && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom Row: Search Input */}
        <div className="px-4 pt-4 pb-4">
          <SearchInput
            name="asset-search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
