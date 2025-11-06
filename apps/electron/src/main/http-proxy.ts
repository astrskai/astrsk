import { ipcMain, IpcMainEvent } from "electron";
import { HTTP_PROXY_CHANNEL } from "../shared/ipc-channels";

interface ProxyRequestOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ProxyResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
}

interface StreamRequestOptions {
  streamId: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * Initialize HTTP proxy for CORS-free localhost API access
 * Allows PWA to make requests to localhost services (Ollama, LMStudio, etc)
 * without browser CORS restrictions
 */
export function initHttpProxy(): void {
  ipcMain.handle(
    HTTP_PROXY_CHANNEL.FETCH,
    async (_, options: ProxyRequestOptions): Promise<ProxyResponse> => {
      const { url, method, headers, body, timeout = 30000 } = options;

      // Security: Only allow localhost URLs to prevent proxy abuse
      const urlObj = new URL(url);
      const isLocalhost =
        urlObj.hostname === "localhost" ||
        urlObj.hostname === "127.0.0.1" ||
        urlObj.hostname === "::1" ||
        urlObj.hostname === "0.0.0.0";

      if (!isLocalhost) {
        throw new Error(`HTTP Proxy Error: Only localhost URLs are allowed, got: ${urlObj.hostname}`);
      }

      try {
        // Use Node.js fetch (available in Node 18+)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Prepare body - only stringify if it's not already a string
        let requestBody: string | undefined;
        if (body) {
          requestBody = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Extract response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Parse response data based on content type
        let data: any;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else if (contentType?.includes("text/")) {
          data = await response.text();
        } else {
          // For binary data, convert to base64
          const buffer = await response.arrayBuffer();
          data = Buffer.from(buffer).toString("base64");
        }

        return {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: responseHeaders,
        };
      } catch (error: any) {
        // Handle timeout and network errors
        if (error.name === "AbortError") {
          throw new Error(`HTTP Proxy Timeout: Request to ${url} exceeded ${timeout}ms`);
        }
        throw new Error(`HTTP Proxy Error: ${error.message}`);
      }
    }
  );

  // Track active streams for abort support
  const activeStreams = new Map<string, AbortController>();

  /**
   * Handle streaming requests (SSE from Ollama)
   */
  ipcMain.on(
    HTTP_PROXY_CHANNEL.STREAM_START,
    async (event: IpcMainEvent, options: StreamRequestOptions) => {
      const { streamId, url, method, headers, body, timeout = 30000 } = options;

      // Security: Only allow localhost URLs
      const urlObj = new URL(url);
      const isLocalhost =
        urlObj.hostname === "localhost" ||
        urlObj.hostname === "127.0.0.1" ||
        urlObj.hostname === "::1" ||
        urlObj.hostname === "0.0.0.0";

      if (!isLocalhost) {
        event.sender.send(HTTP_PROXY_CHANNEL.STREAM_ERROR, {
          streamId,
          error: `HTTP Proxy Error: Only localhost URLs are allowed, got: ${urlObj.hostname}`,
        });
        return;
      }

      try {
        // Create abort controller for this stream
        const controller = new AbortController();
        activeStreams.set(streamId, controller);

        // Set timeout
        const timeoutId = setTimeout(() => {
          controller.abort();
          activeStreams.delete(streamId);
        }, timeout);

        // Prepare body
        let requestBody: string | undefined;
        if (body) {
          requestBody = typeof body === 'string' ? body : JSON.stringify(body);
        }

        // Make request
        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Send response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Check if response is SSE
        const contentType = response.headers.get("content-type");
        if (!response.body) {
          throw new Error("Response body is null");
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send final buffer if exists
              if (buffer.trim()) {
                event.sender.send(HTTP_PROXY_CHANNEL.STREAM_CHUNK, {
                  streamId,
                  chunk: buffer,
                  headers: responseHeaders,
                  status: response.status,
                  statusText: response.statusText,
                });
              }
              break;
            }

            // Decode chunk
            buffer += decoder.decode(value, { stream: true });

            // Parse SSE format: lines starting with "data: "
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6); // Remove "data: " prefix
                if (data.trim() === "[DONE]") {
                  // OpenAI/Ollama completion signal
                  continue;
                }

                event.sender.send(HTTP_PROXY_CHANNEL.STREAM_CHUNK, {
                  streamId,
                  chunk: data,
                  headers: responseHeaders,
                  status: response.status,
                  statusText: response.statusText,
                });
              }
            }
          }

          // Stream complete
          event.sender.send(HTTP_PROXY_CHANNEL.STREAM_END, { streamId });
        } catch (error: any) {
          if (error.name === "AbortError") {
            event.sender.send(HTTP_PROXY_CHANNEL.STREAM_ERROR, {
              streamId,
              error: "Stream aborted",
            });
          } else {
            throw error;
          }
        } finally {
          activeStreams.delete(streamId);
        }
      } catch (error: any) {
        activeStreams.delete(streamId);

        if (error.name === "AbortError") {
          event.sender.send(HTTP_PROXY_CHANNEL.STREAM_ERROR, {
            streamId,
            error: `HTTP Proxy Timeout: Request to ${url} exceeded ${timeout}ms`,
          });
        } else {
          event.sender.send(HTTP_PROXY_CHANNEL.STREAM_ERROR, {
            streamId,
            error: `HTTP Proxy Error: ${error.message}`,
          });
        }
      }
    }
  );

  /**
   * Handle stream abort requests
   */
  ipcMain.on(HTTP_PROXY_CHANNEL.STREAM_ABORT, (_, { streamId }: { streamId: string }) => {
    const controller = activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      activeStreams.delete(streamId);
    }
  });

  console.log("[Electron] HTTP Proxy initialized for CORS-free localhost access");
}
