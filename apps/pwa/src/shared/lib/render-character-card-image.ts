/**
 * Canvas-based character card image renderer
 *
 * Renders a character card preview image matching the CharacterCard component design
 * Used for generating default images when exporting cards without uploaded images
 */

export interface CharacterCardRenderData {
  name: string;
  summary?: string;
  tags?: string[];
  tokenCount?: number;
}

// Match the CharacterCard component dimensions
const CARD_WIDTH = 320;
const CARD_HEIGHT = 480; // Matches min-h-[380px] but taller for better proportions
const IMAGE_HEIGHT = 340; // Taller image area to push content down
const CONTENT_OVERLAP = 48; // -mt-12 = 48px overlap
const PADDING = 16; // p-4 = 16px

// Default placeholder image path
const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-placeholder.png";

// Colors matching the CharacterCard component (zinc color palette)
const COLORS = {
  background: "#18181b", // zinc-900
  imageBackground: "#27272a", // zinc-800
  border: "#3f3f46", // zinc-700
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa", // zinc-400
  textMuted: "#71717a", // zinc-500
  tagBackground: "rgba(39, 39, 42, 0.8)", // zinc-800/80
  tagBorder: "rgba(63, 63, 70, 0.5)", // zinc-700/50
  gradientStart: "rgba(24, 24, 27, 0)",
  gradientEnd: "rgba(24, 24, 27, 0.9)",
};

/**
 * Loads an image from URL and returns an HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Renders a character card to a canvas and returns as a PNG Blob
 */
export async function renderCharacterCardImage(
  data: CharacterCardRenderData,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Load placeholder image
  let placeholderImage: HTMLImageElement | null = null;
  try {
    placeholderImage = await loadImage(PLACEHOLDER_IMAGE_URL);
  } catch (error) {
    console.warn("[renderCharacterCardImage] Failed to load placeholder image, using fallback");
  }

  // Draw card background
  drawCardBackground(ctx);

  // Draw image area with placeholder
  drawImageArea(ctx, placeholderImage);

  // Draw content area
  drawContentArea(ctx, data);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      "image/png",
      1.0,
    );
  });
}

function drawCardBackground(ctx: CanvasRenderingContext2D) {
  // Draw rounded rectangle background
  const radius = 12;
  ctx.fillStyle = COLORS.background;
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, radius);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawImageArea(ctx: CanvasRenderingContext2D, placeholderImage: HTMLImageElement | null) {
  // Clip to rounded corners at top
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_WIDTH, IMAGE_HEIGHT, [12, 12, 0, 0]);
  ctx.clip();

  // Draw image background
  ctx.fillStyle = COLORS.imageBackground;
  ctx.fillRect(0, 0, CARD_WIDTH, IMAGE_HEIGHT);

  if (placeholderImage) {
    // Draw the placeholder image with object-cover behavior
    const imgAspect = placeholderImage.width / placeholderImage.height;
    const areaAspect = CARD_WIDTH / IMAGE_HEIGHT;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (imgAspect > areaAspect) {
      // Image is wider than area - fit height, crop width
      drawHeight = IMAGE_HEIGHT;
      drawWidth = IMAGE_HEIGHT * imgAspect;
      drawX = (CARD_WIDTH - drawWidth) / 2;
      drawY = 0;
    } else {
      // Image is taller than area - fit width, crop height
      drawWidth = CARD_WIDTH;
      drawHeight = CARD_WIDTH / imgAspect;
      drawX = 0;
      drawY = (IMAGE_HEIGHT - drawHeight) / 2;
    }

    ctx.drawImage(placeholderImage, drawX, drawY, drawWidth, drawHeight);
  } else {
    // Fallback: draw a simple icon if image fails to load
    const centerX = CARD_WIDTH / 2;
    const centerY = IMAGE_HEIGHT / 2;
    ctx.fillStyle = "#97A2B1";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", centerX, centerY);
  }

  ctx.restore();

  // Draw gradient overlay at bottom of image area (for text readability)
  const gradient = ctx.createLinearGradient(0, IMAGE_HEIGHT - 100, 0, IMAGE_HEIGHT);
  gradient.addColorStop(0, COLORS.gradientStart);
  gradient.addColorStop(1, COLORS.gradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, IMAGE_HEIGHT - 100, CARD_WIDTH, 100);
}

