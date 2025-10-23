"use client";

import { ChevronLeft, Settings } from "lucide-react";
import { delay } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { useSession } from "@/app/hooks/use-session";
import { useBackgroundStore } from "@/app/stores/background-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useBackGesture } from "@/components-v2/hooks/use-back-gesture";
import { cn } from "@/components-v2/lib/utils";
import { SessionMessagesAndUserInputsMobile } from "@/features/session/mobile/session-messages-and-user-inputs-mobile";
import { SessionSettingsMobile } from "@/features/session/mobile/session-settings-mobile";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Sheet, SheetContent } from "@/components-v2/ui/sheet";

interface ScrollToBottomOptions {
  wait?: number;
  behavior?: ScrollBehavior;
}

interface SessionMainMobileProps {
  sessionId?: string;
  onBack: () => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SessionMainMobile = ({
  sessionId,
  onBack,
  className,
  open = true,
  onOpenChange,
}: SessionMainMobileProps) => {
  const { selectedSessionId } = useSessionStore();
  const currentSessionId = sessionId
    ? new UniqueEntityID(sessionId)
    : selectedSessionId;
  const [session] = useSession(currentSessionId);
  const [isOpenSettings, setIsOpenSettings] = useState(false);
  const [mobileCardTab, setMobileCardTab] = useState<
    "character" | "user" | "plot"
  >("character");

  // Background
  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(
    session?.props.backgroundId?.toString() ?? "",
  );
  const [backgroundAsset] = useAsset(background?.assetId);
  const backgroundSrc =
    backgroundAsset ??
    (background && "src" in background ? background.src : "");

  // Scroll to bottom
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((options?: ScrollToBottomOptions) => {
    delay(() => {
      if (!scrollAreaViewportRef.current) {
        return;
      }
      scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: options?.behavior ?? "instant",
      });
    }, options?.wait ?? 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, currentSessionId]);

  // Add plot card - mobile implementation
  const onAddPlotCard = useCallback(() => {
    setIsOpenSettings(true);
    setMobileCardTab("plot");
  }, []);

  const handleBack = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      onBack();
    }
  }, [onBack, onOpenChange]);

  // Handle Android back gesture
  // useBackGesture({ enabled: open, onBack: handleBack });

  if (!session) {
    return null;
  }

  const content = (
    <div
      className={cn(
        "bg-background-screen relative flex max-h-dvh min-h-dvh flex-col overflow-hidden",
        className,
      )}
    >
      {/* Background */}
      {backgroundSrc && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={backgroundSrc}
            alt="background"
            className="h-full w-auto min-w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#000000] opacity-50" />
        </div>
      )}

      {/* Mobile top bar */}
      <TopNavigation
        title={session?.props.title || "Session"}
        transparent={true}
        transparencyLevel={50}
        className="z-20"
        leftAction={
          <Button
            variant="ghost_white"
            size="icon"
            onClick={handleBack}
            className="h-[40px] w-[40px] p-[8px]"
          >
            <ChevronLeft className="min-h-6 min-w-6" />
          </Button>
        }
        rightAction={
          <Button
            variant="ghost_white"
            size="icon"
            onClick={() => setIsOpenSettings(true)}
            className="h-[40px] w-[40px] p-[8px]"
          >
            <Settings className="min-h-6 min-w-6" />
          </Button>
        }
      />

      {/* Session main conten  t - adjusted for top bar */}
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
          <SessionMessagesAndUserInputsMobile
            scrollToBottom={scrollToBottom}
            onAddPlotCard={onAddPlotCard}
            isOpenSettings={isOpenSettings}
          />
          <ScrollBar orientation="vertical" className="w-1.5" />
        </ScrollArea>
      </div>

      {/* Session top gradient */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[100px]",
          "bg-gradient-to-b from-[#0E0E0EB2] to-[#0E0E0E00]",
        )}
      />

      {/* Mobile session settings sheet */}
      <Sheet open={isOpenSettings} onOpenChange={setIsOpenSettings}>
        <SheetContent
          side="right"
          className="bg-background-container w-[85vw] p-0"
          hideClose
        >
          <SessionSettingsMobile
            isOpen={isOpenSettings}
            onClose={() => setIsOpenSettings(false)}
            initialCardTab={mobileCardTab}
            onCardTabChange={setMobileCardTab}
          />
        </SheetContent>
      </Sheet>
    </div>
  );

  return onOpenChange ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0"
        hideClose
      >
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    content
  );
};

export { SessionMainMobile };
export type { ScrollToBottomOptions };
