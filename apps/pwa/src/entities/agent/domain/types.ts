import type { ModelTier } from "./agent";

/**
 * Agent Model Tier Information
 * Used for export dialogs to display and select model tiers for agents
 */
export interface AgentModelTierInfo {
  agentId: string;
  agentName: string;
  modelName: string;
  recommendedTier: ModelTier;
  selectedTier: ModelTier;
}
