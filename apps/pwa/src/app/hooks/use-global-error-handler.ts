import { logger } from "@/shared/utils/logger";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const useGlobalErrorHandler = () => {
  const lastErrorTime = useRef<number>(0);
  const DEBOUNCE_TIME = 1000; // 1 second debounce

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const now = Date.now();

      // Debounce to prevent duplicate error toasts
      if (now - lastErrorTime.current < DEBOUNCE_TIME) {
        return;
      }

      lastErrorTime.current = now;

      // Log with logger in development
      if (import.meta.env.DEV) {
        logger.error("Global error caught:", event.error);
      }

      // Show error toast
      const errorMessage =
        event.error?.message || event.message || "An unexpected error occurred";
      toast.error(errorMessage);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const now = Date.now();

      // Debounce to prevent duplicate error toasts
      if (now - lastErrorTime.current < DEBOUNCE_TIME) {
        return;
      }

      lastErrorTime.current = now;

      // Log with logger in development
      if (import.meta.env.DEV) {
        logger.error("Unhandled promise rejection:", event.reason);
      }

      // Show error toast
      const errorMessage =
        event.reason?.message ||
        String(event.reason) ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    };

    // Add event listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);
};
