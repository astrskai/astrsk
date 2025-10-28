import { Card } from "@/entities/card/domain";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";

/**
 * Enhances the user's image prompt with card context data
 * @param userPrompt The original prompt from the user
 * @param card The card object to add context from
 * @returns The enhanced prompt with card data context
 */
export function enhancePromptWithCardContext(userPrompt: string, card?: Card | null): string {
  if (!card) {
    return userPrompt;
  }

  // Convert card to JSON using drizzle mapper
  const cardJson = CardDrizzleMapper.toPersistence(card);
  
  // Add card context to prompt
  return `This is the card data in JSON format:
${JSON.stringify(cardJson, null, 2)}

Based on this card data and the user's request, generate an image: ${userPrompt}`;
}