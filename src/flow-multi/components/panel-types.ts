/**
 * Centralized panel type definitions for the compact flow-multi system
 * All components should import and use these constants instead of magic strings
 */

export const PANEL_TYPES = {
  FLOW: 'flow',
  PROMPT: 'prompt',
  PARAMETER: 'parameter',
  STRUCTURED_OUTPUT: 'structuredOutput',
  PREVIEW: 'preview',
  VARIABLE: 'variable',
  RESPONSE_DESIGN: 'responseDesign',
} as const;

export type PanelType = typeof PANEL_TYPES[keyof typeof PANEL_TYPES];

/**
 * Panel types that support agent association
 */
export const AGENT_PANEL_TYPES = [
  PANEL_TYPES.PROMPT,
  PANEL_TYPES.PARAMETER,
  PANEL_TYPES.STRUCTURED_OUTPUT,
  PANEL_TYPES.PREVIEW,
] as const;

export type AgentPanelType = typeof AGENT_PANEL_TYPES[number];

/**
 * Panel types that are standalone only
 */
export const STANDALONE_PANEL_TYPES = [
  PANEL_TYPES.VARIABLE,
  PANEL_TYPES.RESPONSE_DESIGN,
] as const;

export type StandalonePanelType = typeof STANDALONE_PANEL_TYPES[number];

/**
 * Type guard to check if a panel type supports agent association
 */
export function isAgentPanelType(panelType: PanelType): panelType is AgentPanelType {
  return AGENT_PANEL_TYPES.includes(panelType as AgentPanelType);
}

/**
 * Type guard to check if a panel type is standalone only
 */
export function isStandalonePanelType(panelType: PanelType): panelType is StandalonePanelType {
  return STANDALONE_PANEL_TYPES.includes(panelType as StandalonePanelType);
}

/**
 * Get human-readable panel title
 */
export function getPanelTitle(panelType: PanelType, agentName?: string): string {
  const baseTitle = (() => {
    switch (panelType) {
      case PANEL_TYPES.FLOW:
        return 'Flow';
      case PANEL_TYPES.PROMPT:
        return 'Prompt';
      case PANEL_TYPES.PARAMETER:
        return 'Parameters';
      case PANEL_TYPES.STRUCTURED_OUTPUT:
        return 'Output';
      case PANEL_TYPES.PREVIEW:
        return 'Preview';
      case PANEL_TYPES.VARIABLE:
        return 'Variables';
      case PANEL_TYPES.RESPONSE_DESIGN:
        return 'Response Design';
      default:
        return 'Unknown Panel';
    }
  })();

  if (agentName && isAgentPanelType(panelType)) {
    return `[${agentName}] ${baseTitle}`;
  }

  return baseTitle;
}

/**
 * Type-safe panel visibility interface
 */
export interface FlowPanelVisibility {
  [PANEL_TYPES.FLOW]: boolean;
  [PANEL_TYPES.PROMPT]: boolean;
  [PANEL_TYPES.PARAMETER]: boolean;
  [PANEL_TYPES.STRUCTURED_OUTPUT]: boolean;
  [PANEL_TYPES.PREVIEW]: boolean;
  [PANEL_TYPES.VARIABLE]: boolean;
  [PANEL_TYPES.RESPONSE_DESIGN]: boolean;
}