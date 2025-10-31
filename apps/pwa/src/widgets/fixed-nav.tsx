import { Link, useLocation } from "@tanstack/react-router";
import { FolderOpen, Settings, LogIn } from "lucide-react";
import { IconSessions } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { UpdaterNew } from "@/widgets/updater-new";

// Constants
const FIXED_NAV_WIDTH = 80; // px

// Top navigation items (Sessions, Assets)
const TOP_NAV_ITEMS = [
  {
    id: "sessions",
    icon: IconSessions,
    label: "Sessions",
    path: "/sessions",
  },
  {
    id: "assets",
    icon: FolderOpen,
    label: "Assets",
    path: "/assets",
  },
] as const;

// Bottom navigation items (Settings, Log in)
// TODO: Implement a login system
const BOTTOM_NAV_ITEMS = [
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

  const renderNavItem = (
    item: (typeof TOP_NAV_ITEMS)[number] | (typeof BOTTOM_NAV_ITEMS)[number],
  ) => {
    const { id, icon: Icon, label, path } = item;
    const isActive = location.pathname.startsWith(path);

    return (
      <Link
        key={id}
        to={path}
        className={cn(
          "flex flex-col items-center justify-center gap-1",
          "h-16 w-16 transition-all",
          "hover:bg-background-hover",
          isActive
            ? [
                "bg-background-selected",
                "text-text-primary",
                "shadow-sm",
                "border-l-2",
                "border-primary-heavy",
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

  return (
    <aside
      className={cn(
        "hidden md:flex",
        "flex-col items-center py-4",
        "bg-background-surface-1 border-border border-r",
      )}
      style={{ width: FIXED_NAV_WIDTH }}
    >
      {/* Top section: Sessions, Assets */}
      <div className="flex flex-col items-center gap-2">
        {TOP_NAV_ITEMS.map((item, index) => (
          <div key={item.id}>
            {renderNavItem(item)}
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

        {BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item))}

        {/* Version info */}
        <div className="text-text-secondary mt-4 text-center text-[10px]">
          <div>v3.0.4</div>
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
