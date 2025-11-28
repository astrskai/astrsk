import { useAsset } from "@/shared/hooks/use-asset";
import { sessionQueries } from "@/entities/session/api";
import { useAppStore } from "@/shared/stores/app-store";
import { useSessionStore } from "@/shared/stores/session-store";
import { Session } from "@/entities/session/domain/session";
import {
  SearchableSidebar,
  SessionListItem,
} from "@/widgets/searchable-sidebar";
import { cn } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";
import { Route } from "@/routes/_layout/sessions/$sessionId";
import {
  CardTab,
  CardTabValue,
} from "@/features/session/create-session/step-cards";
import { SessionContent, SessionSettings } from "./ui/chat";
import { FloatingActionButton, ScrollArea, SvgIcon } from "@/shared/ui";
import { logger } from "@/shared/lib";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  backgroundQueries,
  getDefaultBackground,
  getBackgroundAssetId,
  isDefaultBackground,
} from "@/entities/background/api";

export default function SessionDetailPage({
  className,
}: {
  className?: string;
}) {
  const navigate = useNavigate();
  const { sessionId } = Route.useParams();
  const [isOpenSettings, setIsOpenSettings] = useState(false);
  const [sidebarKeyword, setSidebarKeyword] = useState("");
  const selectSession = useSessionStore.use.selectSession();

  // Use URL sessionId directly for the query instead of store (fixes F5 refresh issue)
  const sessionIdEntity = sessionId ? new UniqueEntityID(sessionId) : undefined;
  const { data: session, isLoading } = useQuery(
    sessionQueries.detail(sessionIdEntity),
  );
  const { data: sessions = [] } = useQuery(
    sessionQueries.list({ keyword: sidebarKeyword }),
  );

  // Sync store with URL params (for other components that depend on the store)
  useEffect(() => {
    if (sessionId) {
      selectSession(new UniqueEntityID(sessionId), session?.title ?? "Session");
    }
  }, [sessionId, selectSession, session?.title]);

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

  // Background - check if default first, then query for user background
  const backgroundId = session?.props.backgroundId;
  const defaultBg = backgroundId ? getDefaultBackground(backgroundId) : undefined;

  const { data: background } = useQuery({
    ...backgroundQueries.detail(backgroundId),
    enabled: !!backgroundId && !defaultBg,
  });

  const [backgroundAsset] = useAsset(getBackgroundAssetId(background));

  // Determine background source
  const backgroundSrc = defaultBg
    ? defaultBg.src
    : backgroundAsset ?? "";

  // Don't show background if it's still loading (skeleton path indicates loading)
  const isLoadingBackground = backgroundAsset === "/img/skeleton.svg";
  const shouldShowBackground = backgroundSrc && !isLoadingBackground;

  // Add plot card
  const refEditCards = useRef<HTMLDivElement>(null);
  const refInitCardTab = useRef<CardTab>(CardTabValue.AI);
  const onAddPlotCard = () => {
    setIsOpenSettings(true);
    refInitCardTab.current = CardTabValue.Plot;
    refEditCards.current?.click();
  };

  return (
    <div
      className={cn(
        "bg-canvas relative flex h-dvh flex-col overflow-hidden",
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
          className="text-fg-muted hover:text-fg-default -ml-2 flex h-10 w-10 items-center justify-center transition-colors"
          aria-label="Go back to sessions list"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Center: Session title */}
        <h1 className="text-fg-default flex-1 truncate text-center text-base font-semibold">
          {session?.title ?? "Session"}
        </h1>

        {/* Right: Settings/Close button */}
        <button
          onClick={() => setIsOpenSettings(!isOpenSettings)}
          className="text-fg-muted hover:text-fg-default -mr-2 flex h-10 w-10 items-center justify-center transition-colors"
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
          {sessions.map((s: Session) => (
            <SessionListItem
              key={s.id.toString()}
              session={s}
              isActive={s.id.toString() === sessionId}
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
            <header className="border-border-default bg-surface relative z-10 flex h-14 items-center justify-between border-b px-4 md:hidden">
              {/* Left: Back button */}
              <button
                onClick={() => setIsOpenSettings(false)}
                className="text-fg-muted hover:text-fg-default -ml-2 flex h-10 w-10 items-center justify-center transition-colors"
                aria-label="Back to session"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Center: Settings title */}
              <h1 className="text-fg-default flex-1 truncate text-center text-base font-semibold">
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
