/**
 * Flow Template Matcher Service
 *
 * Uses AI to analyze the scenario and select the best matching flow template.
 * Returns the selected template or falls back to Simple_vf.json.
 */

import { generateText } from "ai";
import { useModelStore, type DefaultModelSelection } from "@/shared/stores/model-store";
import { ApiService } from "@/app/services/api-service";
import { createLiteModel } from "@/app/services/ai-model-factory";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

/**
 * Available flow templates
 */
export const FLOW_TEMPLATES = [
  {
    name: "Simple",
    filename: "Simple_vf.json",
    description: "Basic roleplay flow - simple conversation with one AI agent. Good for casual chat and basic roleplay.",
  },
  {
    name: "NSFW",
    filename: "NSFW_vf.json",
    description: "Adult roleplay with state tracking (arousal, clothing, posture, location). For mature/explicit content.",
  },
  {
    name: "Romance",
    filename: "Romance_vf.json",
    description: "Romance/dating simulation with affection level tracking. For relationship and dating scenarios.",
  },
  {
    name: "Fantasy",
    filename: "Fantasy_vf.json",
    description: "Fantasy RPG with HP, MP, status effects, and combat mechanics. For adventure/battle scenarios.",
  },
  {
    name: "Dice of Fate",
    filename: "Dice of Fate_vf.json",
    description: "Dice-based TTRPG with stat checks (STR, DEX, CON, INT, WIS, CHA), skill rolls, and trial tokens. For D&D-style gameplay.",
  },
  {
    name: "DM of Attraction",
    filename: "DM of attraction_vf.json",
    description: "Dating app/texting simulation with attraction tracking and compatibility assessment. For social media DM scenarios.",
  },
  {
    name: "End of the World",
    filename: "End of the world_vf.json",
    description: "Post-apocalyptic survival with resource tracking. For disaster/survival scenarios.",
  },
] as const;

export type FlowTemplateName = typeof FLOW_TEMPLATES[number]["name"];

/**
 * Result of template selection
 */
export interface TemplateSelectionResult {
  templateName: FlowTemplateName;
  filename: string;
  reason: string;
}

/**
 * Build system prompt for template selection
 */
function buildSystemPrompt(): string {
  const templateList = FLOW_TEMPLATES.map((t, i) =>
    `${i + 1}. **${t.name}**: ${t.description}`
  ).join("\n");

  return `You are a flow template selector. Your job is to analyze a scenario and choose the most appropriate flow template.

## Available Templates:
${templateList}

## Instructions:
1. Read the scenario carefully
2. Identify the key themes, mechanics, and gameplay elements
3. Select the ONE template that best matches the scenario
4. If none of the specialized templates fit well, choose "Simple"

## Response Format:
Respond with ONLY the template name (exactly as shown above) on the first line, followed by a brief reason.

Example response:
Romance
This scenario focuses on building a romantic relationship with affection mechanics.`;
}

/**
 * Use AI to select the best flow template for a given scenario
 */
export async function selectFlowTemplate(
  scenario: string,
  abortSignal?: AbortSignal
): Promise<TemplateSelectionResult> {
  // Default to Simple if no scenario
  if (!scenario || scenario.trim().length < 50) {
    logger.info("[FlowTemplateMatcher] Scenario too short, using Simple template");
    return {
      templateName: "Simple",
      filename: "Simple_vf.json",
      reason: "Scenario is too short to determine specific mechanics",
    };
  }

  try {
    // Get the default lite model from store
    const modelStore = useModelStore.getState();
    const defaultModel: DefaultModelSelection | null = modelStore.defaultLiteModel;

    if (!defaultModel) {
      logger.warn("[FlowTemplateMatcher] No default model, using Simple template");
      return {
        templateName: "Simple",
        filename: "Simple_vf.json",
        reason: "No AI model configured",
      };
    }

    // Get the API connection
    const connectionResult = await ApiService.getApiConnection.execute(
      new UniqueEntityID(defaultModel.apiConnectionId)
    );

    if (connectionResult.isFailure) {
      logger.error("[FlowTemplateMatcher] Failed to get API connection", connectionResult.getError());
      return {
        templateName: "Simple",
        filename: "Simple_vf.json",
        reason: "Failed to connect to AI",
      };
    }

    const apiConnection = connectionResult.getValue();

    if (!apiConnection) {
      logger.warn("[FlowTemplateMatcher] API connection not found, using Simple template");
      return {
        templateName: "Simple",
        filename: "Simple_vf.json",
        reason: "API connection not found",
      };
    }

    // Create the model
    const model = createLiteModel(
      apiConnection.source,
      defaultModel.modelId,
      apiConnection.apiKey || "",
      apiConnection.baseUrl
    );

    // Generate response
    const result = await generateText({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `## Scenario:\n${scenario}` },
      ],
      abortSignal,
    });

    const responseText = result.text.trim();
    const lines = responseText.split("\n");
    const selectedName = lines[0].trim();
    const reason = lines.slice(1).join(" ").trim() || "Best match for the scenario";

    // Find matching template
    const template = FLOW_TEMPLATES.find(
      (t) => t.name.toLowerCase() === selectedName.toLowerCase()
    );

    if (template) {
      logger.info(`[FlowTemplateMatcher] AI selected "${template.name}" template`, { reason });
      return {
        templateName: template.name as FlowTemplateName,
        filename: template.filename,
        reason,
      };
    }

    // If AI returned invalid name, fall back to Simple
    logger.warn(`[FlowTemplateMatcher] AI returned invalid template name "${selectedName}", using Simple`);
    return {
      templateName: "Simple",
      filename: "Simple_vf.json",
      reason: `AI suggested "${selectedName}" but it's not a valid template`,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    logger.error("[FlowTemplateMatcher] Error selecting template", error);
    return {
      templateName: "Simple",
      filename: "Simple_vf.json",
      reason: "Error during template selection",
    };
  }
}

/**
 * Get the file path for a flow template
 */
export function getTemplateFilePath(filename: string): string {
  return `/default/flow/${filename}`;
}

/**
 * Load a flow template JSON
 */
export async function loadFlowTemplate(filename: string): Promise<any> {
  const path = getTemplateFilePath(filename);
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load flow template: ${filename}`);
  }
  return response.json();
}

/**
 * Get template info by name
 */
export function getTemplateByName(name: string) {
  return FLOW_TEMPLATES.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
