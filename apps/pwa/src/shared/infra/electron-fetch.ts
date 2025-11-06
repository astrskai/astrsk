import { isElectronEnvironment } from "@/shared/lib/environment";

/**
 * Generate unique stream ID
 */
function generateStreamId(): string {
  return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Custom fetch that proxies localhost requests through Electron to avoid CORS
 * Supports both streaming and non-streaming requests
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
