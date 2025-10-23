/**
 * Standardized panel type definitions for the flow-multi system
 * All panels in the system should use these base interfaces
 */

/**
 * Base props that all panels receive from the dockview system
 */
export interface BasePanelProps {
  /** Optional CSS class name for styling */
  className?: string;
  /** The ID of the agent this panel is associated with (null for standalone mode) */
  agentId?: string | null;
  /** Whether the panel is in standalone mode (not associated with a specific agent) */
  isStandalone?: boolean;
}

/**
 * Type-safe panel type enum
 */
export enum PanelType {
  PROMPT = 'prompt',
  PARAMETER = 'parameter',
  STRUCTURED_OUTPUT = 'structuredOutput',
  PREVIEW = 'preview',
  VARIABLE = 'variable',
  FLOW = 'flow',
  RESPONSE_DESIGN = 'responseDesign',
}

/**
 * Panel configuration for registration with dockview
 */
export interface PanelConfig {
  /** Unique identifier for the panel type */
  type: PanelType;
  /** Display title for the panel */
  title: string;
  /** Default title when in standalone mode */
  standaloneTitle?: string;
  /** Icon component or string for the panel */
  icon?: React.ReactNode;
  /** Whether this panel can be opened in standalone mode */
  supportsStandalone?: boolean;
  /** Whether multiple instances of this panel can exist */
  allowMultiple?: boolean;
}

/**
 * Panel state interface for managing panel lifecycle
 */
export interface PanelState {
  /** Whether the panel is currently visible */
  isVisible: boolean;
  /** Whether the panel is currently active/focused */
  isActive: boolean;
  /** Whether the panel is in a saving state */
  isSaving?: boolean;
  /** Last saved timestamp */
  lastSaved?: Date | null;
  /** Current width of the panel */
  width?: number;
  /** Current height of the panel */
  height?: number;
}

/**
 * Panel instance metadata
 */
export interface PanelInstance {
  /** Unique ID for this panel instance */
  id: string;
  /** Type of the panel */
  type: PanelType;
  /** Associated agent ID (if any) */
  agentId?: string;
  /** Whether this is a standalone instance */
  isStandalone: boolean;
  /** Panel title */
  title: string;
  /** Panel state */
  state: PanelState;
}

/**
 * Panel visibility map type
 */
export type PanelVisibilityMap = Record<PanelType, boolean>;

/**
 * Helper function to create a panel ID
 */
export function createPanelId(type: PanelType, agentId?: string, isStandalone?: boolean): string {
  if (isStandalone || !agentId) {
    return `${type}-standalone`;
  }
  return `${type}-${agentId}`;
}

/**
 * Helper function to parse a panel ID
 */
export function parsePanelId(panelId: string): { type: string; agentId?: string; isStandalone: boolean } {
  if (panelId.endsWith('-standalone')) {
    return {
      type: panelId.replace('-standalone', ''),
      isStandalone: true,
    };
  }
  
  const parts = panelId.split('-');
  if (parts.length >= 2) {
    return {
      type: parts[0],
      agentId: parts.slice(1).join('-'),
      isStandalone: false,
    };
  }
  
  return {
    type: panelId,
    isStandalone: true,
  };
}

/**
 * Type guard to check if a string is a valid PanelType
 */
export function isPanelType(value: string): value is PanelType {
  return Object.values(PanelType).includes(value as PanelType);
}