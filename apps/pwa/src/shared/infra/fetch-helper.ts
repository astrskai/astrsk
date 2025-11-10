import { isElectronEnvironment } from "@/shared/lib/environment";
import { generateStreamId } from "@/shared/lib/fetch-utils";
import { logger } from "@/shared/lib/logger";
import { addV1ToUrl, extractBaseUrl } from "@/shared/lib/url-utils";
import { useApiConnectionStore } from "@/shared/stores";

/**
 * Get API connection store methods (works outside React components)
 */
function getApiConnectionStore() {
  return useApiConnectionStore.getState();
}

/**
 * Callbacks to invoke when we discover a base URL needs /v1
 */
const v1DiscoveryCallbacks: Array<(baseUrl: string) => void> = [];

/**
 * Register a callback to be notified when we discover a base URL needs /v1
 */
export function onV1Discovery(callback: (baseUrl: string) => void): void {
  v1DiscoveryCallbacks.push(callback);
}

/**
 * Custom fetch that proxies localhost requests through Electron to avoid CORS
 * Supports both streaming and non-streaming requests
 * Falls back to native fetch for non-localhost URLs or when not in Electron
 * Automatically retries with /v1 for OpenAI-compatible endpoints
 *
 * This is a simple wrapper around fetchWithV1Retry that always uses electronAwareFetchInternal
 */
export async function electronAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetchWithV1Retry(input, init, electronAwareFetchInternal);
}

/**
 * Internal fetch implementation without retry logic
 */
