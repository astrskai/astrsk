import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Settings, LogIn } from "lucide-react";
import { IconSessions, IconAssets } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { UpdaterNew } from "@/widgets/updater-new";

// Constants
const FIXED_NAV_WIDTH = 80; // px

interface NavItem {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
  submenu?: { id: string; label: string; path: string }[];
}

// Top navigation items (Sessions, Assets)
const TOP_NAV_ITEMS: NavItem[] = [
  {
    id: "sessions",
    icon: IconSessions,
    label: "Sessions",
    path: "/sessions",
  },
  {
    id: "assets",
    icon: IconAssets,
    label: "Assets",
    path: "/assets",
    submenu: [
      { id: "characters", label: "Characters", path: "/assets/characters" },
      { id: "scenarios", label: "Scenarios", path: "/assets/scenarios" },
      { id: "flows", label: "Workflows", path: "/assets/flows" },
    ],
  },
] as const;

// Bottom navigation items (Settings, Log in)
// TODO: Implement a login system
const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    path: "/settings",
  },
  // {
  //   id: "login",
  //   icon: LogIn,
  //   label: "Log in",
  //   path: "/login",
  // },
] as const;

/**
 * Fixed navigation sidebar - always visible on desktop
 * Layout:
 * - Top: Sessions, Assets (with divider between)
 * - Bottom: Settings, Log in, Version info
 * - Desktop/Tablet (≥768px): Always visible, fixed width (80px)
 * - Mobile (<768px): Hidden via Tailwind CSS
 *
 * Uses Tailwind's responsive classes for true viewport-based responsiveness.
 * This works correctly for PWA standalone mode, as viewport size is the same.
 */
export function FixedNav() {
  const location = useLocation();

  const [hoveredItem, setHoveredItem] = useState<string | undefined>();

  // Check if we should show submenu:
  // - NOT on assets list pages (/assets/characters, /assets/scenarios, /assets/flows) - they have tabs
  // - YES on assets detail pages (/assets/characters/123)
  // - YES on other pages (e.g., /sessions)
  const shouldShowSubmenu = (() => {
    const pathname = location.pathname;

    // Check if we're on an assets list page (exactly 2 segments like /assets/characters)
    if (pathname.startsWith("/assets/")) {
      const segments = pathname.split("/").filter(Boolean);
      // If exactly ["assets", "characters"], it's a list page - don't show submenu
      if (segments.length === 2) return false;
      // If more segments (e.g., ["assets", "characters", "123"]), it's a detail page - show submenu
      return true;
    }

    // For non-assets pages (like /sessions), show submenu
    return true;
  })();

  const renderNavItem = (item: NavItem) => {
    const { icon: Icon, label, path } = item;
    const isActive = location.pathname.startsWith(path);

    return (
      <Link
        to={path}
        className={cn(
          "flex flex-col items-center justify-center gap-1",
          "h-16 w-16 transition-all",
          "hover:text-text-primary",
          isActive
            ? [
                "bg-background-selected",
                "text-text-primary",
                "shadow-sm",
                "border-l-2",
                "border-blue-200",
                "rounded-r-lg",
              ]
            : "text-text-secondary rounded-lg",
        )}
        aria-label={label}
        title={label}
      >
        <Icon
          className="h-6 w-6"
          style={{
            strokeWidth: isActive ? 2 : 1.5,
          }}
        />
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  };

  const renderSubmenu = (item: NavItem) => {
    return (
      hoveredItem === item.id &&
      "submenu" in item &&
      item.submenu &&
      shouldShowSubmenu && (
        <div
          data-submenu
          className="absolute top-0 left-full z-50 min-w-[160px] rounded-lg border border-gray-700 bg-gray-900 py-2 shadow-lg"
          onMouseLeave={() => setHoveredItem(undefined)}
        >
          {item.submenu.map((subItem, index) => {
            const isSubItemActive = location.pathname.startsWith(subItem.path);

            return (
              <Link
                key={`${subItem.id}-${index}`}
                to={subItem.path}
                onClick={() => setHoveredItem(undefined)}
                className={cn(
                  "block px-4 py-2 text-sm transition-colors",
                  isSubItemActive
                    ? "bg-gray-800 font-medium text-gray-50"
                    : "text-gray-200 hover:bg-gray-800 hover:text-gray-50",
                )}
              >
                {subItem.label}
              </Link>
            );
          })}
        </div>
      )
    );
  };

  return (
    <aside
      className={cn(
        "hidden md:flex",
        "flex-col items-center py-4",
        "bg-black-alternate border-border border-r",
      )}
      style={{ width: FIXED_NAV_WIDTH }}
    >
      {/* Top section: Sessions, Assets */}
      <div className="flex flex-col items-center gap-2">
        {TOP_NAV_ITEMS.map((item, index) => (
          <div key={`${item.id}-${index}`}>
            <div
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={(e) => {
                // Check if we're moving to the submenu
                const relatedTarget = e.relatedTarget as HTMLElement;
                const submenu = e.currentTarget.querySelector("[data-submenu]");

                // Only clear hover if we're not moving to the submenu
                if (!submenu || !submenu.contains(relatedTarget)) {
                  setHoveredItem(undefined);
                }
              }}
            >
              {renderNavItem(item)}

              {/* Submenu - only show on hover when shouldShowSubmenu is true */}
              {renderSubmenu(item)}
            </div>

            {/* Divider after each item except last */}
            {index < TOP_NAV_ITEMS.length - 1 && (
              <div className="bg-border-light mx-auto my-2 h-px w-10" />
            )}
          </div>
        ))}
      </div>

      {/* Spacer to push bottom items down */}
      <div className="flex-1" />

      {/* Bottom section: UpdaterNew, Settings, Log in, Version */}
      <div className="flex flex-col items-center gap-2">
        {/* UpdaterNew - shows only when update is available/downloading */}
        <UpdaterNew />

        {BOTTOM_NAV_ITEMS.map((item, index) => (
          <div key={`${item.id}-${index}`}>{renderNavItem(item)}</div>
        ))}

        {/* Version info */}
        <div className="text-text-secondary mt-4 text-center text-[10px]">
          <div>v{__APP_VERSION__}</div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Hook to get fixed nav width for layout calculations
 * Returns fixed width - CSS handles responsive hiding via Tailwind
 *
 * Note: Components using this should also use Tailwind responsive classes
 * if they need to adjust based on nav visibility (e.g., md:ml-[80px])
 */
export function useFixedNavWidth(): number {
  return FIXED_NAV_WIDTH;
}
