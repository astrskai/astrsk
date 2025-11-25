import { useAsset } from "@/shared/hooks/use-asset";
import { sessionQueries } from "@/entities/session/api";
import { useAppStore } from "@/shared/stores/app-store";
import { useBackgroundStore } from "@/shared/stores/background-store";
import { useSessionStore } from "@/shared/stores/session-store";
import { Session } from "@/entities/session/domain/session";
import {
  SearchableSidebar,
  SessionListItem,
} from "@/widgets/searchable-sidebar";
import { cn } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";
import { Route } from "@/routes/_layout/sessions/$sessionId";
import { CardTab } from "@/features/session/create-session/step-cards";
import { SessionContent, SessionSettings } from "./ui/detail";
import { FloatingActionButton, ScrollArea, SvgIcon } from "@/shared/ui";
import { logger } from "@/shared/lib";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SessionDetailPage({
  className,
}: {
  className?: string;
}) {
  const navigate = useNavigate();
  const { sessionId } = Route.useParams();
  const [isOpenSettings, setIsOpenSettings] = useState(false);
  const [sidebarKeyword, setSidebarKeyword] = useState("");
  const { selectedSessionId } = useSessionStore();
  const selectSession = useSessionStore.use.selectSession();
  const { data: session, isLoading } = useQuery(
    sessionQueries.detail(selectedSessionId ?? undefined),
  );
  const { data: sessions = [] } = useQuery(
    sessionQueries.list({ keyword: sidebarKeyword }),
  );

  // Set selected session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      selectSession(new UniqueEntityID(sessionId), "Session");
    }
  }, [sessionId, selectSession]);

  // Check session exists
  useEffect(() => {
    if (!isLoading && !session) {
      logger.error("Session not found");
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, navigate, session]);

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
        "bg-background-screen relative flex h-dvh flex-col overflow-hidden",
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

      {/* Mobile Header - only visible on mobile */}
      <header className="relative z-10 flex h-14 items-center justify-between px-4 backdrop-blur-md md:hidden">
        {/* Left: Back button */}
        <button
          onClick={() => navigate({ to: "/sessions" })}
          className="text-text-secondary hover:text-text-primary -ml-2 flex h-10 w-10 items-center justify-center transition-colors"
          aria-label="Go back to sessions list"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Center: Session title */}
        <h1 className="text-text-primary flex-1 truncate text-center text-base font-semibold">
          {session?.title ?? "Session"}
        </h1>

        {/* Right: Settings/Close button */}
        <button
          onClick={() => setIsOpenSettings(!isOpenSettings)}
          className="text-text-secondary hover:text-text-primary -mr-2 flex h-10 w-10 items-center justify-center transition-colors"
          aria-label={isOpenSettings ? "Close settings" : "Session settings"}
        >
          {isOpenSettings ? (
            <X className="h-5 w-5" />
          ) : (
            <SvgIcon name="edit" size={20} />
          )}
        </button>
      </header>

      <div
        className={cn(
          "relative flex flex-1 transition-transform duration-[600ms] ease-in-out md:absolute md:inset-0",
          isOpenSettings && "-translate-x-full",
        )}
      >
        {/* Searchable Sidebar */}
        <SearchableSidebar
          className="hidden md:block"
          keyword={sidebarKeyword}
          onKeywordChange={setSidebarKeyword}
          defaultExpanded={true}
        >
          {sessions.map((session: Session) => (
            <SessionListItem
              key={session.id.toString()}
              session={session}
              isActive={session.id.toString() === selectedSessionId?.toString()}
            />
          ))}
        </SearchableSidebar>

        {/* Main Content */}
        <div className="flex flex-1 flex-col bg-transparent">
          {/* Session content */}
          <SessionContent
            onAddPlotCard={onAddPlotCard}
            isOpenSettings={isOpenSettings}
          />
        </div>
      </div>

      {/* Session top gradient - desktop only */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[100px]",
          "bg-gradient-to-b from-[#0E0E0EB2] to-[#0E0E0E00]",
          "hidden md:block",
        )}
      />

      {/* Session settings - desktop only */}
      {session && (
        <>
          <FloatingActionButton
            icon={<SvgIcon name="edit" size={24} />}
            label="Session settings"
            position="top-right"
            className={cn(
              "hidden opacity-100 transition-opacity duration-[600ms] ease-in-out md:flex",
              isOpenSettings && "pointer-events-none opacity-0",
            )}
            onClick={() => {
              setIsOpenSettings(true);
            }}
            onboarding={shouldShowSessionEditTooltip && !isOpenSettings}
            onboardingTooltip="Click to edit session details"
          />
          <FloatingActionButton
            icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
            label="Back to session"
            position="top-left"
            className={cn(
              "hidden opacity-100 transition-opacity duration-[600ms] ease-in-out md:flex",
              !isOpenSettings && "pointer-events-none opacity-0",
            )}
            onClick={() => {
              setIsOpenSettings(false);
            }}
          />
          <div
            className={cn(
              "absolute inset-0 flex translate-x-full flex-col overflow-hidden transition-transform duration-[600ms] ease-in-out",
              isOpenSettings && "translate-x-0",
            )}
          >
            {/* Mobile Settings Header - only visible on mobile */}
            <header className="border-border bg-background-surface-1 relative z-10 flex h-14 items-center justify-between border-b px-4 md:hidden">
              {/* Left: Back button */}
              <button
                onClick={() => setIsOpenSettings(false)}
                className="text-text-secondary hover:text-text-primary -ml-2 flex h-10 w-10 items-center justify-center transition-colors"
                aria-label="Back to session"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Center: Settings title */}
              <h1 className="text-text-primary flex-1 truncate text-center text-base font-semibold">
                Session Settings
              </h1>

              {/* Right: Empty for symmetry */}
              <div className="h-10 w-10" />
            </header>

            <ScrollArea className="flex-1">
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
