/**
 * Centralized sessionStorage key management
 * All sessionStorage keys should be defined here to prevent collisions
 *
 * Note: sessionStorage is per-tab (not shared across tabs, cleared when tab closes)
 */

export const SESSION_STORAGE_KEYS = {
  // Cast Step banners
  CAST_STEP_INFO_BANNER_DISMISSED: "cast-step-info-banner-dismissed",
  CAST_STEP_WARNING_BANNER_DISMISSED: "cast-step-warning-banner-dismissed",
} as const;