function drawContentArea(
  ctx: CanvasRenderingContext2D,
  data: CharacterCardRenderData,
) {
  // Content starts overlapping the image by 48px (-mt-12)
  const contentStartY = IMAGE_HEIGHT - CONTENT_OVERLAP;
  let currentY = contentStartY;

  // Draw name (bold, 20px, white with drop shadow effect)
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Add subtle shadow for text over image
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  const nameLines = wrapText(ctx, data.name, CARD_WIDTH - PADDING * 2, 2);
  nameLines.forEach((line) => {
    ctx.fillText(line, PADDING, currentY);
    currentY += 24;
  });

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  currentY += 4; // mb-1 equivalent

  // Draw tags
  if (data.tags && data.tags.length > 0) {
    currentY = drawTags(ctx, data.tags, PADDING, currentY);
  } else {
    // "No tags" placeholder
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("No tags", PADDING, currentY);
    currentY += 18;
  }

  currentY += 16; // mb-4 equivalent

  // Draw summary
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const summary = data.summary || "No summary";
  const summaryLines = wrapText(ctx, summary, CARD_WIDTH - PADDING * 2, 3);
  summaryLines.forEach((line) => {
    ctx.fillText(line, PADDING, currentY);
    currentY += 18; // leading-relaxed
  });

  // Draw bottom stats area (fixed at bottom)
  const statsY = CARD_HEIGHT - 24;

  // Draw separator line
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, statsY - 12);
  ctx.lineTo(CARD_WIDTH - PADDING, statsY - 12);
  ctx.stroke();

  // Draw token count
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`${data.tokenCount ?? 0} Tokens`, PADDING, statsY);
}

function drawTags(
  ctx: CanvasRenderingContext2D,
  tags: string[],
  startX: number,
  startY: number,
): number {
  ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "top";

  let x = startX;
  const tagPaddingX = 6;
  const tagPaddingY = 4;
  const tagHeight = 18;
  const tagGap = 8;
  const maxWidth = CARD_WIDTH - startX * 2;
  const maxTags = 3;

  const displayTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;

  displayTags.forEach((tag) => {
    const metrics = ctx.measureText(tag);
    const tagWidth = metrics.width + tagPaddingX * 2;

    // Check if tag fits in current row
    if (x + tagWidth > maxWidth + startX) {
      return; // Skip if doesn't fit
    }

    // Draw tag background
    ctx.fillStyle = COLORS.tagBackground;
    ctx.strokeStyle = COLORS.tagBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, startY, tagWidth, tagHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Draw tag text
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText(tag, x + tagPaddingX, startY + tagPaddingY);

    x += tagWidth + tagGap;
  });

  // Draw "+N" badge if there are more tags
  if (remainingCount > 0) {
    const moreText = `+${remainingCount}`;
    const metrics = ctx.measureText(moreText);
    const tagWidth = metrics.width + tagPaddingX * 2;

    if (x + tagWidth <= maxWidth + startX) {
      ctx.fillStyle = COLORS.tagBackground;
      ctx.strokeStyle = COLORS.tagBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, startY, tagWidth, tagHeight, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLORS.textSecondary;
      ctx.fillText(moreText, x + tagPaddingX, startY + tagPaddingY);
    }
  }

  return startY + tagHeight;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length >= maxLines) {
        // Add ellipsis to last line
        const lastLine = lines[lines.length - 1];
        const ellipsisLine = lastLine + "...";
        const ellipsisMetrics = ctx.measureText(ellipsisLine);

        if (ellipsisMetrics.width <= maxWidth) {
          lines[lines.length - 1] = ellipsisLine;
        } else {
          // Truncate last line to fit ellipsis
          let truncated = lastLine;
          while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          lines[lines.length - 1] = truncated + "...";
        }
        return lines.slice(0, maxLines);
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}
