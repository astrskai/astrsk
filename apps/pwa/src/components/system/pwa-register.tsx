import { useAppStore } from "@/app/stores/app-store";
import { logger } from "@/shared/lib/logger";
import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  // If the period is not positive, do not register the sync
  if (period <= 0) {
    return;
  }

  // Set an interval to periodically check for updates
  setInterval(async () => {
    // Check if the service worker is installing or if navigator is not available
    if (r.installing || !navigator) {
      return;
    }

    // Check if the browser is online before attempting to fetch
    if ("onLine" in navigator && !navigator.onLine) {
      return;
    }

    // Fetch the service worker URL to check for updates
    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    // If the response is OK (status 200), update the service worker registration
    if (resp?.status === 200) {
      await r.update();
    }
  }, period);
}

const pwaUpdatePeriodMs = 1 * 60 * 1000; // 1 minutes, minimum 1 minute

const PwaRegister = () => {
  const setIsOfflineReady = useAppStore.use.setIsOfflineReady();
  const setIsUpdateReadyPWA = useAppStore.use.setIsUpdateReadyPWA();
  const setUpdateServiceWorker = useAppStore.use.setUpdateServiceWorker();

  // Register service worker

  const { updateServiceWorker } = useRegisterSW({
    onOfflineReady() {
      logger.info("Service worker is ready for offline use");
      setIsOfflineReady(true);
    },
    onNeedRefresh() {
      setIsUpdateReadyPWA(true);
    },
    onRegisteredSW(swScriptUrl, registration) {
      logger.info("Service worker registered:", swScriptUrl);
      if (registration?.active?.state === "activated") {
        registerPeriodicSync(pwaUpdatePeriodMs, swScriptUrl, registration);
        setIsOfflineReady(true);
        logger.info("[PWA] offline ready");
      } else if (registration?.installing) {
        registration.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") {
            registerPeriodicSync(pwaUpdatePeriodMs, swScriptUrl, registration);
            setIsOfflineReady(true);
            logger.info("[PWA] offline ready");
          }
        });
      }
    },
    onRegisterError(error) {
      logger.error("Service worker registration error:", error);
    },
  });

  // Set updater function
  useEffect(() => {
    setUpdateServiceWorker(updateServiceWorker);
    logger.info("[PWA] Set updateServiceWorker");
  }, [setUpdateServiceWorker, updateServiceWorker]);

  return null;
};

export { PwaRegister };
