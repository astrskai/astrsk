// TODO: apply color palette

import { Page, useAppStore } from "@/app/stores/app-store";
import { SidebarLeft, useSidebarLeft } from "@/components-v2/both-sidebar";
import { ConvexReady } from "@/components-v2/convex-ready";
import { HelpVideoDialog } from "@/components-v2/help-video-dialog";
import { CardSection } from "@/components-v2/left-navigation/card-list";
import { FlowSection } from "@/components-v2/left-navigation/flow-list";
import { SessionSection } from "@/components-v2/left-navigation/session-list";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { UpdaterNew } from "@/components-v2/updater-new";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Book,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Settings,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SectionHeader = ({
  name,
  icon,
  top = 0,
  bottom,
  expanded = true,
  onToggle = () => {},
  onClick = () => {},
  onHelpClick,
  onboardingHelpGlow = false,
}: {
  name: string;
  icon: React.ReactNode;
  top?: number;
  bottom?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  onHelpClick?: () => void;
  onboardingHelpGlow?: boolean;
}) => {
  return (
    <div
      className={cn(
        "bg-background-surface-2 text-text-primary sticky z-20 p-[16px] pt-[32px]",
        "flex cursor-pointer flex-row justify-between select-none",
      )}
      style={{
        top,
        bottom,
      }}
      onClick={onClick}
    >
      <div className="flex flex-row gap-[8px]">
        {icon}
        <div className="text-[14px] leading-[20px] font-[600]">{name}</div>
        {onHelpClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHelpClick();
            }}
            className={cn(
              "text-text-info hover:text-text-primary transition-colors",
              onboardingHelpGlow &&
                "text-button-background-primary border-border-selected-primary rounded-full border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
            )}
          >
            <PlayCircle size={16} />
          </button>
        )}
      </div>
      <div className="flex flex-row items-center gap-[8px]">
        <button
          className="hover:bg-background-surface-4 cursor-pointer rounded-sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
    </div>
  );
};

