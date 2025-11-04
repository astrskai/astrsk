/**
 * START Node Type Enum
 *
 * Defines the three trigger types for START nodes in a flow.
 * Every flow contains exactly 3 START nodes (one of each type).
 *
 * Trigger activation is determined by connectivity:
 * - If START → END path exists: Trigger is active
 * - If START → END path disconnected: Trigger is inactive
 */
export enum StartNodeType {
  /**
   * Character START
   * AI-controlled character agents in the scene
   * Visual: Green theme (border: #2e7d32, background: #c8e6c9)
   * Icon: 👤
   */
  CHARACTER = "character_start",

  /**
   * User START
   * The character controlled by the user in a roleplay.
   * Visual: Blue theme (border: #1565c0, background: #90caf9)
   * Icon: 🙋
   */
  USER = "user_start",

  /**
   * Plot START
   * The plot controlling the scene, etc.
   * Visual: Orange theme (border: #d84315, background: #ffccbc)
   * Icon: 📖
   */
  PLOT = "plot_start"
}

/**
 * Theme configuration for START node types
 */
export interface StartNodeTheme {
  border: string;
  background: string;
  icon: string;
  description: string;
}

/**
 * Get theme configuration for a START node type
 */
export function getStartNodeTheme(type: StartNodeType): StartNodeTheme {
  switch (type) {
    case StartNodeType.CHARACTER:
      return {
        border: '#2e7d32',
        background: '#c8e6c9',
        icon: '👤',
        description: 'AI-controlled character agents in the scene'
      };
    case StartNodeType.USER:
      return {
        border: '#1565c0',
        background: '#90caf9',
        icon: '🙋',
        description: 'The character controlled by the user in a roleplay.'
      };
    case StartNodeType.PLOT:
      return {
        border: '#d84315',
        background: '#ffccbc',
        icon: '📖',
        description: 'The plot controlling the scene, etc.'
      };
  }
}

/**
 * Type guard to check if a string is a valid StartNodeType
 */
export function isValidStartNodeType(value: string): value is StartNodeType {
  return Object.values(StartNodeType).includes(value as StartNodeType);
}

/**
 * Get all START node types as an array
 */
export function getAllStartNodeTypes(): StartNodeType[] {
  return Object.values(StartNodeType);
}

/**
 * Get display label for START node type
 */
export function getStartNodeLabel(type: StartNodeType): string {
  switch (type) {
    case StartNodeType.CHARACTER:
      return 'Character Start';
    case StartNodeType.USER:
      return 'User Start';
    case StartNodeType.PLOT:
      return 'Plot Start';
  }
}
