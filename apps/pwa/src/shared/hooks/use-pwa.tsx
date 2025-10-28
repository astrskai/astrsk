import { logger } from "@/shared/lib";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

export function usePwa() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Check standalone indicators
  const isDisplayModeStandalone = useMediaQuery("(display-mode: standalone)");
  useEffect(() => {
    const isNavigatorStandalone = (window.navigator as any).standalone === true;
    const isParamStandalone =
      new URLSearchParams(location.search).get("mode") === "standalone";
    const standalone =
      isDisplayModeStandalone || isNavigatorStandalone || isParamStandalone;
    setIsStandalone(standalone);
  }, [isDisplayModeStandalone]);

  // Check `beforeinstallprompt` event support
  useEffect(() => {
    // Handle `beforeinstallprompt` event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Set and unset event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Install PWA
  const install = async () => {
    // Check if deferred prompt exists
    if (!deferredPrompt) {
      logger.error("No deferred prompt available for installation.");
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      logger.info("PWA installation accepted.");
    } else {
      logger.info("PWA installation dismissed.");
    }
    setDeferredPrompt(null);
  };

  return {
    isStandalone,
    canInstall,
    install,
  } as const;
}
