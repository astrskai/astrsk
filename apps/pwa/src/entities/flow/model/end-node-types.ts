/**
 * END Node Type Enum
 *
 * Defines the three response format types for END nodes in a flow.
 * Every flow contains exactly 3 END nodes (one of each type).
 *
 * Each END type uses a different response template field:
 * - CHARACTER → flow.props.responseTemplate
 * - USER → flow.props.responseTemplateUser
 * - PLOT → flow.props.responseTemplatePlot
 */
export enum EndNodeType {
  /**
   * Character END
   * Dialogue format for character responses
   * Visual: Green theme (border: #2e7d32, background: #c8e6c9)
   * Icon: 💬
   * Template field: responseTemplate
   */
  CHARACTER = "character_end",

  /**
   * User END
   * Action format for user responses
   * Visual: Blue theme (border: #1565c0, background: #90caf9)
   * Icon: ⚡
   * Template field: responseTemplateUser
   */
  USER = "user_end",

  /**
   * Plot END
   * Narration format for plot/scene descriptions
   * Visual: Orange theme (border: #d84315, background: #ffccbc)
   * Icon: 📜
   * Template field: responseTemplatePlot
   */
  PLOT = "plot_end"
}

/**
 * Theme configuration for END node types
 */
export interface EndNodeTheme {
  border: string;
  background: string;
  icon: string;
  label: string;
  description: string;
}

/**
 * Get theme configuration for an END node type
 */
export function getEndNodeTheme(type: EndNodeType): EndNodeTheme {
  switch (type) {
    case EndNodeType.CHARACTER:
      return {
        border: '#2e7d32',
        background: '#c8e6c9',
        icon: '💬',
        label: 'Dialogue',
        description: 'Dialogue format for character responses'
      };
    case EndNodeType.USER:
      return {
        border: '#1565c0',
        background: '#90caf9',
        icon: '⚡',
        label: 'Action',
        description: 'Action format for user responses'
      };
    case EndNodeType.PLOT:
      return {
        border: '#d84315',
        background: '#ffccbc',
        icon: '📜',
        label: 'Narration',
        description: 'Narration format for plot/scene descriptions'
      };
  }
}

/**
 * Get the template field name for an END node type
 */
export function getTemplateFieldForEndType(type: EndNodeType): string {
  switch (type) {
    case EndNodeType.CHARACTER:
      return 'responseTemplate';
    case EndNodeType.USER:
      return 'responseTemplateUser';
    case EndNodeType.PLOT:
      return 'responseTemplatePlot';
  }
}

/**
 * Type guard to check if a string is a valid EndNodeType
 */
export function isValidEndNodeType(value: string): value is EndNodeType {
  return Object.values(EndNodeType).includes(value as EndNodeType);
}

/**
 * Get all END node types as an array
 */
export function getAllEndNodeTypes(): EndNodeType[] {
  return Object.values(EndNodeType);
}

/**
 * Get display label for END node type
 */
export function getEndNodeLabel(type: EndNodeType): string {
  switch (type) {
    case EndNodeType.CHARACTER:
      return 'Character End';
    case EndNodeType.USER:
      return 'User End';
    case EndNodeType.PLOT:
      return 'Plot End';
  }
}
