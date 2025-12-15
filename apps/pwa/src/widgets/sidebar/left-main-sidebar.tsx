import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Settings,
  UserRound,
  PanelLeft,
  Menu,
  X,
  LogOut,
  LogIn,
  Trash2,
} from "lucide-react";
import { IconSessions, AstrskLogo } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { UpdaterNew } from "@/widgets/updater-new";
import { useAuth } from "@/shared/hooks/use-auth";
import { useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "@/convex";
import { sessionQueries, useDeleteSession } from "@/entities/session/api";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

// --- Navigation Data ---
const NAVIGATION_CATEGORIES = [
  {
    title: "Play library", // No section title
    items: [
      {
        icon: IconSessions,
        label: "Sessions",
        path: "/sessions",
      },
      {
        icon: UserRound,
        label: "Characters",
        path: "/assets/characters",
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

// --- Play Session NavItem Component (with count/date badge and delete button) ---
const PlaySessionNavItem = ({
  label,
  path,
  active = false,
  isCollapsed = false,
  onClick,
  count,
  updatedAt,
  onDelete,
}: {
  label: string;
  path: string;
  active?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  count?: number;
  updatedAt?: Date;
  onDelete?: () => void;
}) => {
  // Don't render anything when collapsed (no icon to show)
  if (isCollapsed) {
    return null;
  }

  // Format date as relative time or short date
  const formatDate = (date: Date | string) => {
    const now = new Date();
    // Handle both Date objects and ISO strings (from TanStack Query cache serialization)
    const dateObj = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-lg border text-sm font-medium transition-all duration-200",
        "w-full justify-between px-3 py-2",
        active
          ? "border-zinc-700 bg-zinc-800 text-white shadow-sm"
          : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300",
      )}
    >
      {/* Title only, no icon */}
      <span className="min-w-0 flex-1 truncate">{label}</span>

      {/* Right side: Delete button + Badge */}
      <div className="flex items-center gap-1">
        {/* Delete button: always visible on mobile, hover on desktop */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-red-400",
              // Always visible on mobile (max-md), hidden on desktop until hover
              "md:opacity-0 md:group-hover:opacity-100",
            )}
            aria-label="Delete session"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Badge: shows count by default, date on hover */}
        {(count !== undefined || updatedAt) && (
          <span
            className={cn(
              "flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded px-1 text-[10px]",
              active
                ? "bg-zinc-700 text-zinc-200"
                : "bg-zinc-800 text-zinc-500",
            )}
          >
            {/* Count shown by default, date on hover */}
            <span className="group-hover:hidden">{count ?? 0}</span>
            <span className="hidden group-hover:inline">
              {updatedAt ? formatDate(updatedAt) : (count ?? 0)}
            </span>
          </span>
        )}
      </div>
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
      {title && (
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
      )}
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

// --- Play Sessions Section Component (Dynamic) ---
const PlaySessionsSection = ({
  isCollapsed,
  isActivePath,
  onItemClick,
}: {
  isCollapsed: boolean;
  isActivePath: (path: string) => boolean;
  onItemClick?: () => void;
}) => {
  const navigate = useNavigate();
  const deleteSessionMutation = useDeleteSession();

  // Query play sessions using lightweight listItem query (only id, title, messageCount, updatedAt)
  const { data: playSessions = [] } = useTanstackQuery(
    sessionQueries.listItem({ isPlaySession: true }),
  );

  const handleDelete = (sessionId: string) => {
    // If currently viewing this session, navigate away first
    if (isActivePath(`/sessions/${sessionId}`)) {
      navigate({ to: "/sessions" });
    }
    deleteSessionMutation.mutate({ sessionId: new UniqueEntityID(sessionId) });
  };

  // Don't show section when collapsed or if there are no play sessions
  if (isCollapsed || playSessions.length === 0) {
    return null;
  }

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
        Recents
      </div>
      {playSessions.map((session) => (
        <PlaySessionNavItem
          key={session.id}
          label={session.name || "Untitled"}
          path={`/sessions/${session.id}`}
          active={isActivePath(`/sessions/${session.id}`)}
          isCollapsed={isCollapsed}
          onClick={onItemClick}
          count={session.messageCount}
          updatedAt={session.updatedAt}
          onDelete={() => handleDelete(session.id)}
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
          "flex cursor-pointer items-center overflow-hidden",
          isCollapsed ? "hidden" : "flex",
        )}
        onClick={handleGoToHome}
      >
        <AstrskLogo className="h-5" />
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const subscription = useQuery(api.payment.public.getSubscription);

  const isLoggedIn = isAuthenticated;
  const userName = isLoggedIn
    ? user?.email?.split("@")[0] || user?.user_metadata?.full_name || "User"
    : "Guest";
  const planName = isLoggedIn ? subscription?.name || "Free Plan" : "Sign in";

  const handleAvatarClick = () => {
    if (isLoggedIn) {
      navigate({ to: "/settings/account" });
      closeMobileMenu();
    } else {
      onSignIn();
      closeMobileMenu();
    }
  };

  return (
    <div className="border-t border-zinc-800 p-4">
      <div
        className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center" : "",
        )}
      >
        <div
          className="h-9 w-9 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 hover:border-zinc-500"
          onClick={handleAvatarClick}
        >
          {user?.user_metadata?.avatar_url ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url('${user.user_metadata.avatar_url}')`,
              }}
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
  isCollapsed: isCollapsedProp,
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
  const { signOut } = useAuth();

  // Mobile always shows expanded sidebar, collapse only applies to desktop
  const isCollapsed = isMobileOpen ? false : isCollapsedProp;

  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  // Check if path is active
  // Special case: /sessions should only match exactly, not /sessions/{id}
  const isActivePath = (path: string) => {
    if (path === "/sessions") {
      return (
        location.pathname === "/sessions" || location.pathname === "/sessions/"
      );
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
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
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r transition-all duration-300 ease-in-out md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-20" : "md:w-64",
          "w-64",
          // Home page blended background when collapsed on desktop
          isHomePage
            ? "md:border-zinc-800/30 md:bg-zinc-950/50 md:backdrop-blur-xl"
            : "border-zinc-800 bg-zinc-950",
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

          {/* Play Sessions - Dynamic list of play sessions */}
          <PlaySessionsSection
            isCollapsed={isCollapsed}
            isActivePath={isActivePath}
            onItemClick={closeMobileMenu}
          />

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

        {/* Footer with UpdaterNew and Version - hidden when collapsed on desktop */}
        <div
          className={cn(
            "flex flex-col gap-2 border-t border-zinc-800 px-4 py-2",
            isCollapsed ? "md:hidden" : "block",
          )}
        >
          <div className="flex justify-center">
            <UpdaterNew />
          </div>
          <div className="text-center text-[10px] text-zinc-400">
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
  const [internalIsCollapsed, setInternalIsCollapsed] = useState<boolean>(true);
  const [internalIsMobileOpen, setInternalIsMobileOpen] =
    useState<boolean>(false);

  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalMobileOpen ?? internalIsMobileOpen;
  const setIsMobileOpen = externalSetMobileOpen ?? setInternalIsMobileOpen;

  // Close mobile menu when viewport changes to desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsMobileOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setIsMobileOpen]);

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
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = isAuthenticated;

  const handleAvatarClick = () => {
    if (isLoggedIn) {
      navigate({ to: "/settings/account" });
    } else {
      navigate({ to: "/sign-in" });
    }
  };

  return (
    <header className="flex flex-shrink-0 items-center border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
      {/* Left: Menu Button */}
      <button onClick={onMenuClick} className="text-zinc-400 hover:text-white">
        <Menu size={20} />
      </button>

      {/* Center: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <AstrskLogo
          className="h-4 cursor-pointer"
          onClick={() => navigate({ to: "/" })}
        />
      </div>

      {/* Right: Avatar */}
      <div
        className="ml-auto h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 hover:border-zinc-500"
        onClick={handleAvatarClick}
      >
        {user?.user_metadata?.avatar_url ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${user.user_metadata.avatar_url}')`,
            }}
          />
        ) : (
          <div className="h-full w-full bg-[url(/img/placeholder/avatar.png)] bg-size-[60px] bg-center" />
        )}
      </div>
    </header>
  );
}
