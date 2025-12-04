/**
 * Canvas-based scenario card image renderer
 *
 * Renders a scenario card preview image matching the ScenarioCard component design
 * Used for generating default images when exporting cards without uploaded images
 */

export interface ScenarioCardRenderData {
  title: string;
  summary?: string;
  tags?: string[];
  tokenCount?: number;
  firstMessages?: number;
}

// Match the ScenarioCard component dimensions
const CARD_WIDTH = 320;
const CARD_HEIGHT = 420; // Matches min-h-[340px] but taller for better proportions
const IMAGE_HEIGHT = 200; // h-40 = 160px, but taller for export
const PADDING = 16; // p-4 = 16px

// Default placeholder image path
const PLACEHOLDER_IMAGE_URL = "/default/card/GM_ Dice of Fate.png";

// Colors matching the ScenarioCard component (zinc color palette)
const COLORS = {
  background: "#18181b", // zinc-900
  imageBackground: "#27272a", // zinc-800
  border: "#3f3f46", // zinc-700
  textPrimary: "#f4f4f5", // zinc-100
  textSecondary: "#a1a1aa", // zinc-400
  textMuted: "#71717a", // zinc-500
  tagBackground: "#27272a", // zinc-800
  purple: "rgba(192, 132, 252, 0.8)", // purple-400/80
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
 * Renders a scenario card to a canvas and returns as a PNG Blob
 */
export async function renderScenarioCardImage(
  data: ScenarioCardRenderData,
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
    console.warn("[renderScenarioCardImage] Failed to load placeholder image, using fallback");
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
    ctx.fillStyle = "#a78bfa"; // purple-400
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📜", centerX, centerY);
  }

  // Dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, CARD_WIDTH, IMAGE_HEIGHT);

  ctx.restore();
}

function drawContentArea(
  ctx: CanvasRenderingContext2D,
  data: ScenarioCardRenderData,
) {
  let currentY = IMAGE_HEIGHT + PADDING;

  // Draw title (bold, 18px, zinc-100)
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const titleLines = wrapText(ctx, data.title, CARD_WIDTH - PADDING * 2, 2);
  titleLines.forEach((line) => {
    ctx.fillText(line, PADDING, currentY);
    currentY += 22;
  });

  currentY += 8; // mb-2 equivalent

  // Draw summary
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const summary = data.summary || "No summary";
  const summaryLines = wrapText(ctx, summary, CARD_WIDTH - PADDING * 2, 3);
  summaryLines.forEach((line) => {
    ctx.fillText(line, PADDING, currentY);
    currentY += 16;
  });

  currentY += 16; // mb-4 equivalent

  // Draw tags
  if (data.tags && data.tags.length > 0) {
    currentY = drawTags(ctx, data.tags, PADDING, currentY);
  } else {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("No tags", PADDING, currentY);
    currentY += 16;
  }

  // Draw bottom stats area (fixed at bottom)
  const statsY = CARD_HEIGHT - 24;

  // Draw separator line
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, statsY - 12);
  ctx.lineTo(CARD_WIDTH - PADDING, statsY - 12);
  ctx.stroke();

  // Draw first messages count (purple)
  ctx.fillStyle = COLORS.purple;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`💬 ${data.firstMessages ?? 0} First messages`, PADDING, statsY);

  // Draw token count (right aligned)
  ctx.fillStyle = COLORS.textMuted;
  const tokenText = `${data.tokenCount ?? 0} Tokens`;
  const tokenWidth = ctx.measureText(tokenText).width;
  ctx.fillText(tokenText, CARD_WIDTH - PADDING - tokenWidth, statsY);
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
  const tagHeight = 16;
  const tagGap = 6;
  const maxWidth = CARD_WIDTH - startX * 2;
  const maxTags = 3;

  const displayTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;

  displayTags.forEach((tag) => {
    const metrics = ctx.measureText(tag);
    const tagWidth = metrics.width + tagPaddingX * 2;

    if (x + tagWidth > maxWidth + startX) {
      return;
    }

    // Draw tag background
    ctx.fillStyle = COLORS.tagBackground;
    ctx.beginPath();
    ctx.roundRect(x, startY, tagWidth, tagHeight, 4);
    ctx.fill();

    // Draw tag text
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(tag, x + tagPaddingX, startY + tagPaddingY);

    x += tagWidth + tagGap;
  });

  if (remainingCount > 0) {
    const moreText = `+${remainingCount}`;
    const metrics = ctx.measureText(moreText);
    const tagWidth = metrics.width + tagPaddingX * 2;

    if (x + tagWidth <= maxWidth + startX) {
      ctx.fillStyle = COLORS.tagBackground;
      ctx.beginPath();
      ctx.roundRect(x, startY, tagWidth, tagHeight, 4);
      ctx.fill();

      ctx.fillStyle = COLORS.textMuted;
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
        const lastLine = lines[lines.length - 1];
        const ellipsisLine = lastLine + "...";
        const ellipsisMetrics = ctx.measureText(ellipsisLine);

        if (ellipsisMetrics.width <= maxWidth) {
          lines[lines.length - 1] = ellipsisLine;
        } else {
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
