/**
 * Plot Execution Service
 *
 * Handles plot-specific generation for Plot START → Plot END paths.
 * Different from character generation:
 * - Optimized for narration and scene descriptions
 * - Uses plot card data including lorebook entries
 * - Different prompt structure for storytelling
 *
 * Phase 3.2 - Initial Implementation
 * TODO: Implement plot-specific prompt engineering
 * For now, delegates to agent execution with plot context
 */

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

export interface PlotExecutionContext {
  plotCardId: UniqueEntityID;
  fullContext: Record<string, any>;
  stopSignalByUser?: AbortSignal;
  creditLog?: {
    session_id: string;
    flow_id: string;
  };
}

export interface PlotExecutionResult {
  agentKey?: string;
  agentName: string;
  modelName?: string;
  output: any;
  metadata?: any;
}

/**
 * Execute plot generation for Plot START → Plot END paths
 *
 * @param context - Plot execution context
 * @returns Async generator yielding plot generation results
 *
 * NOTE: Currently delegates to agent execution.
 * TODO Phase 3.3: Implement plot-specific prompt structure:
 * - Narration-focused prompts
 * - Lorebook integration
 * - Scene description generation
 * - Different temperature/parameters for creative storytelling
 */
export async function* executePlotNode(
  context: PlotExecutionContext
): AsyncGenerator<PlotExecutionResult, void, void> {
  logger.info(`[PlotExecution] Executing plot node for card: ${context.plotCardId.toString()}`);

  // TODO Phase 3.3: Implement plot-specific generation
  // For now, this is a placeholder that would use the agent execution logic
  // but with plot-specific prompt engineering

  // Placeholder: In actual implementation, this would:
  // 1. Load plot card with lorebook entries
  // 2. Build plot-specific prompt (narration, scene, etc.)
  // 3. Call LLM with storytelling parameters
  // 4. Yield results with plot-specific structure

  yield {
    agentKey: `plot_${context.plotCardId.toString()}`,
    agentName: "Plot",
    output: {
      narration: "Plot narration will be generated here",
      scene_description: "Scene description",
    },
  };
}

/**
 * Check if a card is a plot card (for routing decisions)
 */
export function isPlotCard(cardType: string): boolean {
  return cardType === "plot";
}
