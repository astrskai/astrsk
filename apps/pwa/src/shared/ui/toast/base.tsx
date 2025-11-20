import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

/**
 * Common toast utilities with consistent styling
 * Provides error, success, info, and warning toast variants
 */

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: ExternalToast["position"];
}

/**
 * Error toast with red styling
 * Use for: Save failures, validation errors, API errors
 */
export const toastError = (message: string, options?: ToastOptions) => {
  return sonnerToast.error(message, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 4000,
    position: options?.position ?? "top-right",
    closeButton: true,
    descriptionClassName: "!text-red-200 !line-clamp-2 !overflow-hidden",
    classNames: {
      closeButton:
        "!bg-red-900 !text-red-200 hover:!bg-red-800 !border-red-700",
    },
    style: {
      color: "rgb(255 255 255 / 0.9)",
      borderColor: "rgb(220 38 38 / 0.5)",
      backgroundColor: "rgb(127 29 29 / 0.9)",
    },
  });
};

/**
 * Success toast with green styling
 * Use for: Successful saves, completions, confirmations
 */
export const toastSuccess = (message: string, options?: ToastOptions) => {
  return sonnerToast.success(message, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 3000,
    position: options?.position ?? "top-right",
    classNames: {
      closeButton:
        "!bg-green-900 !text-green-200 hover:!bg-green-800 !border-green-700",
    },
    style: {
      color: "rgb(255 255 255 / 0.9)",
      borderColor: "rgb(34 197 94 / 0.5)",
      backgroundColor: "rgb(5 46 22 / 0.9)",
    },
  });
};

/**
 * Info toast with blue styling
 * Use for: Informational messages, tips, neutral notifications
 */
export const toastInfo = (message: string, options?: ToastOptions) => {
  return sonnerToast.info(message, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 3000,
    position: options?.position ?? "top-right",
    classNames: {
      closeButton:
        "!bg-blue-900 !text-blue-200 hover:!bg-blue-800 !border-blue-700",
    },
    style: {
      color: "rgb(255 255 255 / 0.9)",
      borderColor: "rgb(59 130 246 / 0.5)",
      backgroundColor: "rgb(23 37 84 / 0.9)",
    },
  });
};

/**
 * Warning toast with amber/yellow styling
 * Use for: Warnings, cautions, non-critical issues
 */
export const toastWarning = (message: string, options?: ToastOptions) => {
  return sonnerToast.warning(message, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 4000,
    position: options?.position ?? "top-right",
    classNames: {
      closeButton:
        "!bg-amber-900 !text-amber-200 hover:!bg-amber-800 !border-amber-700",
    },
    style: {
      color: "rgb(255 255 255 / 0.9)",
      borderColor: "rgb(245 158 11 / 0.5)",
      backgroundColor: "rgb(69 26 3 / 0.9)",
    },
  });
};

/**
 * Promise-based toast for async operations
 * Automatically shows loading → success/error states
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  },
  options?: {
    position?: ExternalToast["position"];
  },
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    position: options?.position ?? "top-right",
    style: {
      backgroundColor: "rgb(31 41 55 / 0.9)",
      borderColor: "rgb(55 65 81 / 0.5)",
    },
  });
};
