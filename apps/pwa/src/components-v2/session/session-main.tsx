import { delay } from "lodash-es";
import { useCallback, useEffect, useRef } from "react";

import { useSessionStore } from "@/app/stores/session-store";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { SessionMessagesAndUserInputs } from "@/components-v2/session/session-messages-and-user-inputs";
import { ScrollArea } from "@/components-v2/ui/scroll-area";

interface ScrollToBottomOptions {
  wait?: number;
  behavior?: ScrollBehavior;
}

const SessionMain = ({
  onAddPlotCard,
  isOpenSettings,
}: {
  onAddPlotCard: () => void;
  isOpenSettings: boolean;
}) => {
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const isMobile = useIsMobile();

  // Scroll to bottom
  const scrollAreaVieportRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((options?: ScrollToBottomOptions) => {
    delay(() => {
      if (!scrollAreaVieportRef.current) {
        return;
      }
      scrollAreaVieportRef.current.scrollTo({
        top: scrollAreaVieportRef.current.scrollHeight,
        behavior: options?.behavior ?? "instant",
      });
    }, options?.wait ?? 50);
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, selectedSessionId]);

  if (!selectedSessionId) {
    return null;
  }

  if (isMobile) {
    // For mobile, use native scrolling instead of ScrollArea
    return (
      <div className="h-full overflow-y-auto" ref={scrollAreaVieportRef}>
        <SessionMessagesAndUserInputs
          scrollToBottom={scrollToBottom}
          onAddPlotCard={onAddPlotCard}
          isOpenSettings={isOpenSettings}
        />
      </div>
    );
  }

  return (
    <ScrollArea
      viewportRef={scrollAreaVieportRef}
      className={cn("min-h-dvh max-h-dvh")}
    >
      <SessionMessagesAndUserInputs
        scrollToBottom={scrollToBottom}
        onAddPlotCard={onAddPlotCard}
        isOpenSettings={isOpenSettings}
      />
    </ScrollArea>
  );
};

export { SessionMain };
export type { ScrollToBottomOptions };

