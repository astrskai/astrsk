/**
 * Utility functions for parsing card panel IDs
 * 
 * Card panel ID format: "{panelType}-{cardId}"
 * Examples:
 * - "metadata-01980d03-060b-7cc4-b3bf-4a0535619810"
 * - "character-info-01980d03-060b-7cc4-b3bf-4a0535619810"
 * - "card-panel-main" (special case, no card ID)
 */

// UUID pattern for validation
const UUID_PATTERN = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

/**
 * Extract panel type from a card panel ID
 * @param panelId - The panel ID to parse
 * @param cardId - Optional card ID for validation
 * @returns The panel type (e.g., "metadata", "character-info", "plot-info")
 */
export function extractCardPanelType(panelId: string, cardId?: string): string {
  // Handle special cases
  if (panelId === 'card-panel-main') {
    return 'card-panel-main';
  }

  // If we have a cardId, try the fast approach first
  if (cardId && panelId.endsWith(cardId)) {
    const uuidLength = 36; // UUID is always 36 characters
    return panelId.slice(0, -(uuidLength + 1)); // +1 for the hyphen before UUID
  }

  // Fallback: use regex approach to find the UUID
  const parts = panelId.split('-');
  
  // Find where the card ID starts by looking for UUID pattern
  for (let i = 1; i < parts.length; i++) {
    const remainingParts = parts.slice(i).join('-');
    if (UUID_PATTERN.test(remainingParts)) {
      // Found the card ID, everything before is the panel type
      return parts.slice(0, i).join('-');
    }
  }

  // Final fallback: assume first part is the panel type
  return parts[0];
}

/**
 * Extract card ID from a card panel ID
 * @param panelId - The panel ID to parse
 * @returns The card ID if found, undefined otherwise
 */
export function extractCardIdFromPanelId(panelId: string): string | undefined {
  // Handle special cases
  if (panelId === 'card-panel-main') {
    return undefined;
  }

  const parts = panelId.split('-');
  
  // Find where the card ID starts by looking for UUID pattern
  for (let i = 1; i < parts.length; i++) {
    const remainingParts = parts.slice(i).join('-');
    if (UUID_PATTERN.test(remainingParts)) {
      return remainingParts;
    }
  }

  return undefined;
}

/**
 * Check if a panel ID belongs to a specific card
 * @param panelId - The panel ID to check
 * @param cardId - The card ID to match against
 * @returns True if the panel belongs to the card
 */
export function isCardPanel(panelId: string, cardId: string): boolean {
  const extractedCardId = extractCardIdFromPanelId(panelId);
  return extractedCardId === cardId;
}

/**
 * Create a card panel ID from panel type and card ID
 * @param panelType - The panel type (e.g., "metadata", "character-info")
 * @param cardId - The card ID
 * @returns The formatted panel ID
 */
export function createCardPanelId(panelType: string, cardId: string): string {
  return `${panelType}-${cardId}`;
}