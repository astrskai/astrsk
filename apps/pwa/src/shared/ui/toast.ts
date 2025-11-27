import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

/**
 * Toast utilities with theme.css design tokens
 * Provides error, success, info, warning, and promise-based toasts
 */

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: ExternalToast["position"];
  closeButton?: boolean;
}

type ToastVariant = "error" | "success" | "info" | "warning";

// Theme-based color configurations using CSS variables from theme.css
const variantStyles: Record<
  ToastVariant,
  {
    bg: string;
    border: string;
    text: string;
    descriptionClass: string;
    closeButtonClass: string;
    duration: number;
  }
> = {
  error: {
    bg: "var(--color-status-error)",
    border: "var(--color-status-error)",
    text: "var(--fg-default)",
    descriptionClass: "!text-red-200 !line-clamp-2 !overflow-hidden",
    closeButtonClass:
      "!bg-red-900 !text-red-200 hover:!bg-red-800 !border-red-700",
    duration: 4000,
  },
  success: {
    bg: "var(--color-status-success)",
    border: "var(--color-status-success)",
    text: "var(--fg-default)",
    descriptionClass: "!text-green-200 !line-clamp-2 !overflow-hidden",
    closeButtonClass:
      "!bg-green-700 !text-green-200 hover:!bg-green-800 !border-green-700",
    duration: 3000,
  },
  info: {
    bg: "var(--color-status-info)",
    border: "var(--color-status-info)",
    text: "var(--fg-default)",
    descriptionClass: "!text-blue-200 !line-clamp-2 !overflow-hidden",
    closeButtonClass:
      "!bg-blue-900 !text-blue-200 hover:!bg-blue-800 !border-blue-700",
    duration: 3000,
  },
  warning: {
    bg: "var(--color-status-warning)",
    border: "var(--color-status-warning)",
    text: "var(--fg-default)",
    descriptionClass: "!text-amber-200 !line-clamp-2 !overflow-hidden",
    closeButtonClass:
      "!bg-amber-900 !text-amber-200 hover:!bg-amber-800 !border-amber-700",
    duration: 4000,
  },
};

/**
 * Creates a styled toast with consistent theme integration
 */
const createToast = (
  variant: ToastVariant,
  message: string,
  options?: ToastOptions,
) => {
  const styles = variantStyles[variant];
  const toastMethod = sonnerToast[variant];

  return toastMethod(message, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? styles.duration,
    position: options?.position ?? "top-right",
    closeButton: options?.closeButton ?? true,
    descriptionClassName: styles.descriptionClass,
    classNames: {
      closeButton: styles.closeButtonClass,
    },
    style: {
      color: styles.text,
      borderColor: `color-mix(in srgb, ${styles.border} 50%, transparent)`,
      backgroundColor: `color-mix(in srgb, ${styles.bg} 20%, var(--bg-surface-raised))`,
    },
  });
};

/**
 * Error toast - Use for: Save failures, validation errors, API errors
 */
export const toastError = (message: string, options?: ToastOptions) =>
  createToast("error", message, options);

/**
 * Success toast - Use for: Successful saves, completions, confirmations
 */
export const toastSuccess = (message: string, options?: ToastOptions) =>
  createToast("success", message, options);

/**
 * Info toast - Use for: Informational messages, tips, neutral notifications
 */
export const toastInfo = (message: string, options?: ToastOptions) =>
  createToast("info", message, options);

/**
 * Warning toast - Use for: Warnings, cautions, non-critical issues
 */
export const toastWarning = (message: string, options?: ToastOptions) =>
  createToast("warning", message, options);

/**
 * Promise-based toast for async operations
 * Automatically shows loading → success/error states
 */
export const toastPromise = <T>(
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
      backgroundColor: "var(--bg-surface-raised)",
      borderColor: "var(--border-default)",
      color: "var(--fg-default)",
    },
  });
};
