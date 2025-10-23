/**
 * Validation Parameter Types
 * Extended parameter types for validation purposes across different providers
 */

import { Parameter } from '@/shared/task/domain/parameter';

/**
 * Keys for ValidationParameter notes Map
 */
export const ValidationNoteKey = {
  Default: "default",
  Required: "required",
  ActualType: "actual_type",
  ActualValues: "actual_values",
  AiSdkDefault: "ai_sdk_default",
  AstrskSupport: "astrsk_support",
  Type: "type",
  Min: "min",
  Max: "max",
} as const;

export type ValidationNoteKey = (typeof ValidationNoteKey)[keyof typeof ValidationNoteKey];

/**
 * Extended Parameter type for validation purposes
 */
export interface ValidationParameter extends Parameter {
  // Indicates if this parameter is part of AI SDK core settings or provider options
  parameterType: "core" | "model" | "provider";
  // Indicates if this parameter is supported by Astrsk
  supportedInAstrsk: boolean;
  // Provider-specific documentation
  documentation?: ProviderDocumentation;
  // Implementation notes and important details about the parameter
  notes?: Map<ValidationNoteKey, string>;
}

/**
 * Base provider documentation interface
 */
export interface ProviderDocumentation {
  deprecated?: boolean;
  replacedBy?: string;
  requiredFor?: string[];
  notSupportedIn?: string[];
}

