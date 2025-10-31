import { Upload, Download, Menu, Ellipsis, CircleHelp } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { SearchInput, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";

export type AssetType = "characters" | "plots" | "flows";

interface AssetsHeaderProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onHelpClick?: () => void;
}

const ASSET_ROUTES: Record<AssetType, { label: string; to: string }> = {
  characters: { label: "Characters", to: "/assets/characters" },
  plots: { label: "Plots", to: "/assets/plots" },
  flows: { label: "Flows", to: "/assets/flows" },
};

/**
 * Assets header with navigation links and action buttons
 * Responsive: Desktop shows nav links + actions horizontally, Mobile shows stacked layout
 */
export function AssetsHeader({
  keyword,
  onKeywordChange,
  onImportClick,
  onExportClick,
  onHelpClick,
}: AssetsHeaderProps) {
  const location = useLocation();

  // Determine current active route
  const currentAssetType: AssetType | null = location.pathname.includes(
    "/characters",
  )
    ? "characters"
    : location.pathname.includes("/plots")
      ? "plots"
      : location.pathname.includes("/flows")
        ? "flows"
        : null;

  return (
    <div className="border-border flex flex-col border-b">
      {/* Desktop Header */}
      <div className="hidden items-center justify-between px-8 py-6 md:flex">
        {/* Left: Navigation Links */}
        <nav className="flex items-center gap-2">
          {(Object.keys(ASSET_ROUTES) as AssetType[]).map((type) => {
            const isActive = currentAssetType === type;
            return (
              <Link
                key={type}
                to={ASSET_ROUTES[type].to}
                className={cn(
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow"
                    : "bg-background-surface-1 text-text-secondary hover:bg-background-surface-2",
                )}
              >
                {ASSET_ROUTES[type].label}
              </Link>
            );
          })}
        </nav>

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
            className="hidden"
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
            {currentAssetType ? ASSET_ROUTES[currentAssetType].label : "Assets"}
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
          {(Object.keys(ASSET_ROUTES) as AssetType[]).map((type) => {
            const isActive = currentAssetType === type;
            return (
              <Link
                key={type}
                to={ASSET_ROUTES[type].to}
                className={cn(
                  "text-text-secondary relative flex flex-1 items-center justify-center py-3 text-center text-sm font-medium transition-colors",
                  isActive && "text-text-primary font-semibold",
                )}
              >
                {ASSET_ROUTES[type].label}
                {/* Active Tab Indicator */}
                {isActive && (
                  <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                )}
              </Link>
            );
          })}
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
