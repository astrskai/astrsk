import { ValidationIssueCode } from "@/flow-multi/validation/types/validation-types";
import { 
  ValidationData, 
  BaseValidationData,
  VariableValidationData,
  ProviderValidationData,
  SyntaxErrorData,
  isVariableValidationData,
  isProviderValidationData,
  isSyntaxErrorData
} from "@/flow-multi/validation/types/message-data-types";

interface ValidationMessage {
  title: string;
  description: string;
  suggestion: string;
}

// Helper to get agent name with fallback
const agentName = (data?: { agentName?: string }) => data?.agentName || 'Unnamed';

// Message templates for common patterns
const templates = {
  missingInAgent: (item: string) => ({
    title: `Missing ${item}`,
    description: (data?: BaseValidationData) => `Agent "${agentName(data)}" has no ${item}`,
    suggestion: `Add ${item} to the agent`
  }),
  
  invalidStructure: (item: string, requirement: string) => ({
    title: `Invalid ${item} structure`,
    description: (data?: BaseValidationData) => `Agent "${agentName(data)}" ${requirement}`,
    suggestion: (fix: string) => fix
  }),
  
  unsupported: (feature: string) => ({
    title: (data?: ProviderValidationData) => `Unsupported ${data?.feature || feature}`,
    description: (data?: ProviderValidationData) => 
      `Agent "${agentName(data)}" uses ${data?.provider || 'provider'} which doesn't support ${data?.feature || feature}`,
    suggestion: (data?: ProviderValidationData) => `Disable ${data?.feature || feature} or use a model that supports it`
  })
};

