export const STYLE_OPTIONS = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "artistic", label: "Artistic" },
  { value: "cartoon", label: "Cartoon" },
  { value: "anime", label: "Anime" },
  { value: "oil painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
  { value: "digital art", label: "Digital Art" },
  { value: "vintage", label: "Vintage" },
  { value: "minimalist", label: "Minimalist" },
  { value: "abstract", label: "Abstract" },
] as const;

export const ASPECT_RATIO_OPTIONS = [
  { value: "2:3", label: "Card Size (2:3)" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Classic (4:3)" },
  { value: "3:4", label: "Portrait Classic (3:4)" },
  { value: "2:1", label: "Panoramic (2:1)" },
  { value: "1:2", label: "Tall Portrait (1:2)" },
] as const;

export const VIDEO_SETTINGS = {
  MIN_DURATION: 3,
  MAX_DURATION: 12,
  DEFAULT_DURATION: 3,
  POLLING_INTERVAL: 5000, // 5 seconds
} as const;

export const IMAGE_COMPRESSION = {
  MAX_SIZE: 256 * 4, // For base64 conversion
  JPEG_QUALITY: 0.1, // For compression
} as const;

export const GALLERY_LAYOUT = {
  IMAGE_HEIGHT: 128, // h-32 for each image
  MAX_ROWS: 3,
  FIXED_HEIGHT: 384, // 3 rows * 128px
} as const;