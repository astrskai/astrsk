import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib/logger";

export const isPathWithBasePath = (path: string, basePath: string) => {
  const pattern = new RegExp(`^/${basePath}/[^/]+$`);
  return pattern.test(path);
};

export const getUniqueEntityIDFromPath = (path: string, key: string) => {
  if (isPathWithBasePath(path, key)) {
    const id = path.split(`/${key}/`)[1];

    return UniqueEntityID.isValidUUID(id) ? id : "";
  }

  return "";
};

/**
 * Extract base URL from a full URL (protocol + host)
 * @example extractBaseUrl("https://api.com/v1/models") → "https://api.com"
 */
export function extractBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
}

/**
 * Insert /v1 into URL before OpenAI-compatible endpoint paths
 * Returns null if /v1 should not be added
 *
 * Uses proper URL parsing to avoid false positives from substring matching
 *
 * @example
 * addV1ToUrl("https://api.com/chat/completions") → "https://api.com/v1/chat/completions"
 * addV1ToUrl("https://api.com/v1/models") → null (already has /v1)
 * addV1ToUrl("https://api.com/v4/chat/completions") → null (already has version)
 */
export function addV1ToUrl(originalUrl: string): string | null {
  try {
    const urlObj = new URL(originalUrl);
    const pathname = urlObj.pathname;

    // OpenAI-compatible endpoints (must match path segments, not substrings)
    const endpoints = ['/models', '/chat/completions', '/embeddings', '/completions'];

    // Don't add /v1 if ANY version segment already exists (e.g., /v1/, /v2/, /v3/, /v4/, etc.)
    // This prevents: /v4/chat/completions → /v4/v1/chat/completions
    if (/\/v\d+\//.test(pathname)) {
      return null;
    }

    // Check if pathname contains one of the endpoints
    for (const endpoint of endpoints) {
      if (pathname.endsWith(endpoint) || pathname.includes(`${endpoint}?`) || pathname.includes(`${endpoint}/`)) {
        // Found a matching endpoint - insert /v1 before it
        const endpointIndex = pathname.lastIndexOf(endpoint);
        if (endpointIndex === -1) continue;

        // Split pathname into: before endpoint, endpoint itself, after endpoint
        const before = pathname.substring(0, endpointIndex);
        const after = pathname.substring(endpointIndex);

        // Insert /v1 at the end of "before" part
        const newPathname = before.endsWith('/')
          ? `${before}v1${after}`
          : `${before}/v1${after}`;

        // Reconstruct the full URL
        urlObj.pathname = newPathname;
        return urlObj.href;
      }
    }

    // No matching endpoint found
    return null;
  } catch (error) {
    // If URL parsing fails, fall back to simple string replacement
    logger.warn(`[URL Utils] Failed to parse URL for /v1 insertion: ${originalUrl}`);

    const endpoints = ['/models', '/chat/completions', '/embeddings', '/completions'];

    // Don't add if any version already exists
    if (/\/v\d+\//.test(originalUrl)) return null;

    for (const endpoint of endpoints) {
      if (originalUrl.includes(endpoint)) {
        return originalUrl.replace(endpoint, `/v1${endpoint}`);
      }
    }

    return null;
  }
}
