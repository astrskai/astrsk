import { ipcMain } from "electron";
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

  console.log("[Electron] HTTP Proxy initialized for CORS-free localhost access");
}
