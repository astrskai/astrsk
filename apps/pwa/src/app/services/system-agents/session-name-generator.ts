/**
 * Session Name Generator
 *
 * Generates a concise, engaging session name based on the scenario.
 */

import { generateText } from "ai";

import { useModelStore, getAstrskAiModel, SPECIFIC_MODELS } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

/**
 * Generate a session name from a scenario description.
 * Uses the lite model for fast, cost-effective generation.
 *
 * @param scenario - The scenario description
 * @returns A short, engaging session name (2-5 words)
 */
export async function generateSessionName(scenario: string): Promise<string> {
  try {
    // Get Gemini 2.5 Flash model specifically for session creation
    const geminiFlashModel = await getAstrskAiModel(SPECIFIC_MODELS.SESSION_CREATION);

    if (!geminiFlashModel) {
      logger.warn("[SessionNameGenerator] Gemini 2.5 Flash not available, using fallback name");
      return generateFallbackName(scenario);
    }

    const modelSelection = geminiFlashModel;

    const connectionResult = await ApiService.getApiConnection.execute(
      new UniqueEntityID(modelSelection.apiConnectionId)
    );

    if (connectionResult.isFailure) {
      logger.warn("[SessionNameGenerator] Failed to get API connection, using fallback name");
      return generateFallbackName(scenario);
    }

    const apiConnection = connectionResult.getValue();

    if (!apiConnection) {
      logger.warn("[SessionNameGenerator] API connection not found, using fallback name");
      return generateFallbackName(scenario);
    }

    const model = createLiteModel(
      apiConnection.source,
      modelSelection.modelId,
      apiConnection.apiKey || "",
      apiConnection.baseUrl
    );

    const systemPrompt = `You are a creative title generator. Generate short, engaging session names (2-5 words) based on scenarios.

Rules:
- Keep it concise (2-5 words)
- Make it engaging and descriptive
- Capture the essence of the scenario
- Use title case
- No quotation marks
- Examples: "Mountain Quest", "Café Romance", "Mystery at Midnight"`;

    const userPrompt = `Generate a session name for this scenario:

${scenario}

Return ONLY the name, nothing else.`;

    const result = await generateText({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let name = result.text.trim().replace(/^["']|["']$/g, ""); // Remove quotes if present

    // Truncate to maximum 7 words if too long
    const words = name.split(/\s+/);
    const MAX_WORDS = 7;

    if (words.length > MAX_WORDS) {
      name = words.slice(0, MAX_WORDS).join(" ");
    }

    return name;

  } catch (error) {
    logger.error("[SessionNameGenerator] Error generating session name", {
      error: error instanceof Error ? error.message : String(error),
      scenario: scenario.substring(0, 100),
    });
    return generateFallbackName(scenario);
  }
}

/**
 * Generate a fallback name from the scenario by extracting key words.
 */
function generateFallbackName(scenario: string): string {
  // Take first 5 words and capitalize
  const words = scenario
    .split(/\s+/)
    .filter((w) => w.length > 2) // Skip short words
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  if (words.length === 0) {
    return "New Session";
  }

  const name = words.join(" ");

  // Truncate if too long
  if (name.length > 50) {
    return name.substring(0, 47) + "...";
  }

  return name;
}
