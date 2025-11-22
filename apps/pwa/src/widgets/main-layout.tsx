import { useAppStore } from "@/shared/stores/app-store";
// import { useState } from "react";
import { usePwa } from "@/shared/hooks/use-pwa";
// import { useDefaultInitialized } from "@/shared/hooks/use-default-initialized";
import { useGlobalErrorHandler } from "@/shared/hooks/use-global-error-handler";
import { useSessionStore } from "@/shared/stores/session-store";
import { useEffect } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { useLocation } from "@tanstack/react-router";
// import { InstallPwa } from "@/shared/ui/install-pwa";
import { TopBar } from "@/widgets/top-bar";
import { WebTopBar } from "@/widgets/web-top-bar";
import {
  LoadingOverlay,
  Toaster,
  TooltipProvider,
} from "@/shared/ui";
import { isElectronEnvironment } from "@/shared/lib/environment";
import { ThemeProvider } from "@/app/providers/theme-provider";
import {
  ScrollContainerProvider,
  useScrollContainer,
} from "@/shared/contexts/scroll-container-context";
import { cn } from "@/shared/lib";
import { FixedNav } from "@/widgets/fixed-nav";

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setIsLoading = useAppStore.use.setIsLoading();
  // const activePage = useAppStore.use.activePage();
  const location = useLocation();

  // const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isStandalone, canInstall } = usePwa();
  // defaultInitialized is now handled in main.tsx initStores()
  // const defaultInitialized = useDefaultInitialized();

  // Onboarding-based sidebar control
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const onboardingSelectedSessionId =
    useAppStore.use.onboardingSelectedSessionId();

  // Session store for restoring selected session
  const selectSession = useSessionStore.use.selectSession();

  // Determine if sidebar should be closed based on onboarding state
  // Close sidebar when genre is selected but session data step not complete (in onboarding flow)
  const isInOnboardingFlow = !sessionOnboardingSteps.openResource;

  // Initialize page based on onboarding state
  useEffect(() => {
    // If in onboarding flow, ensure we're on sessions page
    if (isInOnboardingFlow) {
      console.log("In onboarding session play state");
      // Always navigate to sessions page when in session play state
      // setActivePage(Page.Sessions);

      // If we have a stored session, select it
      if (onboardingSelectedSessionId) {
        console.log(
          "Restoring onboarding session:",
          onboardingSelectedSessionId,
        );
        setTimeout(() => {
          selectSession(
            new UniqueEntityID(onboardingSelectedSessionId),
            "Onboarding Session",
          );
        }, 100);
      }
    }
  }, [
    sessionOnboardingSteps,
    onboardingSelectedSessionId,
    selectSession,
    isInOnboardingFlow,
  ]);

  // Initialize global error handler
  useGlobalErrorHandler();

  // Set loading to false when everything is initialized
  useEffect(() => {
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Development mode: Log PWA status for debugging
  if (import.meta.env.DEV) {
    console.log("[Dev Mode] PWA status:", {
      isStandalone,
      canInstall,
      isDev: import.meta.env.DEV,
    });
  }

  // Note: All initialization (DB migration, services, stores) is now handled in main.tsx
  // The isOfflineReady flag is set to true after initialization completes
  // PWA loading screen removed - initialization is shown via InitializationScreen in main.tsx

  const isElectron = isElectronEnvironment();
  const isRootPage = location.pathname === "/";

  return (
    <ThemeProvider>
      <ScrollContainerProvider>
        <MainLayoutContent isElectron={isElectron} isRootPage={isRootPage}>
          {children}
        </MainLayoutContent>
      </ScrollContainerProvider>
    </ThemeProvider>
  );
}

function MainLayoutContent({
  children,
  isElectron,
  isRootPage,
}: {
  children: React.ReactNode;
  isElectron: boolean;
  isRootPage: boolean;
}) {
  const { scrollContainerRef } = useScrollContainer();

  return (
    <div
      className={cn(
        "h-dvh max-h-dvh min-h-dvh w-full",
        "flex flex-col antialiased",
      )}
    >
      <LoadingOverlay />
      {/* Electron: TopBar (window controls), Web: WebTopBar (mobile menu, root page only) */}
      {isElectron ? <TopBar /> : isRootPage && <WebTopBar />}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed sidebar - always visible on desktop, independent of CollapsibleSidebar state */}
        <FixedNav />

        {/* Main content area with scroll */}
        <TooltipProvider delayDuration={0}>
          <main
            ref={scrollContainerRef}
            className="relative z-0 flex flex-1 flex-col overflow-y-auto"
          >
            {children}
          </main>
          <Toaster
            expand
            closeButton
            className="!z-[9999]"
            position="top-right"
          />
        </TooltipProvider>
      </div>
    </div>
  );
}
