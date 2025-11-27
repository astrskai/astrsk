import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Settings,
  UserRound,
  BookOpen,
  PanelLeft,
  Menu,
  X,
  LogOut,
  LogIn,
} from "lucide-react";
import { IconSessions, IconWorkflow, Logo } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { UpdaterNew } from "@/widgets/updater-new";
import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "@/convex";

// --- Navigation Data ---
const NAVIGATION_CATEGORIES = [
  {
    title: "Play",
    items: [
      {
        icon: IconSessions,
        label: "Sessions",
        path: "/sessions",
      },
    ],
  },
  {
    title: "Assets",
    items: [
      {
        icon: UserRound,
        label: "Characters",
        path: "/assets/characters",
      },
      {
        icon: BookOpen,
        label: "Scenarios",
        path: "/assets/scenarios",
      },
      {
        icon: IconWorkflow,
        label: "Workflows",
        path: "/assets/workflows",
      },
    ],
  },
];

// --- NavItem Component ---
const NavItem = ({
  icon: Icon,
  label,
  path,
  active = false,
  badge,
  isCollapsed = false,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
  active?: boolean;
  badge?: number;
  isCollapsed?: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-lg border text-sm font-medium transition-all duration-200",
        isCollapsed
          ? "w-full justify-center px-2 py-2"
          : "w-full justify-between px-3 py-2",
        active
          ? "border-zinc-700 bg-zinc-800 text-white shadow-sm"
          : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "gap-3",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            active
              ? "text-blue-400"
              : "text-zinc-400 group-hover:text-zinc-300",
          )}
        />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-all duration-300",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          {label}
        </span>
      </div>

      {badge &&
        (isCollapsed ? (
          <span className="absolute top-1.5 right-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-500"></span>
          </span>
        ) : (
          <span
            className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[10px]",
              active
                ? "bg-zinc-700 text-zinc-200"
                : "bg-zinc-800 text-zinc-500",
            )}
          >
            {badge}
          </span>
        ))}
    </Link>
  );
};

// --- CategorySection Component ---
const CategorySection = ({
  title,
  items,
  isCollapsed,
  isActivePath,
  onItemClick,
}: {
  title: string;
  items: Array<{
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    path: string;
  }>;
  isCollapsed: boolean;
  isActivePath: (path: string) => boolean;
  onItemClick?: () => void;
}) => {
  return (
    <div className="mb-6 space-y-1">
      <div
        className={cn(
          "mb-2 px-2 text-[10px] font-bold tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all duration-300",
          isCollapsed
            ? "h-0 overflow-hidden text-center opacity-0"
            : "opacity-100",
        )}
      >
        {title}
      </div>
      {items.map((item) => (
        <NavItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
          active={isActivePath(item.path)}
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
};

// --- SidebarHeader Component ---
const SidebarHeader = ({
  isCollapsed,
  toggleSidebar,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeMobileMenu: () => void;
}) => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate({ to: "/" });
    closeMobileMenu();
  };

  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-zinc-800 px-4 transition-all",
        isCollapsed ? "justify-center" : "justify-between",
      )}
    >
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 overflow-hidden",
          isCollapsed ? "hidden" : "flex",
        )}
        onClick={handleGoToHome}
      >
        <div className="flex flex-shrink-0 items-center justify-center rounded-lg text-white shadow-lg">
          <Logo className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold tracking-wide whitespace-nowrap text-zinc-100">
          ASTRSK
        </span>
      </div>

      {/* Desktop Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden text-zinc-400 transition-colors hover:text-white md:block"
      >
        <PanelLeft size={16} />
      </button>

      {/* Mobile Close Button */}
      <button
        onClick={closeMobileMenu}
        className="block text-zinc-400 hover:text-white md:hidden"
      >
        <X size={20} />
      </button>
    </div>
  );
};

