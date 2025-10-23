import { useAppStore } from "@/app/stores/app-store";
import {
  TypoTiny,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { cn } from "@/shared/lib";
import { logger } from "@/shared/lib/logger";
import { Import } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const UpdaterNew = () => {
  // Electron updater
  const [isUpdateReadyElectron, setIsUpdateReadyElectron] = useState(false);
  const isDownloading = useRef<boolean>(false);
  const [downloadProgressPercent, setDownloadProgressPercent] =
    useState<number>(0);
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
      setDownloadProgressPercent(Math.round(info.percent));
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

  // Restart and apply update
  const updateServiceWorker = useAppStore.use.updateServiceWorker();
  const restartApp = useCallback(async () => {
    await updateServiceWorker?.();
    await window.api?.updater?.quitAndInstall();
  }, [updateServiceWorker]);

  // Get update readiness
  const isUpdateReadyPWA = useAppStore.use.isUpdateReadyPWA;
  const isUpdateReady = isUpdateReadyElectron && isUpdateReadyPWA;

  return (
    (isDownloading.current || isUpdateReady) && (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isUpdateReady) {
                  restartApp();
                }
              }}
              className="relative data-[state=closed]:[&>.dot]:opacity-100"
            >
              <Import size={20} />
              {isUpdateReady && (
                <div
                  className={cn(
                    "bg-status-required absolute -top-[3px] -right-[4px] size-[5px] rounded-full",
                    "dot opacity-0 transition-opacity",
                  )}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            variant="button"
            sideOffset={14}
            className="z-[100]"
          >
            <div className="flex flex-col px-2 py-2">
              {isUpdateReady ? (
                <TypoTiny className="p-0 leading-tight">
                  Restart to update!
                </TypoTiny>
              ) : (
                <TypoTiny className="p-0 leading-tight">
                  Downloading update... {downloadProgressPercent}%
                </TypoTiny>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  );
};

export { UpdaterNew };