async function electronAwareFetchInternal(
  url: string,
  init?: RequestInit
): Promise<Response> {

  // Check if we should proxy through Electron
  const shouldProxy =
    isElectronEnvironment() &&
    (url.includes("localhost") || url.includes("127.0.0.1") || url.includes("[::1]")) &&
    window.api?.httpProxy;

  if (shouldProxy) {
    try {
      // Convert Headers to plain object if necessary
      let headersObj: Record<string, string> | undefined;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          headersObj = {};
          init.headers.forEach((value, key) => {
            headersObj![key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          headersObj = Object.fromEntries(init.headers);
        } else {
          headersObj = init.headers as Record<string, string>;
        }
      }

      // Check if request expects streaming (AI SDK sets this header for SSE)
      const acceptHeader = headersObj?.['accept'] || headersObj?.['Accept'] || '';
      const isStreamRequest = acceptHeader.includes('text/event-stream') ||
                             acceptHeader.includes('text/plain') ||
                             url.includes('/chat/completions'); // Ollama streaming endpoint

      // Use streaming proxy if SSE is expected
      if (isStreamRequest) {
        const streamId = generateStreamId();

        // Create ReadableStream to return
        const stream = new ReadableStream({
          start(controller) {
            let isStreamClosed = false;
            const cleanupFunctions: Array<() => void> = [];
            let hasStartedSuccessfully = false;

            // Cleanup all listeners for this stream
            const cleanupListeners = () => {
              cleanupFunctions.forEach(cleanup => {
                try {
                  cleanup();
                } catch (error) {
                  console.error('[Electron Stream] Error cleaning up listener:', error);
                }
              });
              cleanupFunctions.length = 0; // Clear array
            };

            // Safe controller operations that prevent crashes
            const safeEnqueue = (chunk: Uint8Array) => {
              if (isStreamClosed) return;
              try {
                controller.enqueue(chunk);
              } catch (error) {
                console.error('[Electron Stream] Error enqueueing chunk:', error);
                isStreamClosed = true;
              }
            };

            const safeClose = () => {
              if (isStreamClosed) return;
              try {
                controller.close();
                isStreamClosed = true;
                cleanupListeners();
              } catch (error) {
                console.error('[Electron Stream] Error closing stream:', error);
                isStreamClosed = true;
              }
            };

            const safeError = (err: Error) => {
              if (isStreamClosed) return;
              try {
                controller.error(err);
                isStreamClosed = true;
                cleanupListeners();
              } catch (error) {
                console.error('[Electron Stream] Error erroring stream:', error);
                isStreamClosed = true;
              }
            };

            // Set up event listeners with error handling
            const cleanupChunk = window.api!.httpProxy!.onStreamChunk((data) => {
              try {
                if (data.streamId === streamId && !isStreamClosed) {
                  // Enqueue the chunk (SSE format: "data: {...}\n\n")
                  const encoder = new TextEncoder();
                  safeEnqueue(encoder.encode(`data: ${data.chunk}\n\n`));
                }
              } catch (error) {
                console.error('[Electron Stream] Error in onStreamChunk:', error);
                safeError(error instanceof Error ? error : new Error(String(error)));
              }
            });
            cleanupFunctions.push(cleanupChunk);

            const cleanupEnd = window.api!.httpProxy!.onStreamEnd((data) => {
              try {
                if (data.streamId === streamId) {
                  safeClose();
                }
              } catch (error) {
                console.error('[Electron Stream] Error in onStreamEnd:', error);
              }
            });
            cleanupFunctions.push(cleanupEnd);

            const cleanupError = window.api!.httpProxy!.onStreamError((data) => {
              try {
                if (data.streamId === streamId) {
                  safeError(new Error(data.error));
                }
              } catch (error) {
                console.error('[Electron Stream] Error in onStreamError:', error);
              }
            });
            cleanupFunctions.push(cleanupError);

            // Handle abort signal
            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                try {
                  window.api!.httpProxy!.streamAbort(streamId);
                  safeError(new DOMException('The operation was aborted', 'AbortError'));
                } catch (error) {
                  console.error('[Electron Stream] Error in abort handler:', error);
                }
              });
            }

            // Start the stream with error handling
            try {
              window.api!.httpProxy!.streamStart({
                streamId,
                url,
                method: init?.method || "POST",
                headers: headersObj,
                body: init?.body as any,
                timeout: 300000, // 5 minutes for streaming
              });
            } catch (error) {
              console.error('[Electron Stream] Error starting stream:', error);
              safeError(error instanceof Error ? error : new Error(String(error)));
            }
          },
        });

        // Return Response with ReadableStream body
        return new Response(stream, {
          status: 200,
          statusText: "OK",
          headers: new Headers({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }),
        });
      }

      // Non-streaming request: use original fetch implementation
      const abortPromise = init?.signal
        ? new Promise<never>((_, reject) => {
            init.signal!.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          })
        : null;

      const fetchPromise = window.api!.httpProxy!.fetch({
        url,
        method: init?.method || "GET",
        headers: headersObj,
        body: init?.body as any,
        timeout: 30000,
      });

      const proxyResponse = await (abortPromise
        ? Promise.race([fetchPromise, abortPromise])
        : fetchPromise);

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
  return fetch(url, init);
}

/**
 * Universal fetch with /v1 retry logic for OpenAI-compatible endpoints
 * Works in both browser and Electron environments
 *
 * @param input - The request URL or Request object
 * @param init - Optional fetch init options
 * @param customFetch - Optional custom fetch function (defaults to auto-detect Electron vs browser)
 */
