/**
 * Enum for placeholder turn types
 * Used to identify and manage different types of placeholder content
 */
export enum PlaceholderType {
  IMAGE = 'image',
  VIDEO = 'video',
}

/**
 * Content prefixes for placeholder turns
 * These are used in the UI to display appropriate status messages
 */
export const PlaceholderContent = {
  [PlaceholderType.IMAGE]: 'Generating image...',
  [PlaceholderType.VIDEO]: 'Generating video...',
} as const;

/**
 * Type guard to check if a string is a valid PlaceholderType
 */
export function isPlaceholderType(value: string): value is PlaceholderType {
  return Object.values(PlaceholderType).includes(value as PlaceholderType);
}

/**
 * Get placeholder content for a given type
 */
export function getPlaceholderContent(type: PlaceholderType): string {
  return PlaceholderContent[type];
}