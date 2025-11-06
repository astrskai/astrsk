import { isElectronEnvironment } from "@/shared/lib/environment";

/**
 * Custom fetch that proxies localhost requests through Electron to avoid CORS
 * Falls back to native fetch for non-localhost URLs or when not in Electron
 */
export async function electronAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  // Check if we should proxy through Electron
  const shouldProxy =
    isElectronEnvironment() &&
    (url.includes("localhost") || url.includes("127.0.0.1")) &&
    window.api?.httpProxy;

  if (shouldProxy) {
    try {
      const proxyResponse = await window.api!.httpProxy!.fetch({
        url,
        method: init?.method || "GET",
        headers: init?.headers as Record<string, string> | undefined,
        body: init?.body as any,
        timeout: 30000,
      });

      // Convert proxy response to standard Response object
      return new Response(
        typeof proxyResponse.data === "string"
          ? proxyResponse.data
          : JSON.stringify(proxyResponse.data),
        {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          headers: new Headers(proxyResponse.headers),
        }
      );
    } catch (error) {
      console.warn("Electron proxy failed, falling back to native fetch:", error);
      // Fall through to native fetch
    }
  }

  // Use native fetch for non-localhost or when proxy fails
  return fetch(input, init);
}

/**
 * Get the appropriate fetch function based on environment
 * Use this when creating AI SDK providers
 */
export function getAISDKFetch(): typeof fetch {
  if (isElectronEnvironment()) {
    return electronAwareFetch as typeof fetch;
  }
  return fetch;
}

/**
 * Initialize global fetch override for Electron environment
 * Call this once during app initialization to make ALL fetch requests use the proxy
 *
 * WARNING: This overrides the global fetch function. Only use if you want
 * all localhost requests to automatically proxy through Electron.
 */
export function initElectronFetch(): void {
  if (isElectronEnvironment()) {
    const originalFetch = window.fetch;

    window.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      return electronAwareFetch(input, init);
    } as typeof fetch;

    console.log("[Electron] Global fetch override initialized for CORS-free localhost access");
  }
}
