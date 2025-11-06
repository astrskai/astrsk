import axios, { AxiosError, AxiosInstance } from "axios";
import { isElectronEnvironment } from "@/shared/lib/environment";

export type HttpClient = AxiosInstance;

export const httpClient = axios.create({
  timeout: 30000,
});

// Add Electron proxy interceptor for localhost URLs to avoid CORS
if (isElectronEnvironment()) {
  httpClient.interceptors.request.use(async (config) => {
    const url = config.url || "";

    // Proxy localhost/127.0.0.1/[::1] requests through Electron to avoid CORS
    if ((url.includes("localhost") || url.includes("127.0.0.1") || url.includes("[::1]")) && window.api?.httpProxy) {
      try {
        const response = await window.api.httpProxy.fetch({
          url,
          method: config.method?.toUpperCase() || "GET",
          headers: config.headers as Record<string, string>,
          body: config.data,
          timeout: config.timeout,
        });

        // Convert proxy response to axios-compatible format
        // Reject with special marker to handle in response interceptor
        return Promise.reject({
          _isProxied: true,
          response,
          config,
        });
      } catch (error: any) {
        // If proxy fails, fall back to normal axios request
        console.warn("Electron proxy failed, falling back to direct request:", error);
      }
    }

    return config;
  });

  // Handle proxied responses
  httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if this is a proxied response (not an actual error)
      if (error._isProxied && error.response) {
        // Return proxied response as successful axios response
        return Promise.resolve({
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          config: error.config,
        });
      }
      // Otherwise, propagate the actual error
      return Promise.reject(error);
    }
  );
}

export const isHttpError = (error: any): error is AxiosError<any, any> => {
  return axios.isAxiosError(error);
};
