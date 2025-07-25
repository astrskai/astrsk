"use client";

import { Book, CircleHelp, Settings } from "lucide-react";
import { forwardRef, ReactNode, useMemo } from "react";

import { Menu, Page, useAppStore } from "@/app/stores/app-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { cn } from "@/components-v2/lib/utils";
import { MobileUpdater } from "@/components-v2/mobile-updater";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const NavButton = forwardRef<
  HTMLButtonElement,
  {
    name: string;
    icon: ReactNode;
    variant?: "ghost" | "ghost_white";
    active?: boolean;
    activeIcon?: ReactNode;
    badge?: number;
    onClick?: () => void;
    className?: string;
  }
>(
  (
    {
      name,
      icon,
      variant = "ghost",
      active,
      activeIcon,
      badge,
      onClick,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <Button
        {...props}
        ref={forwardedRef}
        variant={variant}
        className={cn(
          "relative w-[61px] h-[60px] px-[8px] py-[12px]",
          "flex flex-col items-center gap-0",
          variant === "ghost" &&
            "text-text-input-subtitle hover:text-text-primary",
          active && "text-text-primary",
          className,
        )}
        onClick={onClick}
      >
        {active && (
          <div className="absolute left-0 inset-y-0 w-[3px] bg-primary-heavy" />
        )}
        {active && activeIcon ? activeIcon : icon}
        {!!badge && (
          <div
            className={cn(
              "absolute top-[6px] right-[11px] rounded-full",
              "py-[2px] px-[5px] h-[15px] max-w-[16px] bg-status-destructive-light grid place-content-center",
            )}
          >
            <div className="font-[400] text-[9px] leading-[8px] text-[#FFFFFF]">
              {badge}
            </div>
          </div>
        )}
        <div className="font-[400] text-[10px]">{name}</div>
      </Button>
    );
  },
);
NavButton.displayName = "NavButton";

const MobileNavItem = forwardRef<
  HTMLButtonElement,
  {
    name: string;
    icon: ReactNode;
    active?: boolean;
    activeIcon?: ReactNode;
    badge?: number;
    onClick?: () => void;
    className?: string;
    variant?: "default" | "subdued";
  }
>(
  (
    {
      name,
      icon,
      active,
      activeIcon,
      badge,
      onClick,
      className,
      variant = "default",
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <button
        {...props}
        ref={forwardedRef}
        className={cn(
          "relative w-full h-9 px-4 py-0",
          "flex items-center gap-1.5 justify-start",
          "text-text-primary",
          active && "border-l-[3px] border-primary-heavy",
          className,
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-center w-6 h-6 text-current">
          {active && activeIcon ? activeIcon : icon}
        </div>
        <div className="text-base font-normal leading-relaxed">{name}</div>
        {!!badge && (
          <div
            className={cn(
              "ml-auto rounded-full",
              "py-[2px] px-[6px] h-[20px] min-w-[20px] bg-status-destructive-light grid place-content-center",
            )}
          >
            <div className="font-[500] text-[11px] leading-[14px] text-[#FFFFFF]">
              {badge}
            </div>
          </div>
        )}
      </button>
    );
  },
);
MobileNavItem.displayName = "MobileNavItem";

const LeftNavigationMobile = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { activeMenu, setActiveMenu } = useAppStore();

  // Validation badge
  const invalids = useValidationStore((state) => state.invalids);
  const sessionIds = useValidationStore((state) => state.sessionIds);
  const flowIds = useValidationStore((state) => state.flowIds);
  const sessionBadge = useMemo(() => {
    return Object.entries(sessionIds).filter(
      ([id]) => invalids.get("sessions")?.[id],
    ).length;
  }, [invalids, sessionIds]);
  const flowBadge = useMemo(() => {
    return Object.entries(flowIds).filter(([id]) => invalids.get("flows")?.[id])
      .length;
  }, [invalids, flowIds]);

  // Handle navigation item click - sets menu and closes sidebar
  const handleNavigationClick = (menu: Menu) => {
    setActiveMenu(menu);
    onNavigate?.();
  };

  return (
    <nav className="w-full h-full bg-background-surface-2 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-3.5 py-6 border-b border-border-dark">
        <button
          onClick={() => {
            setActiveMenu(Menu.Play);
            useAppStore.getState().setActivePage(Page.Init);
            onNavigate?.();
          }}
          className="hover:opacity-80 transition-opacity flex flex-row items-center gap-[10px]"
        >
          <SvgIcon name="astrsk_logo_full" width={85} height={20} />
          <div className="text-base font-normal leading-relaxed text-text-body">
            v{__APP_VERSION__}
          </div>
        </button>
      </div>

      {/* Main menu items */}
      <div className="flex flex-col py-6 border-b border-border-dark">
        <div className="flex flex-col gap-4">
          <MobileNavItem
            name="Sessions"
            icon={<SvgIcon name="sessions" />}
            active={activeMenu === Menu.Play}
            activeIcon={<SvgIcon name="sessions_solid" />}
            badge={sessionBadge}
            onClick={() => handleNavigationClick(Menu.Play)}
          />
          <MobileNavItem
            name="Cards"
            icon={<SvgIcon name="cards" />}
            active={activeMenu === Menu.Card}
            activeIcon={<SvgIcon name="cards_solid" />}
            onClick={() => handleNavigationClick(Menu.Card)}
          />
          <MobileNavItem
            name="Agents"
            icon={<SvgIcon name="agents" />}
            active={activeMenu === Menu.Flow}
            activeIcon={<SvgIcon name="agents_solid" />}
            badge={flowBadge}
            onClick={() => handleNavigationClick(Menu.Flow)}
          />
          <MobileNavItem
            name="Providers"
            icon={<SvgIcon name="providers" />}
            active={activeMenu === Menu.Model}
            activeIcon={<SvgIcon name="providers_solid" />}
            onClick={() => handleNavigationClick(Menu.Model)}
          />
        </div>
      </div>

      {/* Secondary menu items */}
      <div className="flex flex-col py-6">
        <div className="flex flex-col gap-4">
          <MobileNavItem
            name="Settings"
            icon={<Settings className="min-w-6 min-h-6" />}
            active={activeMenu === Menu.Settings}
            activeIcon={<SvgIcon name="settings_solid" />}
            onClick={() => handleNavigationClick(Menu.Settings)}
          />
          <MobileNavItem
            name="Documentation"
            icon={<Book className="min-w-6 min-h-6" />}
            onClick={() => openInNewTab("https://astrskai.github.io/astrsk-ai-docs/")}
          />
          <MobileUpdater />
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex-1 flex flex-col justify-end px-3 pt-3 pb-8">
        {/* TODO: subscription */}
      </div>
    </nav>
  );
};

export { LeftNavigationMobile, MobileNavItem, NavButton };
