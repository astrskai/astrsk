import { formatError } from "@/shared/utils/error-utils";

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
 * Sanitizes a file name to ensure it's safe for all file systems
 * Removes or replaces invalid characters and ensures valid length
 * WARNING: Only use this for file names, NOT full paths!
 * @param fileName The raw file name to sanitize
 * @returns A sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Replace invalid characters with underscores
  // This handles Windows, macOS, Linux, and web restrictions
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") // Remove characters illegal in Windows and others
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/\.+$/g, "") // Remove trailing periods (illegal in Windows)
    .replace(/^\.+/g, "") // Remove leading periods (can hide files in Unix)
    .replace(/_+/g, "_") // Collapse multiple underscores
    .trim();

  // Ensure the name isn't blank
  if (!sanitized) {
    return "untitled";
  }

  // Limit maximum length (Windows has 255 char limit for path components)
  // Using 100 as a safe limit
  return sanitized.slice(0, 100).toLowerCase();
}

export function humanizeBytes(bytes: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Bytes";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}
