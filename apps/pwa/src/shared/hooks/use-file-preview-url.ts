import { useMemo } from "react";

// Global cache to reuse Object URLs for the same File object
// This prevents creating multiple URLs for the same file and avoids
// the URL being revoked while another component still needs it
const fileUrlCache = new WeakMap<File, string>();

// Track all created URLs for cleanup (WeakMap doesn't allow iteration)
const allCreatedUrls = new Set<string>();

/**
 * Hook to create and manage Object URL from a File
 * Uses a global WeakMap cache to ensure the same File object always
 * returns the same Object URL, preventing issues when multiple components
 * display the same file's image.
 *
 * The WeakMap allows garbage collection of cached entries when the File object
 * is no longer referenced anywhere in the app.
 *
 * Call `revokeAllFilePreviewUrls()` when the session/wizard is completed
 * to clean up all created Object URLs.
 *
 * @param file - The File object to create a preview URL for
 * @param fallbackUrl - Optional fallback URL to use when file is not provided
 * @returns The Object URL for the file, or the fallback URL, or undefined
 */
export function useFilePreviewUrl(
  file: File | undefined,
  fallbackUrl?: string,
): string | undefined {
  const objectUrl = useMemo(() => {
    if (!file) {
      return undefined;
    }

    // Check cache first
    let url = fileUrlCache.get(file);
    if (!url) {
      // Create new URL and cache it
      url = URL.createObjectURL(file);
      fileUrlCache.set(file, url);
      allCreatedUrls.add(url);
    }

    return url;
  }, [file]);

  // Return object URL if available, otherwise fallback
  return objectUrl || fallbackUrl;
}

/**
 * Revoke all Object URLs created by useFilePreviewUrl
 * Call this when the session/wizard is completed to free memory
 */
export function revokeAllFilePreviewUrls(): void {
  allCreatedUrls.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  allCreatedUrls.clear();
  // Note: WeakMap entries will be garbage collected automatically
  // when File objects are no longer referenced
}
