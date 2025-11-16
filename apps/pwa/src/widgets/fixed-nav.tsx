import { Link, useLocation } from "@tanstack/react-router";
import { Settings, LogIn, UserRound, BookOpen } from "lucide-react";
import { IconSessions, IconWorkflow } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { UpdaterNew } from "@/widgets/updater-new";

// Constants
const FIXED_NAV_WIDTH = 70; // px

interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  submenu?: SubmenuItem[];
}

interface SubmenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// Top navigation items (Sessions, Assets)
const TOP_NAV_ITEMS: NavItem[] = [
  {
    id: "sessions",
    label: "Sessions",
    path: "/sessions",
    submenu: [
      {
        id: "play",
        label: "Play",
        path: "/sessions",
        icon: IconSessions,
      },
    ],
  },
  {
    id: "assets",
    label: "Assets",
    path: "/assets",
    submenu: [
      {
        id: "characters",
        label: "Characters",
        path: "/assets/characters",
        icon: UserRound,
      },
      {
        id: "scenarios",
        label: "Scenarios",
        path: "/assets/scenarios",
        icon: BookOpen,
      },
      {
        id: "workflows",
        label: "Workflows",
        path: "/assets/workflows",
        icon: IconWorkflow,
      },
    ],
  },
] as const;

// Bottom navigation items (Settings, Log in)
// TODO: Implement a login system
const BOTTOM_NAV_ITEMS: SubmenuItem[] = [
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

  const renderNavItem = (item: SubmenuItem) => {
    const { icon: Icon, label, path } = item;
    const isActive = location.pathname.startsWith(path);

    return (
      <Link
        to={path}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1",
          "h-16 transition-all",
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

  return (
    <aside
      className={cn(
        "z-30 hidden md:flex",
        "h-full flex-col items-center py-4",
        "bg-black-alternate border-border border-r",
      )}
      style={{ width: FIXED_NAV_WIDTH }}
    >
      {/* Top section: Sessions, Assets */}
      <div className="flex w-full flex-col items-center gap-4">
        {TOP_NAV_ITEMS.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex w-full flex-col items-center gap-2"
          >
            <div className="text-xs font-semibold text-gray-500">
              {item.label}
            </div>
            {item.submenu?.map((subItem, subIndex) => (
              <div key={`${subItem.id}-${subIndex}`} className="w-full">
                {renderNavItem(subItem)}
              </div>
            ))}
            {/* Divider after each item except last */}
            {index < TOP_NAV_ITEMS.length - 1 && (
              <div className="bg-border-light mx-auto h-px w-10" />
            )}
          </div>
        ))}
      </div>

      {/* Spacer to push bottom items down */}
      <div className="flex-1" />

      {/* Bottom section: UpdaterNew, Settings, Log in, Version */}
      <div className="flex w-full flex-col items-center gap-2">
        {/* UpdaterNew - shows only when update is available/downloading */}
        <UpdaterNew />

        {BOTTOM_NAV_ITEMS.map((item, index) => (
          <div key={`${item.id}-${index}`} className="w-full">
            {renderNavItem(item)}
          </div>
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