// --- UserProfile Component ---
const UserProfile = ({
  isCollapsed,
  onSignOut,
  onSignIn,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  onSignOut: () => void;
  onSignIn: () => void;
  closeMobileMenu: () => void;
}) => {
  const { user } = useClerk();
  const subscription = useQuery(api.payment.public.getSubscription);

  const isLoggedIn = !!user;
  const userName = isLoggedIn
    ? user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"
    : "Guest";
  const planName = isLoggedIn ? subscription?.name || "Free Plan" : "Sign in";

  return (
    <div className="border-t border-zinc-800 p-4">
      <div
        className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center" : "",
        )}
      >
        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
          {user?.hasImage ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${user.imageUrl}')` }}
            />
          ) : (
            <div className="h-full w-full bg-[url(/img/placeholder/avatar.png)] bg-size-[60px] bg-center" />
          )}
        </div>
        <div
          className={cn(
            "flex-1 overflow-hidden transition-all duration-300",
            isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <h4 className="truncate text-sm font-medium text-zinc-200">
            {userName}
          </h4>
          <p className="truncate text-xs text-zinc-500">{planName}</p>
        </div>
        {isLoggedIn ? (
          <button
            onClick={() => {
              onSignOut();
              closeMobileMenu();
            }}
            className={cn(
              "text-zinc-500 transition-colors hover:text-zinc-300",
              isCollapsed ? "hidden" : "block",
            )}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <button
            onClick={() => {
              onSignIn();
              closeMobileMenu();
            }}
            className={cn(
              "text-zinc-500 transition-colors hover:text-zinc-300",
              isCollapsed ? "hidden" : "block",
            )}
            title="Sign in"
          >
            <LogIn size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Left Main Sidebar ---
export const LeftMainSidebar = ({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const isActivePath = (path: string) => location.pathname.startsWith(path);

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/settings", replace: true });
  };

  const handleSignIn = () => {
    navigate({ to: "/sign-in" });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-20" : "md:w-64",
          "w-64",
        )}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          closeMobileMenu={closeMobileMenu}
        />

        {/* Navigation Sections */}
        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-2 py-2">
          {NAVIGATION_CATEGORIES.map((category) => (
            <CategorySection
              key={category.title}
              title={category.title}
              items={category.items}
              isCollapsed={isCollapsed}
              isActivePath={isActivePath}
              onItemClick={closeMobileMenu}
            />
          ))}

          {/* Settings */}
          <div className="mt-auto">
            <NavItem
              icon={Settings}
              label="Settings"
              path="/settings"
              active={isActivePath("/settings")}
              isCollapsed={isCollapsed}
              onClick={closeMobileMenu}
            />
          </div>
        </div>

        <UserProfile
          isCollapsed={isCollapsed}
          onSignOut={handleSignOut}
          onSignIn={handleSignIn}
          closeMobileMenu={closeMobileMenu}
        />

        {/* Footer with UpdaterNew and Version */}
        <div className="flex flex-col gap-2 border-t border-zinc-800 px-4 py-2">
          <div className="flex justify-center">
            <UpdaterNew />
          </div>
          <div
            className={cn(
              "text-center text-[10px] text-zinc-400",
              isCollapsed ? "hidden" : "block",
            )}
          >
            v{__APP_VERSION__}
          </div>
        </div>
      </div>
    </>
  );
};

// --- Wrapper Component with State ---
interface LeftMainSidebarContainerProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function LeftMainSidebarContainer({
  isMobileOpen: externalMobileOpen,
  setIsMobileOpen: externalSetMobileOpen,
}: LeftMainSidebarContainerProps = {}) {
  const [internalIsCollapsed, setInternalIsCollapsed] =
    useState<boolean>(false);
  const [internalIsMobileOpen, setInternalIsMobileOpen] =
    useState<boolean>(false);

  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalMobileOpen ?? internalIsMobileOpen;
  const setIsMobileOpen = externalSetMobileOpen ?? setInternalIsMobileOpen;

  return (
    <LeftMainSidebar
      isCollapsed={internalIsCollapsed}
      toggleSidebar={() => setInternalIsCollapsed(!internalIsCollapsed)}
      isMobileOpen={isMobileOpen}
      closeMobileMenu={() => setIsMobileOpen(false)}
    />
  );
}

// --- Mobile Header Component (exported for use in MainLayout) ---
export function MobileHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user } = useClerk();

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-zinc-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Logo className="h-4 w-4" />
          <span className="font-bold text-zinc-100">ASTRSK</span>
        </div>
      </div>
      <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
        {user?.hasImage ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url('${user.imageUrl}')` }}
          />
        ) : (
          <div className="h-full w-full bg-[url(/img/placeholder/avatar.png)] bg-size-[60px] bg-center" />
        )}
      </div>
    </header>
  );
}
