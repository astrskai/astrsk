/**
 * Settings pages route configuration
 * Used for navigation and page title resolution
 */

export const LEGAL_ROUTES = [
  {
    title: "Privacy Policy",
    path: "/settings/legal/privacy-policy",
  },
  {
    title: "Terms of Use",
    path: "/settings/legal/terms-of-service",
  },
  {
    title: "Content Policy",
    path: "/settings/legal/content-policy",
  },
  {
    title: "Refund Policy",
    path: "/settings/legal/refund-policy",
  },
  {
    title: "Open-source Software Notice",
    path: "/settings/legal/oss-notice",
  },
] as const;

export const SETTINGS_ROUTES = [
  { title: "Providers", path: "/settings/providers" },
  { title: "Advanced Preferences", path: "/settings/advanced" },
  { title: "Legal", path: "/settings/legal" },
  { title: "Account", path: "/settings/account" },
  { title: "Credit Usage", path: "/settings/account/credit-usage" },
  ...LEGAL_ROUTES,
] as const;

/**
 * Get page title for a given settings route path
 * @param path - The route pathname (e.g., "/settings/legal/privacy-policy")
 * @returns The page title, or "Settings" if no match found
 */
export const getSettingsTitle = (path: string): string => {
  const route = SETTINGS_ROUTES.find((route) => route.path === path);
  return route?.title || "Settings";
};
