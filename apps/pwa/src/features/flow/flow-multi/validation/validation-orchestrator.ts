import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { traverseFlowCached } from "@/features/flow/flow-multi/utils/flow-traversal";
import { ValidationContext, ValidationIssue } from "@/features/flow/flow-multi/validation/types/validation-types";
import { ValidatorFunction, FunctionalValidator } from "@/features/flow/flow-multi/validation/types/functional-validation-types";
import { composeValidators } from "@/features/flow/flow-multi/validation/utils/validator-utils";
import { ApiConnectionWithModels } from "@/app/hooks/use-api-connections-with-models";

// Import all functional validators
import {
  validateFlowPath,
  validateModelSelection,
  validateAgentName,
  validatePromptMessages,
  validateStructuredOutput,
  validateSystemMessagePlacement,
  validateGeminiMessageStructure,
  validateHistoryMessage,
  validateUndefinedOutputVariables,
  validateUnusedOutputVariables,
  validateTemplateSyntax,
  validateStructuredOutputSupport,
} from "@/features/flow/flow-multi/validation/validators";

export class ValidationOrchestrator {
  private validators: FunctionalValidator[] = [
    // Flow structure validators
    {
      name: 'flow-path',
      description: 'Validates flow has path from start to end',
      enabled: true,
      validate: validateFlowPath,
    },
    
    // Agent configuration validators
    {
      name: 'model-selection',
      description: 'Validates agents have models selected',
      enabled: true,
      validate: validateModelSelection,
    },
    {
      name: 'agent-name',
      description: 'Validates agents have names',
      enabled: true,
      validate: validateAgentName,
    },
    {
      name: 'prompt-messages',
      description: 'Validates agents have prompt messages',
      enabled: true,
      validate: validatePromptMessages,
    },
    {
      name: 'structured-output-schema',
      description: 'Validates structured output configuration',
      enabled: true,
      validate: validateStructuredOutput,
    },
    
    // Message structure validators
    {
      name: 'system-message-placement',
      description: 'Validates system message placement',
      enabled: true,
      validate: validateSystemMessagePlacement,
    },
    {
      name: 'gemini-message-structure',
      description: 'Validates Gemini-specific message requirements',
      enabled: true,
      validate: validateGeminiMessageStructure,
    },
    {
      name: 'history-message',
      description: 'Checks for history variable usage',
      enabled: true,
      validate: validateHistoryMessage,
    },
    
    // Variable validators
    {
      name: 'undefined-variables',
      description: 'Checks for undefined variable references',
      enabled: true,
      validate: validateUndefinedOutputVariables,
    },
    {
      name: 'unused-variables',
      description: 'Checks for unused output variables',
      enabled: true,
      validate: validateUnusedOutputVariables,
    },
    {
      name: 'template-syntax',
      description: 'Validates template syntax',
      enabled: true,
      validate: validateTemplateSyntax,
    },
    
    // Provider compatibility validators
    {
      name: 'structured-output-support',
      description: 'Checks provider support for structured output',
      enabled: true,
      validate: validateStructuredOutputSupport,
    },
  ];
  
  async validateFlow(flow: Flow, agents: Map<string, Agent>, apiConnectionsWithModels?: ApiConnectionWithModels[]): Promise<ValidationIssue[]> {
    // Build validation context
    const context = this.buildContext(flow, agents, apiConnectionsWithModels);
    
    // Get enabled validators
    const enabledValidators = this.validators
      .filter(v => v.enabled)
      .map(v => v.validate);
    
    // Compose all enabled validators
    const composedValidator = composeValidators(...enabledValidators);
    
    // Run validation
    const issues = composedValidator(context);
    
    // Sort issues: errors first, then warnings
    issues.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === 'error' ? -1 : 1;
    });
    
    return issues;
  }
  
  private buildContext(flow: Flow, agents: Map<string, Agent>, apiConnectionsWithModels?: ApiConnectionWithModels[]): ValidationContext {
    const traversalResult = traverseFlowCached(flow);
    
    // Build connected agents set
    const connectedAgents = new Set<string>();
    for (const [agentId, position] of traversalResult.agentPositions) {
      if (position.isConnectedToStart && position.isConnectedToEnd) {
        connectedAgents.add(agentId);
      }
    }
    
    // Build connected nodes set (includes all process nodes: agents, if, dataStore)
    const connectedNodes = new Set<string>(traversalResult.connectedSequence);
    
    return {
      flow,
      agents,
      connectedAgents,
      connectedNodes,
      agentPositions: traversalResult.agentPositions,
      apiConnectionsWithModels,
    };
  }
  
  // Enable/disable validators by name
  setValidatorEnabled(name: string, enabled: boolean): void {
    const validator = this.validators.find(v => v.name === name);
    if (validator) {
      validator.enabled = enabled;
    }
  }
  
  // Get validator status
  getValidatorStatus(): Array<{ name: string; description: string; enabled: boolean }> {
    return this.validators.map(v => ({
      name: v.name,
      description: v.description,
      enabled: v.enabled,
    }));
  }
  
  // Add custom validator
  addValidator(validator: FunctionalValidator): void {
    this.validators.push(validator);
  }
  
  // Remove validator by name
  removeValidator(name: string): void {
    this.validators = this.validators.filter(v => v.name !== name);
  }
  
  // Replace all validators
  setValidators(validators: FunctionalValidator[]): void {
    this.validators = validators;
  }
}