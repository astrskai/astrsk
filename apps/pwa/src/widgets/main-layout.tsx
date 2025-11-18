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
  InitialLoading,
  LoadingOverlay,
  Toaster,
  TooltipProvider,
} from "@/shared/ui";
import { isElectronEnvironment } from "@/shared/lib/environment";
import { ThemeProvider } from "@/app/providers/theme-provider";
// import { SidebarLeftProvider } from "@/widgets/both-sidebar";
// import { LeftNavigationMobile } from "@/widgets/collapsible-sidebar/left-navigation-mobile";
import { cn } from "@/shared/lib";
// import {
//   CollapsibleSidebar,
//   CollapsibleSidebarTrigger,
// } from "@/widgets/collapsible-sidebar";
import { FixedNav } from "@/widgets/fixed-nav";
// import { SidebarInset } from "@/widgets/both-sidebar";
// import { MobileNavigationContext } from "@/shared/stores/mobile-navigation-context";
// import CreateSessionPage from "@/features/session/create-session-page";
// import { createPortal } from "react-dom";

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
  }, [setIsLoading]);

  // Show InstallPwa screen only in production for mobile non-standalone users
  // deprecated since we don't have a install screen anymore
  // if (isMobile && !isStandalone && !import.meta.env.DEV) {
  //   return <InstallPwa canInstall={canInstall} install={install} />;
  // }

  // Development mode: Log PWA status for debugging
  if (import.meta.env.DEV) {
    console.log("[Dev Mode] PWA Install Screen bypassed:", {
      isStandalone,
      canInstall,
      isDev: import.meta.env.DEV,
    });
  }

  // Loading PWA
  const isOfflineReady = useAppStore.use.isOfflineReady();
  if (!isOfflineReady) {
    return (
      <>
        <TopBar />
        <div className="bg-background-screen flex h-[calc(100dvh-var(--topbar-height))] items-center justify-center">
          <InitialLoading isTimer />
        </div>
      </>
    );
  }

  // Loading default - removed (now handled in main.tsx initStores)
  // if (!defaultInitialized) {
  //   return (
  //     <>
  //       <TopBar />
  //       <div className="bg-background-screen flex h-[calc(100dvh-var(--topbar-height))] items-center justify-center">
  //         <InitialLoading />
  //       </div>
  //     </>
  //   );
  // }

  const isElectron = isElectronEnvironment();
  const isRootPage = location.pathname === "/";

  return (
    <ThemeProvider>
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

          {/* Collapsible navigation area */}
          <div className="flex flex-1 overflow-hidden">
            {/* <SidebarLeftProvider> */}
            <TooltipProvider delayDuration={0}>
              {/* <CollapsibleSidebar />
              <CollapsibleSidebarTrigger /> */}
              <main className="relative z-0 flex flex-1 flex-col overflow-y-auto">
                {children}
              </main>
              <Toaster
                expand
                closeButton
                className="!z-[9999]"
                position="top-right"
              />
            </TooltipProvider>
            {/* </SidebarLeftProvider> */}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
