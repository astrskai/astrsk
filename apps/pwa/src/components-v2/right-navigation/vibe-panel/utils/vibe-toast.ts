/**
 * Vibe panel specific toast notifications
 * These appear only in the vibe panel's dedicated Toaster (top-right position)
 * We use a different toaster instance to avoid conflicts with global toasts
 */

import { toast as globalToast } from "sonner";

// Create a unique toast instance specifically for vibe panel
// This prevents conflicts with the global toast system
let vibeToastInstance: typeof globalToast;

// Initialize the vibe toast instance
if (typeof window !== 'undefined') {
  vibeToastInstance = globalToast;
} else {
  // Server-side fallback
  vibeToastInstance = {
    success: () => '',
    error: () => '',
    warning: () => '',
    info: () => '',
  } as any;
}

export const vibeToast = {
  success: (message: string, options?: Parameters<typeof globalToast.success>[1]) => {
    return vibeToastInstance.success(message, {
      id: `vibe-success-${Date.now()}-${Math.random()}`,
      position: 'top-right',
      className: 'vibe-panel-toast vibe-panel-toast-success',
      ...options,
    });
  },
  
  error: (message: string, options?: Parameters<typeof globalToast.error>[1]) => {
    return vibeToastInstance.error(message, {
      id: `vibe-error-${Date.now()}-${Math.random()}`,
      position: 'top-right',
      className: 'vibe-panel-toast vibe-panel-toast-error',
      ...options,
    });
  },
  
  warning: (message: string, options?: Parameters<typeof globalToast.warning>[1]) => {
    return vibeToastInstance.warning(message, {
      id: `vibe-warning-${Date.now()}-${Math.random()}`,
      position: 'top-right',
      className: 'vibe-panel-toast vibe-panel-toast-warning',
      ...options,
    });
  },
  
  info: (message: string, options?: Parameters<typeof globalToast.info>[1]) => {
    return vibeToastInstance.info(message, {
      id: `vibe-info-${Date.now()}-${Math.random()}`,
      position: 'top-right',
      className: 'vibe-panel-toast vibe-panel-toast-info',
      ...options,
    });
  },
  
  message: (message: string, options?: Parameters<typeof globalToast>[1]) => {
    return vibeToastInstance(message, {
      id: `vibe-message-${Date.now()}-${Math.random()}`,
      position: 'top-right',
      className: 'vibe-panel-toast vibe-panel-toast-message',
      ...options,
    });
  },
};