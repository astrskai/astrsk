import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib";

export interface NavigationTabConfig {
  label: string;
  to: string;
  value: string;
}

export interface NavigationTabsProps {
  /**
   * Tab configuration array
   */
  tabs: NavigationTabConfig[];

  /**
   * Currently active tab value
   */
  activeTab: string;

  /**
   * Visual variant
   * - desktop: Button-style tabs with blue active state
   * - mobile: Underline-style tabs with bottom border indicator
   */
  variant?: "desktop" | "mobile";

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Routing-based navigation tabs component
 *
 * Features:
 * - Uses TanStack Router <Link> for page-to-page navigation
 * - Desktop variant: Button-style tabs
 * - Mobile variant: Underline-style tabs with active indicator
 * - No internal state (controlled by router)
 *
 * Usage:
 * ```tsx
 * <NavigationTabs
 *   tabs={ASSET_TABS}
 *   activeTab="character"
 *   variant="desktop"
 * />
 * ```
 */
export function NavigationTabs({
  tabs,
  activeTab,
  variant = "desktop",
  className,
}: NavigationTabsProps) {
  if (variant === "mobile") {
    return (
      <div className={cn("border-border flex border-b", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const linkClassName = cn(
            "text-text-secondary relative flex flex-1 items-center justify-center py-3 text-center text-sm font-medium transition-colors",
            isActive && "text-text-primary font-semibold",
          );

          return (
            <Link key={tab.value} to={tab.to} className={linkClassName}>
              {tab.label}
              {/* Active Tab Indicator */}
              {isActive && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  // Desktop variant
  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const linkClassName = cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          isActive
            ? "bg-blue-900 text-gray-50 shadow hover:bg-blue-900/80"
            : "bg-black-alternate text-text-secondary hover:bg-black-alternate/80",
        );

        return (
          <Link key={tab.value} to={tab.to} className={linkClassName}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