async function fetchWithV1Retry(
  input: RequestInfo | URL,
  init?: RequestInit,
  customFetch?: (url: string, init?: RequestInit) => Promise<Response>
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const baseUrl = extractBaseUrl(url);

  // Build URLs to try
  const v1Url = addV1ToUrl(url);

  // For streaming requests, we can't retry after the Response is returned
  // So we need to try the user's URL as-is (they may have configured /v1 already)
  const isStreamingRequest =
    // Check for text/event-stream accept header
    (init?.headers &&
     (typeof init.headers === 'object') &&
     ('accept' in init.headers && (init.headers as any).accept?.includes('text/event-stream'))) ||
    // Check for stream: true in request body (handles both single and double quotes)
    (init?.body && typeof init.body === 'string' && /['"]stream['"]:\s*true/.test(init.body));

  // Determine the base fetch function to use
  // Priority: custom > Electron-aware > native fetch
  const baseFetch = customFetch || (isElectronEnvironment() ? electronAwareFetchInternal : fetch);

  // For streaming, use /v1 by default if no version tag exists
  // We can't reliably detect empty responses from 200 OK status without consuming the stream
  if (isStreamingRequest) {
    const finalUrl = v1Url || url; // Use /v1 if available (no existing version), otherwise original

    if (v1Url) {
      logger.info(`[Fetch Helper] Streaming request, using /v1 (no version tag in URL): ${finalUrl}`);
    } else {
      logger.info(`[Fetch Helper] Streaming request, using original URL (has version tag or not OpenAI-compatible): ${url}`);
    }

    return baseFetch(finalUrl, init);
  }

  // For non-streaming, use retry logic
  const urlsToTry: string[] = [];

  if (v1Url) {
    // ALWAYS try user's URL first (they might have configured /v2, /v4, etc.)
    // Only fallback to /v1 if user's URL fails
    urlsToTry.push(url);
    urlsToTry.push(v1Url);
  } else {
    // No /v1 variant available (not an OpenAI-compatible endpoint)
    urlsToTry.push(url);
  }

  let lastError: Error | null = null;

  for (let i = 0; i < urlsToTry.length; i++) {
    const tryUrl = urlsToTry[i];
    try {
      const response = await baseFetch(tryUrl, init);

      // Re-check if this specific URL is a streaming endpoint
      const isStreamingEndpointUrl =
        tryUrl.includes('/chat/completions') ||
        tryUrl.includes('/completions') ||
        tryUrl.includes('/embeddings');

      let hasContent = false;

      if (isStreamingEndpointUrl) {
        // For streaming endpoints, trust the status code only
        // Reading the body would consume the stream
        hasContent = response.ok;
      } else {
        // For non-streaming endpoints (like /models), validate body content
        try {
          const responseClone = response.clone();
          const contentType = response.headers.get('content-type');

          // For SSE, assume it has content if status is ok
          if (contentType?.includes('text/event-stream')) {
            hasContent = response.ok;
          } else {
            // Peek at the body to check if it has content
            const text = await responseClone.text();
            hasContent = text.length > 0;
          }
        } catch (error) {
          logger.warn(`[Fetch Helper] Error validating response content: ${error}`);
          hasContent = response.ok; // Fall back to just checking status
        }
      }

      // If successful (2xx status) AND has content, return immediately
      if (response.ok && hasContent) {
        // Success!
        if (v1Url && tryUrl === v1Url) {
          logger.info(`[Fetch Helper] Successfully used /v1 URL for: ${baseUrl}`);
        }
        return response;
      }

      // If response is OK but empty, treat it as failure
      if (response.ok && !hasContent) {
        logger.warn(`[Fetch Helper] Empty response body from: ${tryUrl}`);
      }

      // If 4xx/5xx error and we have another URL to try, continue to next attempt
      if (v1Url && tryUrl !== v1Url) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      // Last attempt or no v1 fallback available, return the error response
      logger.error(`[Fetch Helper] Request failed with status ${response.status}`);
      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`[Fetch Helper] Request exception: ${lastError.message}`);

      // If we have another URL to try, continue
      if (v1Url && tryUrl !== v1Url) {
        continue;
      }

      // Last attempt failed, throw the error
      throw lastError;
    }
  }

  // Should never reach here, but just in case
  logger.error(`[Fetch Helper] Unexpected error: no successful response`);
  throw lastError || new Error('All fetch attempts failed');
}

/**
 * Get the appropriate fetch function based on environment
 * Use this when creating AI SDK providers
 * ALWAYS returns a fetch with /v1 retry logic
 */
export function getAISDKFetch(): typeof fetch {
  return fetchWithV1Retry as typeof fetch;
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

    logger.info("[Fetch Helper] Global fetch override initialized for Electron environment");
  }
}
