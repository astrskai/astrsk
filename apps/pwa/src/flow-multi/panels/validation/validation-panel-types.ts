export interface ValidationPanelProps {
  flowId: string;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  suggestion: string;
  agentId?: string;
  agentName?: string;
}