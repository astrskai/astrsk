// TODO: apply color palette

import { Page, useAppStore } from "@/app/stores/app-store";
import { SidebarLeft, useSidebarLeft } from "@/components-v2/both-sidebar";
import { CardSection } from "@/components-v2/left-navigation/card-list";
import { SECTION_HEADER_HEIGHT } from "@/components-v2/left-navigation/constants";
import { FlowSection } from "@/components-v2/left-navigation/flow-list";
import { SessionSection } from "@/components-v2/left-navigation/session-list";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { UpdaterNew } from "@/components-v2/updater-new";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Book,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SectionHeader = ({
  name,
  icon,
  top,
  bottom,
  expanded = true,
  onToggle = () => {},
  onClick = () => {},
}: {
  name: string;
  icon: React.ReactNode;
  top?: number;
  bottom?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn(
        "z-20 sticky p-[16px] pt-[32px] bg-background-surface-2 text-text-primary",
        "flex flex-row justify-between select-none",
      )}
      style={{
        top,
        bottom,
      }}
      onClick={onClick}
    >
      <div className="flex flex-row gap-[8px]">
        {icon}
        <div className="font-[600] text-[14px] leading-[20px]">{name}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
  );
};

const LeftNavigation = () => {
  const { setOpen } = useSidebarLeft();
  const activePage = useAppStore.use.activePage();
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
    const headerHeightOffset =
      SECTION_HEADER_HEIGHT * ["session", "card", "flow"].indexOf(to);
    navigationRef.current.scrollTo({
      top: sectionOffset - containerOffset - headerHeightOffset,
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

  return (
    <SidebarLeft className="pt-[38px] border-r-text-contrast-text z-20">
      <div className="h-full max-h-full flex flex-col bg-background-surface-2">
        {/* Header */}
        <LeftNavigationHeader
          setActivePage={setActivePage}
          setClickCount={setClickCount}
          setOpen={setOpen}
        />

        {/* Navigation */}
        <ScrollArea viewportRef={navigationRef} className="flex-1 min-h-0">
          <div id="nav-session" />
          <SessionSection onClick={() => scrollNavigation("session")} />
          <div id="nav-card" />
          <CardSection onClick={() => scrollNavigation("card")} />
          <div id="nav-flow" />
          <FlowSection onClick={() => scrollNavigation("flow")} />
          <ScrollBar className="z-30" />
        </ScrollArea>

        {/* Footer */}
        <LeftNavigationFooter
          activePage={activePage}
          setActivePage={setActivePage}
        />
      </div>
    </SidebarLeft>
  );
};

const LeftNavigationTrigger = () => {
  const { open, setOpen } = useSidebarLeft();

  return (
    <button
      className={cn(
        "z-40 absolute top-[calc(38px+16px)] left-[16px] grid place-items-center",
        "size-[40px] bg-[#313131] border-1 border-[#757575] rounded-full",
        open && "hidden",
      )}
      onClick={() => setOpen(true)}
    >
      <ArrowRightFromLine size={20} />
      <span className="sr-only">Show Sidebar</span>
    </button>
  );
};

// Memoized sub-components to prevent unnecessary re-renders
const LeftNavigationHeader = memo(
  ({
    setActivePage,
    setClickCount,
    setOpen,
  }: {
    setActivePage: (page: Page) => void;
    setClickCount: React.Dispatch<React.SetStateAction<number>>;
    setOpen: (open: boolean) => void;
  }) => {
    const handleLogoClick = useCallback(() => {
      setActivePage(Page.Init);
      setClickCount((prev) => prev + 1);
    }, [setActivePage, setClickCount]);

    const handleCollapseClick = useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    return (
      <div
        className={cn(
          "shrink-0 p-4 border-b-[1px] border-text-contrast-text",
          "flex flex-row justify-between items-center",
          "bg-background-surface-2 text-text-primary",
        )}
      >
        <button
          onClick={handleLogoClick}
          className="hover:opacity-80 transition-opacity flex flex-row items-center gap-2"
        >
          <SvgIcon name="astrsk_logo_full" width={68} height={16} />
          <div className="font-[400] text-[12px] leading-[15px] text-text-body">
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
    <div className="shrink-0 bg-background-surface-2">
      <button
        onClick={handleClick}
        className={cn(
          "w-full h-12 py-2 bg-background-surface-2 inline-flex justify-start items-center gap-2",
        )}
      >
        <Book size={20} />
        <div className="justify-start text-text-primary text-sm font-semibold font-['Inter'] leading-tight">
          Documentation
        </div>
      </button>
    </div>
  );
});
DocumentationButton.displayName = "DocumentationButton";

const LeftNavigationFooter = memo(
  ({
    activePage,
    setActivePage,
  }: {
    activePage: Page;
    setActivePage: (page: Page) => void;
  }) => {
    const handleDocsClick = useCallback(() => {
      openInNewTab("https://docs.astrsk.ai/");
    }, []);

    const handleSettingsClick = useCallback(() => {
      setActivePage(Page.Settings);
    }, [setActivePage]);

    return (
      <div
        className={cn(
          "shrink-0 p-4 pt-2",
          "flex flex-row justify-between items-center",
          "bg-background-surface-2 text-text-primary",
        )}
      >
        <div className="min-h-[28px]">
          <Unauthenticated>
            <Button
              size="sm"
              className="bg-secondary-normal text-secondary-heavy font-[600]"
              onClick={() => {
                setActivePage(Page.Subscribe);
              }}
            >
              <SvgIcon name="astrsk_symbol_fit" size={12} />
              Subscribe to astrsk+
            </Button>
          </Unauthenticated>
          <Authenticated>
            <Button size="sm" className="font-[600]">
              <SvgIcon name="astrsk_symbol_fit" size={12} />
              Add credits
            </Button>
          </Authenticated>
        </div>
        <div className="w-full flex flex-row justify-end gap-[16px] text-text-primary">
          <div className="flex flex-row gap-[16px]">
            <UpdaterNew />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleDocsClick}>
                  <Book size={20} />
                  <span className="sr-only">Docs</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="button">
                <p>Docs</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleSettingsClick}>
                  {activePage === Page.Settings ? (
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
