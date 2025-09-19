import { useAsset } from "@/app/hooks/use-asset";
import { useSession } from "@/app/hooks/use-session";
import { useSessions } from "@/app/hooks/use-sessions-v2";
import { useAppStore } from "@/app/stores/app-store";
import { useBackgroundStore } from "@/app/stores/background-store";
import { useSessionStore } from "@/app/stores/session-store";
import {
  SidebarInset,
  SidebarLeftProvider,
} from "@/components-v2/both-sidebar";
import { InitialPage } from "@/components-v2/init-page";
import { cn } from "@/components-v2/lib/utils";
import { CardTab } from "@/components-v2/session/create-session/step-cards";
import { SessionMain } from "@/components-v2/session/session-main";
import { SessionSettings } from "@/components-v2/session/session-settings";
import { SvgIcon } from "@/components-v2/svg-icon";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";

export default function SessionPage({ className }: { className?: string }) {
  const [isOpenSettings, setIsOpenSettings] = useState(false);
  const { isFirstTimeSidebarOpen, setIsFirstTimeSidebarOpen } = useAppStore();
  const { selectedSessionId } = useSessionStore();
  const [session] = useSession(selectedSessionId);
  const { data: sessions } = useSessions({
    keyword: "",
  });

  // Session onboarding
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const shouldShowSessionEditTooltip =
    sessionOnboardingSteps.inferenceButton &&
    !sessionOnboardingSteps.sessionEdit;

  // Background
  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(
    session?.props.backgroundId?.toString() ?? "",
  );
  const [backgroundAsset] = useAsset(background?.assetId);
  const backgroundSrc =
    backgroundAsset ??
    (background && "src" in background ? background.src : "");

  // Don't show background if it's still loading (skeleton path indicates loading)
  const isLoadingBackground = backgroundAsset === "/img/skeleton.svg";
  const shouldShowBackground = backgroundSrc && !isLoadingBackground;

  // Add plot card
  const refEditCards = useRef<HTMLDivElement>(null);
  const refInitCardTab = useRef<CardTab>("ai");
  const onAddPlotCard = () => {
    setIsOpenSettings(true);
    refInitCardTab.current = "plot";
    refEditCards.current?.click();
  };

  return (
    <div
      className={cn(
        "relative min-h-dvh max-h-dvh bg-background-screen",
        className,
      )}
    >
      {shouldShowBackground && (
        <div className="pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundSrc})` }}
          />
          <div className="absolute inset-0 bg-[#000000] opacity-50" />
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out",
          isOpenSettings && "-translate-x-full",
        )}
      >
        <SidebarLeftProvider
          defaultOpen={isFirstTimeSidebarOpen}
          changeDefaultOpen={(open) => {
            if (!isFirstTimeSidebarOpen) {
              setIsFirstTimeSidebarOpen(true);
            }
          }}
        >
          <SidebarInset className="bg-transparent">
            {/* No selected session */}
            {selectedSessionId === null && sessions.length === 0 && (
              <InitialPage />
            )}

            {/* Session main */}
            <SessionMain
              onAddPlotCard={onAddPlotCard}
              isOpenSettings={isOpenSettings}
            />
          </SidebarInset>
        </SidebarLeftProvider>
      </div>

      {/* Session top gradient */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-[100px] pointer-events-none",
          "bg-gradient-to-b from-[#0E0E0EB2] to-[#0E0E0E00]",
        )}
      />

      {/* Session settings */}
      {session && (
        <>
          <FloatingActionButton
            icon={<SvgIcon name="edit" size={24} />}
            label="Session settings"
            position="top-right"
            className={cn(
              "transition-opacity duration-[600ms] ease-in-out opacity-100",
              isOpenSettings && "opacity-0 pointer-events-none",
            )}
            onClick={() => {
              setIsOpenSettings(true);
            }}
            onboarding={shouldShowSessionEditTooltip && !isOpenSettings}
            onboardingTooltip="Click to edit session details"
          />
          <FloatingActionButton
            icon={<ArrowLeft className="min-w-[24px] min-h-[24px]" />}
            label="Back to session"
            position="top-left"
            className={cn(
              "transition-opacity duration-[600ms] ease-in-out opacity-100",
              !isOpenSettings && "opacity-0 pointer-events-none",
            )}
            onClick={() => {
              setIsOpenSettings(false);
            }}
          />
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-[600ms] ease-in-out translate-x-full overflow-hidden overflow-y-auto",
              isOpenSettings && "translate-x-0",
            )}
          >
            <ScrollArea className="h-full">
              <SessionSettings
                setIsOpenSettings={setIsOpenSettings}
                refEditCards={refEditCards}
                refInitCardTab={refInitCardTab}
                isSettingsOpen={isOpenSettings}
              />
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
