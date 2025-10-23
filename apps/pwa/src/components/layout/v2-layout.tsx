import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Page, useAppStore } from "@/app/stores/app-store";
import { useState } from "react";
import { usePwa } from "@/shared/hooks/use-pwa";
import { useDefaultInitialized } from "@/app/hooks/use-default-initialized";
import { useGlobalErrorHandler } from "@/app/hooks/use-global-error-handler";
import { useSessionStore } from "@/app/stores/session-store";
import { useEffect } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { InstallPwa } from "@/components/system/install-pwa";
import { TopBar } from "@/components/layout/top-bar";
import { Loading } from "@/shared/ui/loading";
import { ThemeProvider } from "@/components/system/theme-provider";
import { SidebarLeftProvider } from "@/components/layout/both-sidebar";
import { LeftNavigationMobile } from "@/components/layout/left-navigation/left-navigation-mobile";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { Toaster } from "@/shared/ui/sonner";
import { cn } from "@/shared/lib";
import { LeftNavigation } from "@/components/layout/left-navigation";
import { LeftNavigationTrigger } from "@/components/layout/left-navigation";
import { SidebarInset } from "@/components/layout/both-sidebar";
import { MobileNavigationContext } from "@/contexts/mobile-navigation-context";
import { LoadingOverlay } from "@/shared/ui/loading-overlay";
import CreateSessionPage from "@/features/session/create-session-page";
import { createPortal } from "react-dom";

export function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useIsMobile();
  const setIsLoading = useAppStore.use.setIsLoading();
  const activePage = useAppStore.use.activePage();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isStandalone, canInstall, install } = usePwa();
  const defaultInitialized = useDefaultInitialized();

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
    if (defaultInitialized) {
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
    }
  }, [
    defaultInitialized,
    sessionOnboardingSteps,
    onboardingSelectedSessionId,
    selectSession,
    isInOnboardingFlow,
  ]);

  // Initialize global error handler
  useGlobalErrorHandler();

  // Set loading to false when everything is initialized
  useEffect(() => {
    if (defaultInitialized) {
      setIsLoading(false);
    }
  }, [defaultInitialized, setIsLoading]);

  // Show InstallPwa screen only in production for mobile non-standalone users
  if (isMobile && !isStandalone && !import.meta.env.DEV) {
    return <InstallPwa canInstall={canInstall} install={install} />;
  }

  // Development mode: Log PWA status for debugging
  if (import.meta.env.DEV && isMobile) {
    console.log("[Dev Mode] PWA Install Screen bypassed:", {
      isMobile,
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
          <Loading isTimer />
        </div>
      </>
    );
  }

  // Loading default
  if (!defaultInitialized) {
    return (
      <>
        <TopBar />
        <div className="bg-background-screen flex h-[calc(100dvh-var(--topbar-height))] items-center justify-center">
          <Loading />
        </div>
      </>
    );
  }

  if (isMobile) {
    return (
      <ThemeProvider>
        <LoadingOverlay />
        <SidebarLeftProvider defaultOpen={false}>
          <MobileNavigationContext.Provider
            value={{ isOpen: isMobileNavOpen, setIsOpen: setIsMobileNavOpen }}
          >
            <div
              className={cn(
                "text-foreground safe-area-all h-dvh w-full antialiased",
                "flex flex-col",
                "font-inter",
                "bg-background-surface-2",
              )}
            >
              <main className="relative flex-1 overflow-hidden">
                {children}
              </main>

              {/* Mobile navigation sheet */}
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetContent
                  side="left"
                  className="bg-background-container w-[250px] p-0"
                  hideClose
                >
                  <LeftNavigationMobile
                    onNavigate={() => setIsMobileNavOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
            <Toaster expand className="!z-[100]" />
          </MobileNavigationContext.Provider>
        </SidebarLeftProvider>
        {activePage === Page.CreateSession &&
          createPortal(<CreateSessionPage />, document.body)}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div
        className={cn(
          "h-dvh max-h-dvh min-h-dvh w-full overflow-hidden",
          "flex flex-col",
          "font-inter text-foreground antialiased",
        )}
      >
        <LoadingOverlay />
        <TopBar />
        <SidebarLeftProvider defaultOpen={!isMobile}>
          <LeftNavigation />
          <LeftNavigationTrigger />
          <SidebarInset>{children}</SidebarInset>
          <Toaster expand className="!z-[9999]" />
        </SidebarLeftProvider>
        {activePage === Page.CreateSession &&
          createPortal(<CreateSessionPage />, document.body)}
      </div>
    </ThemeProvider>
  );
}
