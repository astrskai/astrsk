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
import { SessionMessagesAndUserInputsMobile } from "@/components-v2/session/mobile/session-messages-and-user-inputs-mobile";
import { SessionSettingsMobile } from "@/components-v2/session/mobile/session-settings-mobile";
import { TopNavigation } from "@/components-v2/top-navigation";
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
        "relative min-h-dvh max-h-dvh overflow-hidden bg-background-screen flex flex-col",
        className,
      )}
    >
      {/* Background */}
      {backgroundSrc && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
      <div className="flex-1 overflow-hidden relative">
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
          "absolute top-0 inset-x-0 h-[100px] pointer-events-none",
          "bg-gradient-to-b from-[#0E0E0EB2] to-[#0E0E0E00]",
        )}
      />

      {/* Mobile session settings sheet */}
      <Sheet open={isOpenSettings} onOpenChange={setIsOpenSettings}>
        <SheetContent
          side="right"
          className="w-[85vw] p-0 bg-background-container"
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
        className="w-full p-0 h-full flex flex-col"
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
