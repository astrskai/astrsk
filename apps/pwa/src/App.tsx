import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { QueryClientProvider } from "@tanstack/react-query";

import { createContext, useContext, useEffect, useState } from "react";
import { initializeEnvironment } from "@/utils/environment";

// Initialize environment detection once at app startup
initializeEnvironment();

import { useDefaultInitialized } from "@/app/hooks/use-default-initialized";
import { useGlobalErrorHandler } from "@/app/hooks/use-global-error-handler";
import { queryClient } from "@/app/queries/query-client";
import { Page, useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import DesktopApp from "@/app/v2/desktop-app";
import MobileApp from "@/app/v2/mobile-app";
import {
  SidebarInset,
  SidebarLeftProvider,
} from "@/components-v2/both-sidebar";
import { usePwa } from "@/components-v2/hooks/use-pwa";
import { InstallPwa } from "@/components-v2/install-pwa";
import { LeftNavigationMobile } from "@/components-v2/left-navigation";
import {
  LeftNavigation,
  LeftNavigationTrigger,
} from "@/components-v2/left-navigation/left-navigation";
import { cn } from "@/components-v2/lib/utils";
import { Loading } from "@/components-v2/loading";
import { PaymentPage } from "@/components-v2/setting/payment-page";
import { SignUpPage } from "@/components-v2/setting/signup-page";
import { SubscribePage } from "@/components-v2/setting/subscribe-page";
import { ThemeProvider } from "@/components-v2/theme-provider";
import { TopBar } from "@/components-v2/top-bar";
import { Sheet, SheetContent } from "@/components-v2/ui/sheet";
import { Toaster } from "@/components-v2/ui/sonner";
import { UniqueEntityID } from "@/shared/domain";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { OnboardingStepOnePage } from "@/components-v2/setting/onboarding-step-one-page";
import { OnboardingStepTwoPage } from "@/components-v2/setting/onboarding-step-two-page";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// Mobile navigation context
const MobileNavigationContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const useMobileNavigation = () => {
  const context = useContext(MobileNavigationContext);
  if (!context) {
    throw new Error(
      "useMobileNavigation must be used within MobileNavigationProvider",
    );
  }
  return context;
};

function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useIsMobile();
  const { isLoading, setIsLoading } = useAppStore();
  const [isLoadingScreen, setIsLoadingScreen] = useState(isLoading);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isStandalone, canInstall, install } = usePwa();
  const defaultInitialized = useDefaultInitialized();

  // Onboarding-based sidebar control
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const onboardingSelectedSessionId =
    useAppStore.use.onboardingSelectedSessionId();
  const setActivePage = useAppStore.use.setActivePage();

  // Session store for restoring selected session
  const selectSession = useSessionStore.use.selectSession();

  // Determine if sidebar should be closed based on onboarding state
  // Close sidebar when genre is selected but session data step not complete (in onboarding flow)
  const isInOnboardingFlow = !sessionOnboardingSteps.openResource;
  const shouldCloseSidebar = isInOnboardingFlow;

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
    setActivePage,
    selectSession,
    isInOnboardingFlow,
  ]);

  // Initialize global error handler
  useGlobalErrorHandler();

  // Effect to handle loading state
  useEffect(() => {
    // If loading is already false in storage, don't show loading screen
    if (!isLoading) {
      setIsLoadingScreen(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
      setIsLoading(false);
    }, 20000);

    return () => clearTimeout(timer);
  }, [isLoading, setIsLoading]);

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

  // Fake loading
  if (isLoadingScreen) {
    return (
      <>
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100dvh-var(--topbar-height))] bg-background-screen">
          <Loading isTimer />
        </div>
      </>
    );
  }

  // Real loading
  if (!defaultInitialized) {
    <>
      <TopBar />
      <div className="flex items-center justify-center h-[calc(100dvh-var(--topbar-height))] bg-background-screen">
        <Loading />
      </div>
    </>;
  }

  if (isMobile) {
    return (
      <ThemeProvider>
        <SidebarLeftProvider defaultOpen={false}>
          <MobileNavigationContext.Provider
            value={{ isOpen: isMobileNavOpen, setIsOpen: setIsMobileNavOpen }}
          >
            <div
              className={cn(
                "antialiased h-dvh w-full text-foreground safe-area-all",
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
                  className="w-[250px] p-0 bg-background-container"
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div
        className={cn(
          "h-dvh min-h-dvh max-h-dvh w-full overflow-hidden",
          "flex flex-col",
          "antialiased font-inter text-foreground",
        )}
      >
        <TopBar />
        <SidebarLeftProvider defaultOpen={!isMobile}>
          <LeftNavigation />
          <LeftNavigationTrigger />
          <SidebarInset>
            <main className="relative flex-1 overflow-hidden h-full w-full">
              {children}
            </main>
          </SidebarInset>
          <Toaster expand className="!z-[9999]" />
        </SidebarLeftProvider>
      </div>
    </ThemeProvider>
  );
}

const AppInternal = () => {
  const activePage = useAppStore.use.activePage();
  const isMobile = useIsMobile();

  return isMobile ? (
    <V2Layout>
      <MobileApp />
    </V2Layout>
  ) : (
    <>
      <V2Layout>
        <DesktopApp />
      </V2Layout>
      {activePage === Page.OnboardingStepOne && <OnboardingStepOnePage />}
      {activePage === Page.OnboardingStepTwo && <OnboardingStepTwoPage />}
      {activePage === Page.Subscribe && <SubscribePage />}
      {activePage === Page.SignUp && <SignUpPage />}
      {activePage === Page.Payment && <PaymentPage />}
    </>
  );
};

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <AppInternal />,
});

const ssoCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sso-callback",
  component: () => <AuthenticateWithRedirectCallback />,
});

const routeTree = rootRoute.addChildren([indexRoute, ssoCallbackRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
