import { formatError } from "@/shared/lib/error-utils";

export function readFileToString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

export function downloadFile(file: File): void {
  const url = window.URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// Source: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
export async function getFileHash(file: File): Promise<string> {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw formatError("File size is too large");
    }

    // Get SHA-256 hash
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw formatError("Failed to get file hash", error);
  }
}

/**
 * Sanitizes a string to snake_case for use as variable/field names in templates.
 * Only allows lowercase letters, numbers, and underscores.
 * @param name The raw name to sanitize
 * @returns A valid snake_case name
 */
export function sanitizeFileName(name: string): string {
  const sanitized = name
    .replace(/[']/g, "") // Remove apostrophes (e.g., "Ring's" -> "Rings")
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove all other special characters
    .replace(/[\s-]+/g, "_") // Replace spaces and hyphens with underscores
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Handle camelCase -> snake_case
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .toLowerCase();

  // Ensure the name isn't blank
  if (!sanitized) {
    return "field";
  }

  // Limit maximum length
  return sanitized.slice(0, 100);
}

export function humanizeBytes(bytes: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Bytes";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}
