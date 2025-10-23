// Data types for validation messages

export interface BaseValidationData {
  agentId?: string;
  agentName?: string;
}

export interface ModelValidationData extends BaseValidationData {
  modelName?: string;
}

export interface VariableValidationData extends BaseValidationData {
  variable?: string;
  referencedAgent?: string;
  field?: string;
  location?: string; // e.g., "prompt message \"Guidelines\"", "structured output field \"description\""
}

export interface ProviderValidationData extends BaseValidationData {
  provider?: string;
  feature?: string;
  modelName?: string;
  parameter?: string;
  value?: string;
  min?: string;
  max?: string;
}

export interface SyntaxErrorData extends BaseValidationData {
  error?: string;
  messageIndex?: number;
  blockIndex?: number;
  template?: string;
}

// Union type for all validation data
export type ValidationData = 
  | BaseValidationData
  | ModelValidationData
  | VariableValidationData
  | ProviderValidationData
  | SyntaxErrorData;

// Type guards
export function isVariableValidationData(data: ValidationData | undefined): data is VariableValidationData {
  return !!data && ('variable' in data || 'referencedAgent' in data || 'field' in data);
}

export function isProviderValidationData(data: ValidationData | undefined): data is ProviderValidationData {
  return !!data && ('provider' in data || 'feature' in data);
}

export function isSyntaxErrorData(data: ValidationData | undefined): data is SyntaxErrorData {
  return !!data && 'error' in data;
}