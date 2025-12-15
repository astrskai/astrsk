/**
 * WebP conversion utilities for cloud uploads
 *
 * Note: This is a standalone utility separate from Asset.createFromFile()
 * because cloud uploads need to convert already-saved assets from OPFS.
 */

/**
 * Converts an image file to WebP format
 * @param file The image file to convert
 * @param quality Quality of the WebP image (0-1), defaults based on input type
 * @returns A Promise that resolves to a new File in WebP format
 */
export async function convertToWebp(
  file: File,
  quality?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Check if file is a video
    const isVideo =
      file.type.startsWith("video/") ||
      file.name.toLowerCase().endsWith(".mp4") ||
      file.name.toLowerCase().endsWith(".webm") ||
      file.name.toLowerCase().endsWith(".ogg") ||
      file.name.toLowerCase().endsWith(".mov") ||
      file.name.toLowerCase().endsWith(".avi");

    // Only process image files, skip videos and other file types
    if (!file.type.startsWith("image/") || isVideo) {
      return resolve(file); // Return original file if not an image or if it's a video
    }

    // Set quality based on file type if not explicitly provided
    if (quality === undefined) {
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        quality = 0.8;
      } else if (file.type === "image/png") {
        quality = 1.0; // Use lossless quality for PNG to preserve transparency/quality
      } else {
        quality = 0.8; // Default for other image formats
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Clean up image reference
          img.src = "";
          return reject(new Error("Could not get canvas context"));
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            // Clean up references after blob creation
            img.src = "";
            canvas.width = 0;
            canvas.height = 0;

            if (!blob) {
              return reject(new Error("Failed to convert to WebP"));
            }

            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" },
            );
            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => {
        // Clean up on error
        img.src = "";
        reject(new Error("Failed to load image"));
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file should be converted to WebP
 * Returns true for image files that aren't already WebP
 */
export function shouldConvertToWebp(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const isImage = mimeType.startsWith('image/');
  const isAlreadyWebp = mimeType === 'image/webp';

  // Also skip videos
  const isVideo = mimeType.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.avi');

  return isImage && !isAlreadyWebp && !isVideo;
}

/**
 * Convert image to WebP if needed, otherwise return original file
 *
 * This is the main function to use in cloud upload pipelines.
 * It automatically checks if conversion is needed.
 */
export async function maybeConvertToWebp(
  file: File,
  quality?: number
): Promise<File> {
  if (shouldConvertToWebp(file)) {
    try {
      return await convertToWebp(file, quality);
    } catch (error) {
      console.warn('Failed to convert to WebP, using original file:', error);
      return file;
    }
  }
  return file;
}
