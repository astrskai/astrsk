import { useState } from "react";
import { Upload, Download, Menu, Ellipsis, CircleHelp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchInput, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
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

      <div className="border-border flex flex-col border-b">
        {/* Desktop Header */}
        <div className="hidden items-center justify-between px-8 py-6 md:flex">
          {/* Left: Title or Navigation Links */}
          {tabs && tabs.length > 0 ? (
            <nav className="flex items-center gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <Link
                    key={tab.value}
                    to={tab.to}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      isActive
                        ? "bg-blue-900 text-gray-50 shadow hover:bg-blue-900/80"
                        : "bg-black-alternate text-text-secondary hover:bg-black-alternate/80",
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
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
                variant="ghost"
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
        <div className="flex flex-col md:hidden">
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
            <Button
              variant="secondary"
              icon={<Ellipsis size={20} />}
              size="sm"
              aria-label="More options"
              className="border-0 bg-transparent"
              onClick={onMoreClick}
            />
          </div>

          {/* Tab Navigation (if provided) */}
          {tabs && tabs.length > 0 && (
            <div className="border-border flex border-b px-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <Link
                    key={tab.value}
                    to={tab.to}
                    className={cn(
                      "text-text-secondary relative flex flex-1 items-center justify-center py-3 text-center text-sm font-medium transition-colors",
                      isActive && "text-text-primary font-semibold",
                    )}
                  >
                    {tab.label}
                    {/* Active Tab Indicator */}
                    {isActive && (
                      <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>
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
