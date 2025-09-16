import { TypoTiny } from "@/components-v2/typo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { cn } from "@/shared/utils";
import { logger } from "@/shared/utils/logger";
import { Import } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const UpdaterNew = () => {
  // Electron updater
  const [isUpdateReadyElectron, setIsUpdateReadyElectron] = useState(false);
  const isDownloading = useRef<boolean>(false);
  useEffect(() => {
    // Check updater is available
    if (!window.api || !window.api.updater) {
      return;
    }

    // Handle updater events
    window.api.updater.onError((error, message) => {
      logger.error("Updater error:", error, message);
    });
    window.api.updater.onUpdateAvailable(() => {
      logger.info("New update available");
      if (!isDownloading.current) {
        logger.info("Starting automatic download of update");
        window.api?.updater?.downloadUpdate();
      }
    });
    window.api.updater.onDownloadProgress((info) => {
      logger.info(`Download progress: ${info.percent}%`);
      isDownloading.current = true;
    });
    window.api.updater.onUpdateDownloaded(() => {
      logger.info("Update downloaded");
      setIsUpdateReadyElectron(true);
    });

    // Clean up listeners on component unmount
    return () => {
      // No need for cleanup as the listeners are automatically removed when the component unmounts
      // The electron IPC API doesn't provide a way to remove listeners directly
    };
  }, []);

  // PWA(service worker) updater
  const pwaUpdatePeriodMs = 10 * 60 * 1000; // 10 minutes, minimum 1 minute
  const {
    needRefresh: [isUpdateReadyPWA],
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
    if (isUpdateReadyPWA) {
      await window.api?.updater?.relaunch();
    } else {
      await window.api?.updater?.quitAndInstall();
    }
  }, [isUpdateReadyPWA]);

  // Get update readiness
  const isUpdateReady = isUpdateReadyElectron || isUpdateReadyPWA;

  return (
    isUpdateReady && (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={restartApp}
              className="relative data-[state=closed]:[&>.dot]:opacity-100"
            >
              <Import size={20} />
              <div
                className={cn(
                  "absolute -top-[3px] -right-[4px] size-[5px] rounded-full bg-status-required",
                  "dot opacity-0 transition-opacity",
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" variant="button" sideOffset={14} className="z-[100]">
            <div className="flex flex-col px-2 py-2">
              <TypoTiny className="p-0 leading-tight">
                Restart to update!
              </TypoTiny>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  );
};

export { UpdaterNew };
