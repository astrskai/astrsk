/**
 * Agent Message Evaluation Report
 * Analyzes agent behavior, context usage, and state updates during message generation
 */

export interface EvaluationReport {
  // Metadata
  messageId: string;
  agentName: string;
  modelName: string;
  timestamp: Date;

  // Behavior Analysis
  behaviorAnalysis: BehaviorAnalysis;

  // Context Analysis
  contextAnalysis: ContextAnalysis;

  // State Update Analysis
  stateAnalysis: StateAnalysis;

  // Prompt Analysis
  promptAnalysis: PromptAnalysis;

  // Overall Assessment
  overallScore: number; // 0-100
  issues: EvaluationIssue[];
  recommendations: string[];
}

export interface BehaviorAnalysis {
  responseType: 'normal' | 'hallucination' | 'refusal' | 'incomplete';
  confidence: number; // 0-1
  reasoning: string;

  // Output characteristics
  tokenCount: number;
  averageSentenceLength: number;
  coherenceScore: number; // 0-1

  // Behavior patterns
  patterns: {
    repetitive: boolean;
    outOfContext: boolean;
    contradictory: boolean;
    incomplete: boolean;
  };
}

export interface ContextAnalysis {
  // Context completeness
  historyTurnsUsed: number;
  historyTurnsAvailable: number;
  characterInfoPresent: boolean;
  userContextPresent: boolean;

  // Context issues
  missingInformation: MissingInfo[];
  redundantInformation: RedundantInfo[];
  contextOverload: boolean;

  // Context quality
  relevanceScore: number; // 0-1
  completenessScore: number; // 0-1
}

export interface MissingInfo {
  type: 'character_traits' | 'conversation_history' | 'user_preferences' | 'world_state' | 'custom';
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface RedundantInfo {
  type: 'duplicate_history' | 'irrelevant_context' | 'excessive_instructions';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface StateAnalysis {
  // DataStore updates
  dataStoreUpdates: DataStoreUpdate[];

  // State issues
  issues: StateIssue[];

  // Update patterns
  updateFrequency: 'none' | 'normal' | 'aggressive' | 'excessive';
  doubleCountingDetected: boolean;
  stateConsistency: number; // 0-1
}

export interface DataStoreUpdate {
  fieldName: string;
  fieldType: string;
  previousValue: string | null;
  newValue: string;
  isValid: boolean;
  reasoning: string;
}

export interface StateIssue {
  type: 'double_counting' | 'invalid_value' | 'missing_update' | 'excessive_update' | 'type_mismatch';
  fieldName: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface PromptAnalysis {
  // Prompt structure
  systemMessagePresent: boolean;
  instructionClarity: number; // 0-1
  exampleCount: number;

  // Prompt issues
  contradictions: PromptContradiction[];
  ambiguities: PromptAmbiguity[];

  // Prompt quality
  specificityScore: number; // 0-1
  consistencyScore: number; // 0-1
}

export interface PromptContradiction {
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface PromptAmbiguity {
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface EvaluationIssue {
  category: 'behavior' | 'context' | 'state' | 'prompt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string;
  suggestion: string;
}

/**
 * Evaluation Configuration
 */
export interface EvaluationConfig {
  enabledChecks: {
    behaviorAnalysis: boolean;
    contextAnalysis: boolean;
    stateAnalysis: boolean;
    promptAnalysis: boolean;
  };

  thresholds: {
    hallucinationConfidence: number; // 0-1
    contextRelevance: number; // 0-1
    stateConsistency: number; // 0-1
  };

  verbosity: 'minimal' | 'normal' | 'detailed';
}

export const DEFAULT_EVALUATION_CONFIG: EvaluationConfig = {
  enabledChecks: {
    behaviorAnalysis: true,
    contextAnalysis: true,
    stateAnalysis: true,
    promptAnalysis: true,
  },
  thresholds: {
    hallucinationConfidence: 0.7,
    contextRelevance: 0.6,
    stateConsistency: 0.8,
  },
  verbosity: 'normal',
};
