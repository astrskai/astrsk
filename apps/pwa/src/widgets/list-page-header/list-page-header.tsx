import { useState } from "react";
import { Upload, Download, Menu, Ellipsis, CircleHelp } from "lucide-react";
import { SearchInput, Button } from "@/shared/ui/forms";
import { NavigationTabs } from "@/shared/ui";
import { MobileMenuDrawer } from "@/widgets/mobile-menu-drawer";

export interface TabConfig {
  label: string;
  to: string;
  value: string;
}

export interface ListPageHeaderProps {
  /**
   * Page title (used for both desktop and mobile)
   */
  title: string;

  /**
   * Optional tabs for navigation (e.g., Characters, Plots, Flows)
   */
  tabs?: TabConfig[];

  /**
   * Currently active tab value (if tabs provided)
   */
  activeTab?: string;

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
   * Export button click handler
   */
  onExportClick: () => void;

  /**
   * Optional help button click handler
   */
  onHelpClick?: () => void;

  /**
   * Optional menu button click handler (mobile only)
   */
  onMenuClick?: () => void;

  /**
   * Optional more options button click handler (mobile only)
   */
  onMoreClick?: () => void;
}

/**
 * Reusable list page header component
 *
 * Features:
 * - Desktop: Title/Tabs + Search + Action buttons
 * - Mobile: Menu + Title + More | Tabs (optional) | Search
 *
 * Used by: Sessions, Characters, Plots, Flows pages
 */
export function ListPageHeader({
  title,
  tabs,
  activeTab,
  keyword,
  onKeywordChange,
  onImportClick,
  onExportClick,
  onHelpClick,
  onMenuClick,
  onMoreClick,
}: ListPageHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(true);
    onMenuClick?.();
  };

  return (
    <>
      <MobileMenuDrawer open={isMenuOpen} onOpenChange={setIsMenuOpen} />

      <div className="bg-dark-surface sticky top-0 z-50 flex flex-col shadow-md">
        {/* Desktop Header */}
        <div className="mx-auto hidden w-full max-w-7xl items-center justify-between p-4 md:flex">
          {/* Left: Title or Navigation Links */}
          {tabs && tabs.length > 0 ? (
            <NavigationTabs
              tabs={tabs}
              activeTab={activeTab || ""}
              variant="desktop"
            />
          ) : (
            <h1 className="text-text-primary text-2xl font-semibold">
              {title}
            </h1>
          )}

          {/* Right: Search, Import, Export, Help */}
          <div className="flex items-center gap-3">
            <SearchInput
              name="page-search"
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
                icon={
                  <CircleHelp
                    size={20}
                    className="text-gray-200 hover:text-gray-100"
                  />
                }
                onClick={onHelpClick}
              />
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="mx-auto flex w-full max-w-7xl flex-col md:hidden">
          {/* Top Row: Menu, Title, More */}
          <div className="flex items-center justify-between px-4 py-4">
            <Button
              variant="secondary"
              icon={<Menu size={20} />}
              size="sm"
              aria-label="Menu"
              className="border-0 bg-transparent"
              onClick={handleMenuClick}
            />
            <h1 className="text-text-primary text-lg font-semibold">
              {tabs && activeTab
                ? tabs.find((t) => t.value === activeTab)?.label || title
                : title}
            </h1>
            {/* TODO: Add more options button */}
            <div className="w-4">&nbsp;</div>
            <Button
              variant="secondary"
              icon={<Ellipsis size={20} />}
              size="sm"
              aria-label="More options"
              className="hidden border-0 bg-transparent"
              onClick={onMoreClick}
            />
          </div>

          {/* Tab Navigation (if provided) */}
          {tabs && tabs.length > 0 && (
            <NavigationTabs
              tabs={tabs}
              activeTab={activeTab || ""}
              variant="mobile"
              className="px-4"
            />
          )}

          {/* Bottom Row: Search Input */}
          <div className="px-4 pt-4 pb-4">
            <SearchInput
              name="page-search"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
}
