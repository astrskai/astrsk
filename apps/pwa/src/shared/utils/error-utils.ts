import { AISDKError, APICallError } from "ai";
import { ZodError } from "zod";

import { Result } from "@/shared/core";
import { logger } from "@/shared/utils/logger";

export function formatErrorMessage(message: string, error?: unknown): string {
  return `${message}${
    error ? `: ${error instanceof Error ? error.message : String(error)}` : ""
  }`;
}

// TODO: refactor, replace to Result.fail(formatErrorMessage(message, error)) (https://github.com/harpychat/h2o-app-nextjs/pull/33#discussion_r1801606553)
export function formatFail<T>(message: string, error?: unknown): Result<T> {
  return Result.fail<T>(formatErrorMessage(message, error));
}

export function formatError(message: string, error?: unknown): Error {
  return new Error(formatErrorMessage(message, error));
}

export function parseAiSdkErrorMessage(error: unknown): {
  message: string;
  raw: string;
} | null {
  let message = String(error);
  const raw = JSON.stringify(error);

  if (APICallError.isInstance(error)) {
    // APICallError
    message = error.message;
    if (!message) {
      const responseBody = JSON.parse(error.responseBody ?? "{}");
      message = responseBody.error.message;
    }
  } else if (AISDKError.isInstance(error)) {
    // AISDKError
    message = error.message;

    // AISDKError with value.error.message
    if (
      "value" in error &&
      error.value &&
      typeof error.value === "object" &&
      "error" in error.value &&
      error.value.error &&
      typeof error.value.error === "object" &&
      "message" in error.value.error &&
      error.value.error.message &&
      typeof error.value.error.message === "string"
    ) {
      message = error.value.error.message;

      // AISDKError with value.error.metadata.raw.error.message
      if (
        "metadata" in error.value.error &&
        error.value.error.metadata &&
        typeof error.value.error.metadata === "object" &&
        "raw" in error.value.error.metadata &&
        error.value.error.metadata.raw &&
        typeof error.value.error.metadata.raw === "string"
      ) {
        try {
          const rawJson = JSON.parse(error.value.error.metadata.raw);
          if (
            rawJson &&
            typeof rawJson === "object" &&
            "error" in rawJson &&
            rawJson.error &&
            typeof rawJson.error === "object" &&
            "message" in rawJson.error &&
            rawJson.error.message &&
            typeof rawJson.error.message === "string"
          ) {
            message = rawJson.error.message;
          }
        } catch (e) {
          logger.error("Failed to parse error metadata", e);
        }
      }
    } else if (error.cause && error.cause instanceof ZodError) {
      // AISDKError with ZodError
      message = "Invalid response from provider.";
    }
  } else {
    return null;
  }

  return {
    message,
    raw,
  };
}
