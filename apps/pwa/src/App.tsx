import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { QueryClientProvider } from "@tanstack/react-query";

import { createContext, useContext, useEffect, useState } from "react";

import { useDefaultInitialized } from "@/app/hooks/use-default-initialized";
import { useGlobalErrorHandler } from "@/app/hooks/use-global-error-handler";
import { queryClient } from "@/app/queries/query-client";
import { Page, useAppStore } from "@/app/stores/app-store";
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
import { GlobalDockView } from "@/components-v2/global-dockview";
import { RightSidebarContextProvider } from "@/components-v2/top-bar";
import { cn } from "@/components-v2/lib/utils";
import { Loading } from "@/components-v2/loading";
import { PaymentPage } from "@/components-v2/setting/payment-page";
import { SignUpPage } from "@/components-v2/setting/signup-page";
import { SubscribePage } from "@/components-v2/setting/subscribe-page";
import { ThemeProvider } from "@/components-v2/theme-provider";
import { TopBar } from "@/components-v2/top-bar";
import { Sheet, SheetContent } from "@/components-v2/ui/sheet";
import { Toaster } from "@/components-v2/ui/sonner";
import { logger } from "@/shared/utils/logger";
import * as amplitude from "@amplitude/analytics-browser";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Init amplitude
if (import.meta.env.VITE_AMPLITUDE_API_KEY) {
  amplitude.init(import.meta.env.VITE_AMPLITUDE_API_KEY, {
    // Disable auto capture
    autocapture: false,

    // Disable optional tracking
    trackingOptions: {
      ipAddress: false,
      language: false,
      platform: false,
    },
  });
}

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
        <div className="flex items-center justify-center h-[calc(100dvh-40px)] bg-background-screen">
          <Loading isTimer />
        </div>
      </>
    );
  }

  // Real loading
  if (!defaultInitialized) {
    <>
      <TopBar />
      <div className="flex items-center justify-center h-[calc(100dvh-40px)] bg-background-screen">
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
        <RightSidebarContextProvider>
          <TopBar />
          <SidebarLeftProvider defaultOpen={!isMobile}>
            <LeftNavigation />
            <LeftNavigationTrigger />
            <SidebarInset>
              <main className="relative flex-1 overflow-hidden">
                <GlobalDockView>{children}</GlobalDockView>
              </main>
            </SidebarInset>
            <Toaster expand className="!z-[100]" />
          </SidebarLeftProvider>
        </RightSidebarContextProvider>
      </div>
    </ThemeProvider>
  );
}

const AppInternal = () => {
  const activePage = useAppStore.use.activePage();

  // Toggle telemetry
  const isTelemetryEnabled = useAppStore.use.isTelemetryEnabled();
  const [isTelemetryInitialized, setIsTelemetryInitialized] = useState(false);
  useEffect(() => {
    amplitude.setOptOut(!isTelemetryEnabled);
    setIsTelemetryInitialized(true);
    logger.debug(`Telemetry ${isTelemetryEnabled ? "enabled" : "disabled"}`);
  }, [isTelemetryEnabled]);

  // Track `start_app` event
  const isMobile = useIsMobile();
  const [isStartAppSent, setIsStartAppSent] = useState(false);
  useEffect(() => {
    // Check telemetry initialized or already sent event
    if (!isTelemetryInitialized || isStartAppSent) {
      return;
    }

    // Set `app_platform`
    const identifyEvent = new amplitude.Identify();
    identifyEvent.set("app_platform", isMobile ? "mobile" : "desktop");
    amplitude.identify(identifyEvent);

    // Track `start_app` event
    amplitude.track("start_app");
    amplitude.flush();

    // Set state
    setIsStartAppSent(true);
    logger.debug(`start_app:  ${isMobile ? "mobile" : "desktop"}`);
  }, [isMobile, isStartAppSent, isTelemetryInitialized]);

  return isMobile ? (
    <V2Layout>
      <MobileApp />
    </V2Layout>
  ) : (
    <>
      <V2Layout>
        <DesktopApp />
      </V2Layout>
      {activePage === Page.Subscribe && <SubscribePage />}
      {activePage === Page.SignUp && <SignUpPage />}
      {activePage === Page.Payment && <PaymentPage />}
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInternal />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