// Compact message definitions
const messageDefinitions: Record<ValidationIssueCode, {
  title: string | ((data?: ValidationData) => string);
  description: string | ((data?: ValidationData) => string);
  suggestion: string | ((data?: ValidationData) => string);
}> = {
  // Agent Configuration
  [ValidationIssueCode.NO_MODEL_SELECTED]: {
    title: "No model selected",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has no model selected`,
    suggestion: "Select a model from the agent configuration"
  },
  
  [ValidationIssueCode.MODEL_NOT_AVAILABLE]: {
    title: "Model not available",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" uses model that is not available in any API connection`,
    suggestion: "Select a different model or configure the API connection for this model"
  },
  
  [ValidationIssueCode.MISSING_AGENT_NAME]: {
    title: "Missing agent name",
    description: "Agent has no name configured",
    suggestion: "Provide a descriptive name for the agent"
  },
  
  [ValidationIssueCode.AGENT_NAME_TOO_SHORT]: {
    title: "Agent name too short",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" name must be at least 3 characters long`,
    suggestion: "Use a longer, more descriptive name for the agent"
  },
  
  [ValidationIssueCode.DUPLICATE_AGENT_NAME]: {
    title: "Duplicate agent name",
    description: (data?: ValidationData) => `Multiple agents have the name "${agentName(data)}"`,
    suggestion: "Give each agent a unique name"
  },
  
  [ValidationIssueCode.MISSING_PROMPT]: {
    ...templates.missingInAgent("prompt messages"),
    suggestion: "Add at least one prompt message to the agent"
  },
  
  [ValidationIssueCode.MISSING_STRUCTURED_OUTPUT_SCHEMA]: {
    title: "Missing structured output schema",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has structured output enabled but no schema fields defined`,
    suggestion: "Add schema fields or disable structured output"
  },
  
  // Message Structure
  [ValidationIssueCode.SYSTEM_MESSAGE_IN_MIDDLE]: {
    title: "System message in middle of conversation",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has a system message in the middle of the prompt`,
    suggestion: "Move system messages to the beginning of the prompt"
  },
  
  [ValidationIssueCode.MISSING_USER_MESSAGE_AFTER_SYSTEM]: {
    title: "Invalid message structure for Gemini",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" using Gemini must have a user or history message immediately after the last system message`,
    suggestion: "Add a user message or history placeholder after the last system message"
  },
  
  [ValidationIssueCode.GEMINI_SYSTEM_MESSAGE_AFTER_NON_SYSTEM]: {
    title: "Invalid Gemini message order",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" using Gemini cannot have system messages after user or assistant messages`,
    suggestion: "Place all system messages at the beginning of the conversation"
  },
  
  [ValidationIssueCode.GEMINI_INVALID_MESSAGE_ENDING]: {
    title: "Invalid Gemini message ending",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" using Gemini must end with either a user message or history placeholder`,
    suggestion: "Ensure the last message is either a user message or contains {{history}}"
  },
  
  [ValidationIssueCode.NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES]: {
    title: "Non-system message between system messages (Gemini and Claude requirement)",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has user, assistant, or history messages between system messages (Gemini and Claude requirement)`,
    suggestion: "For Gemini and Claude models, all system messages must appear consecutively without any interruption from other message types."
  },
  
  // Variables
  [ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE]: {
    title: "Undefined output variable",
    description: (data?: ValidationData) => {
      if (!isVariableValidationData(data) || !data.referencedAgent) {
        return "Variable reference to undefined source";
      }
      // Special handling for Response Design
      if (data.agentName === 'Response Design') {
        if (data.field) {
          return `Response Design references non-existent field "${data.field}" from "${data.referencedAgent}"`;
        }
        return `Response Design references non-existent agent "${data.referencedAgent}"`;
      }
      // Regular agent handling
      const locationPart = data.location ? ` ${data.location}` : '';
      if (data.field) {
        return `Agent "${data.agentName}"${locationPart} references non-existent field "${data.field}" from "${data.referencedAgent}"`;
      }
      return `Agent "${data.agentName}"${locationPart} references non-existent agent "${data.referencedAgent}"`;
    },
    suggestion: (data?: ValidationData) => {
      if (!isVariableValidationData(data) || !data.referencedAgent) {
        return "Check variable references";
      }
      if (data.field) {
        return `Add field "${data.field}" to "${data.referencedAgent}" structured output or fix the variable reference`;
      }
      return `Check if agent "${data.referencedAgent}" exists in the flow`;
    }
  },
  
  [ValidationIssueCode.UNUSED_VARIABLE_IN_CARDS]: {
    title: "Unused variable in cards",
    description: "Variable is defined but not used in any cards",
    suggestion: "Remove unused variables or use them in cards"
  },
  
  [ValidationIssueCode.TURN_VARIABLE_OUTSIDE_HISTORY]: {
    title: "Turn variable used outside history message",
    description: (data?: ValidationData) => {
      if (!isVariableValidationData(data) || !data.variable) {
        return "Turn variable used in wrong context";
      }
      const locationPart = data.location ? ` ${data.location}` : '';
      return `Agent "${data.agentName}"${locationPart} uses turn variable "${data.variable}" which is only valid in history messages`;
    },
    suggestion: "Move turn variable usage to a history message or remove it"
  },
  
  [ValidationIssueCode.UNUSED_OUTPUT_VARIABLE]: {
    title: "Unused output variable",
    description: (data?: ValidationData) => {
      const field = isVariableValidationData(data) ? data.field : 'unknown';
      return `Field "${field}" from agent "${agentName(data)}" is defined but never used`;
    },
    suggestion: "Remove unused field or use it in downstream agents"
  },
  
  // Flow Structure
  [ValidationIssueCode.INVALID_FLOW_STRUCTURE]: {
    title: "Invalid Flow Structure",
    description: "No valid path from start to end node",
    suggestion: "Ensure agents are properly connected from start to end"
  },
  
  // Warnings
  [ValidationIssueCode.MISSING_HISTORY_MESSAGE]: {
    title: "Missing history message",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" doesn't use history message nor {{history}} variable`,
    suggestion: "Add history message or {{history}} variable to include conversation history"
  },
  
  [ValidationIssueCode.UNSUPPORTED_PARAMETERS]: templates.unsupported("feature"),
  
  [ValidationIssueCode.SO_PARAMETER_MISMATCH]: {
    title: "Structured output parameter mismatch",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has enabledStructuredOutput but outputFormat is not 'structured-output'`,
    suggestion: "Set outputFormat to 'structured-output' for consistency"
  },
  
  [ValidationIssueCode.SYNTAX_ERROR]: {
    title: "Template syntax error",
    description: (data?: ValidationData) => {
      const error = isSyntaxErrorData(data) ? data.error : 'unknown error';
      // Special handling for Response Design
      if (data?.agentName === 'Response Design') {
        return `Response Design has invalid template syntax: ${error}`;
      }
      return `Agent "${agentName(data)}" has invalid template syntax: ${error}`;
    },
    suggestion: "Fix the template syntax error"
  },
  
  [ValidationIssueCode.UNVERIFIED_MODEL]: {
    title: "Unverified model for structured output",
    description: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        return `Model "${data.modelName}" has not been verified for structured output support`;
      }
      return `This model has not been verified for structured output support`;
    },
    suggestion: "Structured output may work, but compatibility is not guaranteed"
  },
  
  [ValidationIssueCode.UNDEFINED_PROVIDER_PARAMETER]: {
    title: "Undefined provider parameter",
    description: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        return `Parameter "${data.parameter}" is not defined for ${data.provider} (model: ${data.modelName})`;
      }
      return `This parameter is not defined for the selected provider`;
    },
    suggestion: "This parameter may not be supported by the provider. Check provider documentation or disable this parameter"
  },
  
  [ValidationIssueCode.PARAMETER_OUT_OF_RANGE]: {
    title: "Parameter value out of range",
    description: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        const rangeInfo = [];
        if (data.min !== undefined) rangeInfo.push(`min: ${data.min}`);
        if (data.max !== undefined) rangeInfo.push(`max: ${data.max}`);
        const range = rangeInfo.length > 0 ? ` (${rangeInfo.join(', ')})` : '';
        return `Agent "${agentName(data)}" parameter "${data.parameter}" value ${data.value} is outside the valid range${range}`;
      }
      return `Parameter value is outside the valid range`;
    },
    suggestion: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        const rangeInfo = [];
        if (data.min !== undefined) rangeInfo.push(`min: ${data.min}`);
        if (data.max !== undefined) rangeInfo.push(`max: ${data.max}`);
        return `Set the value within the valid range${rangeInfo.length > 0 ? ': ' + rangeInfo.join(', ') : ''}`;
      }
      return `Set the parameter value within the valid range`;
    }
  }
};

export function generateValidationMessage(
  code: ValidationIssueCode,
  data?: ValidationData
): ValidationMessage {
  const definition = messageDefinitions[code];
  
  if (!definition) {
    return {
      title: "Unknown validation issue",
      description: "An unknown validation issue was detected",
      suggestion: "Check the validation configuration"
    };
  }
  
  return {
    title: typeof definition.title === 'function' ? definition.title(data) : definition.title,
    description: typeof definition.description === 'function' ? definition.description(data) : definition.description,
    suggestion: typeof definition.suggestion === 'function' ? definition.suggestion(data) : definition.suggestion
  };
}