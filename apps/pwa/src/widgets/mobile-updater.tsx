import { MobileNavItem } from "@/widgets/left-navigation/left-navigation-mobile";
import { logger } from "@/shared/lib/logger";
import { Import } from "lucide-react";
import { useCallback } from "react";
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

const MobileUpdater = () => {
  // PWA(service worker) updater
  const pwaUpdatePeriodMs = 10 * 60 * 1000; // 10 minutes, minimum 1 minute
  const {
    needRefresh: [isUpdateReadyPWA],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      logger.info("Service worker is ready for offline use");
    },
    onRegisterError(error) {
      logger.error("Service worker registration error:", error);
    },
    onRegisteredSW(swScriptUrl, registration) {
      logger.info("Service worker registered:", swScriptUrl);
      if (registration?.active?.state === "activated") {
        registerPeriodicSync(pwaUpdatePeriodMs, swScriptUrl, registration);
      } else if (registration?.installing) {
        registration.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") {
            registerPeriodicSync(pwaUpdatePeriodMs, swScriptUrl, registration);
          }
        });
      }
    },
  });

  // Restart and apply update
  const restartApp = useCallback(async () => {
    updateServiceWorker();
  }, [updateServiceWorker]);

  return (
    isUpdateReadyPWA && (
      <MobileNavItem
        active={false}
        name="Update"
        icon={<Import className="min-h-6 min-w-6" />}
        onClick={restartApp}
        className=""
      />
    )
  );
};

export { MobileUpdater };