const LeftNavigation = () => {
  const { setOpen, open } = useSidebarLeft();
  const setActivePage = useAppStore.use.setActivePage();

  // Scroll navigation
  const navigationRef = useRef<HTMLDivElement>(null);
  const scrollNavigation = useCallback((to: "session" | "card" | "flow") => {
    if (!navigationRef.current) {
      return;
    }
    const containerOffset = navigationRef.current.offsetTop;
    const section = document.getElementById(`nav-${to}`);
    const sectionOffset = section?.offsetTop ?? 0;

    navigationRef.current.scrollTo({
      top: sectionOffset - containerOffset,
      behavior: "smooth",
    });
  }, []);

  // Open dev tools
  const [clickCount, setClickCount] = useState(0);
  useEffect(() => {
    if (clickCount < 5) {
      return;
    }
    window.api?.debug?.openDevTools();
  }, [clickCount]);

  // Help video dialog state
  const [helpVideoDialog, setHelpVideoDialog] = useState<{
    open: boolean;
    type: "sessions" | "cards" | "flows" | null;
  }>({ open: false, type: null });

  const openHelpVideo = useCallback((type: "sessions" | "cards" | "flows") => {
    setHelpVideoDialog({ open: true, type });
  }, []);

  const closeHelpVideo = useCallback(() => {
    setHelpVideoDialog({ open: false, type: null });
  }, []);

  // Session onboarding - show resource management tooltip and section highlights
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();

  // Exception: When sidebar is open, prioritize resourceManagement and helpVideo steps
  let shouldShowResourceManagementTooltip = false;
  let shouldShowHelpVideoTooltip = false;

  // If sidebar is open, check these steps first as an exception
  if (open) {
    // Priority 1: Show resource management if not completed
    if (!sessionOnboardingSteps.resourceManagement) {
      shouldShowResourceManagementTooltip = true;
    }
    // Priority 2: Show help video if resource management is done but help video isn't
    else if (
      sessionOnboardingSteps.resourceManagement &&
      !sessionOnboardingSteps.helpVideo
    ) {
      shouldShowHelpVideoTooltip = true;
    }
  }

  return (
    <div className="relative">
      <SidebarLeft className="border-r-text-contrast-text z-20">
        <div className="bg-background-surface-2 flex h-full max-h-full flex-col">
          {/* Header */}
          <LeftNavigationHeader
            setActivePage={setActivePage}
            setClickCount={setClickCount}
            setOpen={setOpen}
          />

          {/* Navigation */}
          <ScrollArea viewportRef={navigationRef} className="min-h-0 flex-1">
            <div id="nav-session" />
            <SessionSection
              onClick={() => scrollNavigation("session")}
              onboardingHighlight={shouldShowResourceManagementTooltip}
              onHelpClick={() => openHelpVideo("sessions")}
              onboardingHelpGlow={shouldShowHelpVideoTooltip}
            />
            <div id="nav-card" />
            <CardSection
              onClick={() => scrollNavigation("card")}
              onboardingHighlight={shouldShowResourceManagementTooltip}
              onboardingCollapsed={shouldShowResourceManagementTooltip}
              onHelpClick={() => openHelpVideo("cards")}
              onboardingHelpGlow={shouldShowHelpVideoTooltip}
            />
            <div id="nav-flow" />
            <FlowSection
              onClick={() => scrollNavigation("flow")}
              onboardingHighlight={shouldShowResourceManagementTooltip}
              onboardingCollapsed={shouldShowResourceManagementTooltip}
              onHelpClick={() => openHelpVideo("flows")}
              onboardingHelpGlow={shouldShowHelpVideoTooltip}
            />
            <ScrollBar className="z-30" />
          </ScrollArea>

          {/* Footer */}
          <LeftNavigationFooter setActivePage={setActivePage} />
        </div>
      </SidebarLeft>

      {/* Resource Management Onboarding Tooltip */}
      {shouldShowResourceManagementTooltip && (
        <div className="absolute top-[40px] left-[340px] z-50">
          <div className="bg-background-surface-2 border-border-selected-primary inline-flex w-80 max-w-80 flex-col items-end justify-center gap-2 rounded-2xl border-1 px-4 py-3 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]">
            <div className="text-text-primary justify-start self-stretch text-sm leading-tight font-semibold">
              Global resource management
            </div>
            <div className="text-text-primary justify-start self-stretch text-xs font-normal">
              This area manages global resources shared across all sessions. You
              can use Cards and Flows here are available in all your sessions
            </div>
            <div className="inline-flex items-start justify-start gap-2">
              <button
                className="bg-background-surface-light inline-flex min-w-20 flex-col items-center justify-center gap-2 rounded-[20px] px-3 py-1.5"
                onClick={() => {
                  // Mark resourceManagement step as completed
                  setSessionOnboardingStep("resourceManagement", true);
                }}
              >
                <div className="inline-flex items-center justify-start gap-2">
                  <div className="text-text-contrast-text justify-center text-xs font-semibold">
                    Got it
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Video Tooltip - 4th step, next to Sessions HelpCircle */}
      {shouldShowHelpVideoTooltip && (
        <div className="absolute top-[40px] left-[140px] z-50">
          <div className="bg-background-surface-2 border-border-selected-primary inline-flex w-60 max-w-60 flex-col items-end justify-center gap-2 rounded-2xl border-1 px-4 py-3 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]">
            <div className="text-text-primary justify-start self-stretch text-sm leading-tight font-semibold">
              Not sure how it works?
            </div>
            <div className="text-text-primary justify-start self-stretch text-xs font-medium">
              Click here for a 30-second guide.
            </div>
            <div className="inline-flex items-start justify-start gap-2">
              <button
                className="bg-background-surface-light inline-flex min-w-20 flex-col items-center justify-center gap-2 rounded-[20px] px-3 py-1.5"
                onClick={() => {
                  // Mark helpVideo step as completed
                  setSessionOnboardingStep("helpVideo", true);
                }}
              >
                <div className="inline-flex items-center justify-start gap-2">
                  <div className="text-text-contrast-text justify-center text-xs font-semibold">
                    Got it
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Video Dialog */}
      {helpVideoDialog.type && (
        <HelpVideoDialog
          open={helpVideoDialog.open}
          onOpenChange={closeHelpVideo}
          type={helpVideoDialog.type}
        />
      )}
    </div>
  );
};

const LeftNavigationTrigger = () => {
  const { open, setOpen } = useSidebarLeft();

  // Session onboarding - show tooltip for third step
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();
  // Show sidebar trigger tooltip only when sidebar is closed and step 2 is done but step 3 (openResource) is not
  const shouldShowSidebarTooltip =
    !open &&
    sessionOnboardingSteps.sessionEdit &&
    !sessionOnboardingSteps.openResource;

  return (
    <div className="group/trigger-parent">
      {/* Onboarding Tooltip */}
      {shouldShowSidebarTooltip && (
        <div
          className={cn(
            "bg-background-surface-2 border-border-selected-primary absolute top-[calc(var(--topbar-height)+76px)] left-[16px] z-50 rounded-2xl border-1 px-4 py-3 whitespace-nowrap shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
            "transition-all duration-300 ease-out",
            "group-hover/trigger-parent:opacity-0",
          )}
        >
          <div className="text-text-primary text-xs font-medium">
            Click here to open the sidebar
          </div>
        </div>
      )}

      <button
        className={cn(
          "absolute top-[calc(var(--topbar-height)+16px)] left-[16px] z-40 grid place-items-center",
          "size-[40px] rounded-full border-1 border-[#757575] bg-[#313131]",
          open && "hidden",
          shouldShowSidebarTooltip &&
            "border-border-selected-primary border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)] hover:shadow-[0px_0px_20px_-1px_rgba(152,215,249,1.00)]",
        )}
        onClick={() => {
          setOpen(true);
          // Complete openResource step if showing tooltip
          if (shouldShowSidebarTooltip) {
            setSessionOnboardingStep("openResource", true);
          }
        }}
      >
        <ArrowRightFromLine size={20} />
        <span className="sr-only">Show Sidebar</span>
      </button>
    </div>
  );
};

// Memoized sub-components to prevent unnecessary re-renders
const LeftNavigationHeader = memo(
  ({
    setClickCount,
    setOpen,
  }: {
    setActivePage: (page: Page) => void;
    setClickCount: React.Dispatch<React.SetStateAction<number>>;
    setOpen: (open: boolean) => void;
  }) => {
    const navigate = useNavigate();

    const handleLogoClick = useCallback(() => {
      navigate({ to: "/" });
      setClickCount((prev) => prev + 1);
    }, [navigate, setClickCount]);

    const handleCollapseClick = useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    return (
      <div
        className={cn(
          "border-text-contrast-text shrink-0 border-b-[1px] p-4",
          "flex flex-row items-center justify-between",
          "bg-background-surface-2 text-text-primary",
        )}
      >
        <button
          onClick={handleLogoClick}
          className="flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80"
        >
          <SvgIcon name="astrsk_logo_full" width={68} height={16} />
          <div className="text-text-body text-[12px] leading-[15px] font-[400]">
            v{__APP_VERSION__}
          </div>
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleCollapseClick}>
              <ArrowLeftFromLine size={20} />
              <span className="sr-only">Hide Sidebar</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" variant="button">
            <p>Collapse</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  },
);
LeftNavigationHeader.displayName = "LeftNavigationHeader";

const DocumentationButton = memo(() => {
  const handleClick = useCallback(() => {
    openInNewTab("https://docs.astrsk.ai/");
  }, []);

  return (
    <div className="bg-background-surface-2 shrink-0">
      <button
        onClick={handleClick}
        className={cn(
          "bg-background-surface-2 inline-flex h-12 w-full items-center justify-start gap-2 py-2",
        )}
      >
        <Book size={20} />
        <div className="text-text-primary justify-start font-['Inter'] text-sm leading-tight font-semibold">
          Documentation
        </div>
      </button>
    </div>
  );
});
DocumentationButton.displayName = "DocumentationButton";

const LeftNavigationFooter = memo(
  ({ setActivePage }: { setActivePage: (page: Page) => void }) => {
    const subscribed = useAppStore.use.subscribed();
    const location = useLocation();

    const handleSubscribeClick = useCallback(() => {
      setActivePage(Page.Subscribe);
    }, [setActivePage]);

    const handleDocsClick = useCallback(() => {
      openInNewTab("https://docs.astrsk.ai/");
    }, []);

    const navigate = useNavigate();

    const handleSettingsClick = useCallback(() => {
      navigate({ to: "/settings" });
    }, [navigate]);

    return (
      <div
        className={cn(
          "shrink-0 p-4 pt-2",
          "flex flex-row items-center justify-between",
          "bg-background-surface-2 text-text-primary",
        )}
      >
        <div className="min-h-[28px]">
          {/** disabled subscribe */}
          {/* <ConvexReady>
            <Authenticated>
              {subscribed ? (
                <>
                  <Button size="sm" className="font-[600]">
                    <SvgIcon name="astrsk_symbol_fit" size={12} />
                    Add credits
                  </Button>
                </>
              ) : (
                <>
                  <Button
                  size="sm"
                  className="bg-secondary-normal text-secondary-heavy font-[600]"
                  onClick={handleSubscribeClick}
                >
                  <SvgIcon name="astrsk_symbol_fit" size={12} />
                  Subscribe to astrsk+
                </Button>
                </>
              )}
            </Authenticated>
            <Unauthenticated>
              <Button
                size="sm"
                className="bg-secondary-normal text-secondary-heavy font-[600]"
                onClick={handleSubscribeClick}
              >
                <SvgIcon name="astrsk_symbol_fit" size={12} />
                Subscribe to astrsk+
              </Button>
            </Unauthenticated>
          </ConvexReady> */}
        </div>
        <div className="text-text-primary flex w-full flex-row justify-between gap-[16px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex cursor-pointer flex-row items-center gap-2"
                onClick={handleDocsClick}
              >
                <Book size={20} />
                <span className="text-text-primary text-[14px] font-semibold">
                  Documentation
                </span>
                <span className="sr-only">Docs</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" variant="button">
              <p>Docs</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex flex-row items-center gap-[16px]">
            <UpdaterNew />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="cursor-pointer"
                  onClick={handleSettingsClick}
                >
                  {location.pathname.startsWith("/settings") ? (
                    <SvgIcon name="settings_solid" size={20} />
                  ) : (
                    <Settings size={20} />
                  )}
                  <span className="sr-only">Settings</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="button">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  },
);
LeftNavigationFooter.displayName = "LeftNavigationFooter";

export { LeftNavigation, LeftNavigationTrigger, SectionHeader };
