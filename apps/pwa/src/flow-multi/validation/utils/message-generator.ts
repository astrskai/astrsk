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
    description: (data?: ValidationData) => `Agent "${agentName(data)}" does not have a model`,
    suggestion: "Select a model from the agent configuration"
  },
  
  [ValidationIssueCode.MODEL_NOT_AVAILABLE]: {
    title: "Model not available",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" uses model that is not available`,
    suggestion: "Select a different model or connect to the selected provider to use this model"
  },
  
  [ValidationIssueCode.MISSING_AGENT_NAME]: {
    title: "Missing agent name",
    description: "Agent name is required",
    suggestion: "Provide a name for the agent"
  },
  
  [ValidationIssueCode.AGENT_NAME_TOO_SHORT]: {
    title: "Agent name too short",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" name must be at least 3 characters long`,
    suggestion: "Use a name that is longer than 3 characters"
  },
  
  [ValidationIssueCode.DUPLICATE_AGENT_NAME]: {
    title: "Duplicate agent name",
    description: (data?: ValidationData) => `Two or more  agents have the name "${agentName(data)}"`,
    suggestion: "Give each agent a unique name"
  },
  
  [ValidationIssueCode.MISSING_PROMPT]: {
    ...templates.missingInAgent("prompt messages"),
    suggestion: "Add at least one prompt message to the agent"
  },
  
  [ValidationIssueCode.MISSING_STRUCTURED_OUTPUT_SCHEMA]: {
    title: "Missing structured output schema",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has no schema fields in its structured output`,
    suggestion: "Add schema fields or use text(reponse) output"
  },
  
  // Message Structure
  [ValidationIssueCode.SYSTEM_MESSAGE_IN_MIDDLE]: {
    title: "System message in middle of conversation",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" has a system message in the middle of the prompt`,
    suggestion: "Move system messages to the beginning of the prompt"
  },
  
  [ValidationIssueCode.MISSING_USER_MESSAGE_AFTER_SYSTEM]: {
    title: "First message role for Gemini",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" is using Gemini but has a prompt that does not have a user message immediately after its system message`,
    suggestion: "A filler message will be added with role:user right after the system message"
  },
  
  [ValidationIssueCode.GEMINI_SYSTEM_MESSAGE_AFTER_NON_SYSTEM]: {
    title: "Invalid Gemini message order",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" is using Gemini. Prompts for Gemini cannot process system messages after either user or assistant messages`,
    suggestion: "Place all system messages at the beginning of the prompt"
  },
  
  [ValidationIssueCode.GEMINI_INVALID_MESSAGE_ENDING]: {
    title: "Invalid Gemini message ending",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" is using Gemini. Prompts for Gemini must end with either a user message or history message`,
    suggestion: "Ensure the last message is either a user or history message"
  },
  
  [ValidationIssueCode.NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES]: {
    title: "System message in the middle of prompt (Gemini and Claude requirement)",
    description: (data?: ValidationData) => `Agent "${agentName(data)}" is using system message(s) in the middle of its prompt`,
    suggestion: "System message(s) will automatically convert to user messages when using Gemini or Claude models"
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
          return `Response Design is referencing a an agent output that does not exist in the connected agents: \{\{"${data.referencedAgent}"."${data.field}"\}\}`;
        }
        return `Response Design is referencing an agent that does not exist in the connected agents: "${data.referencedAgent}"`;
      }
      // Regular agent handling
      const locationPart = data.location ? ` ${data.location}` : '';
      if (data.field) {
        return `Agent "${data.agentName}" -${locationPart} is referencing a agent output that does not exist in the connected agents: \{\{"${data.field}"."${data.referencedAgent}"\}\}`;
      }
      return `Agent "${data.agentName}" -${locationPart} is referencing an agent that does not exist in the connected agents: "${data.referencedAgent}"`;
    },
    suggestion: (data?: ValidationData) => {
      if (!isVariableValidationData(data) || !data.referencedAgent) {
        return "Check variable references";
      }
      if (data.field) {
        return `Add agent output "${data.field}" to "${data.referencedAgent}" structured output or fix the agent output reference`;
      }
      return `Check if agent "${data.referencedAgent}" exists in the connected agents`;
    }
  },
  
  // [ValidationIssueCode.UNUSED_VARIABLE_IN_CARDS]: {
  //   title: "Unused variable in cards",
  //   description: "Variable is defined but not used in any cards",
  //   suggestion: "Remove unused variables or use them in cards"
  // },
  
  [ValidationIssueCode.TURN_VARIABLE_OUTSIDE_HISTORY]: {
    title: "Turn variable used outside history message",
    description: (data?: ValidationData) => {
      if (!isVariableValidationData(data) || !data.variable) {
        return "Turn variable is used in the wrong context";
      }
      const locationPart = data.location ? ` ${data.location}` : '';
      return `Agent "${data.agentName}"${locationPart} uses turn variable "${data.variable}". Turn variables can only be used in history messages`;
    },
    suggestion: "Remove turn messages from the prompt"
  },
  
  [ValidationIssueCode.UNUSED_OUTPUT_VARIABLE]: {
    title: "Unused output variable",
    description: (data?: ValidationData) => {
      const field = isVariableValidationData(data) ? data.field : 'unknown';
      return `A field has been defined but is never used: \{\{"${agentName(data)}"."${field}"\}\}`;
    },
    suggestion: "Remove unused field or use it in downstream agents"
  },
  
  // Flow Structure
  [ValidationIssueCode.INVALID_FLOW_STRUCTURE]: {
    title: "Invalid Flow Structure",
    description: "No valid path from start to end node",
    suggestion: "Ensure agents are properly connected from start to end"
  },
  
  [ValidationIssueCode.IF_NODE_MISSING_BRANCHES]: {
    title: "If-Node Missing Branches",
    description: (data?: ValidationData) => {
      if (data && 'nodeName' in data) {
        return `If-node "${data.nodeName}" does not have both branches connected`;
      }
      return "If-node is missing one or both branch connections";
    },
    suggestion: "Connect both true and false branches of the if-node to downstream nodes"
  },
  
  [ValidationIssueCode.IF_NODE_BRANCH_NOT_REACHING_END]: {
    title: "If-Node Branch Not Reaching End",
    description: (data?: ValidationData) => {
      if (data && 'nodeName' in data && 'branch' in data) {
        return `The ${data.branch} branch of if-node "${data.nodeName}" does not reach the end node`;
      }
      return "One or more branches of an if-node do not reach the end node";
    },
    suggestion: "Ensure all branches of if-nodes eventually connect to the end node"
  },
  
  // Warnings
  [ValidationIssueCode.MISSING_HISTORY_MESSAGE]: {
    title: "Missing history message",
    description: (data?: ValidationData) => `Agent "${agentName(data)}"'s prompt does not contain a history message`,
    suggestion: "Add a history message or {{history}} variable to include the session history"
  },
  
  [ValidationIssueCode.UNSUPPORTED_PARAMETERS]: templates.unsupported("feature"),
  
  // [ValidationIssueCode.SO_PARAMETER_MISMATCH]: {
  //   title: "Structured output parameter mismatch",
  //   description: (data?: ValidationData) => `Agent "${agentName(data)}" has enabledStructuredOutput but outputFormat is not 'structured-output'`,
  //   suggestion: "Set outputFormat to 'structured-output' for consistency"
  // },
  
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
    suggestion: "Fix template syntax"
  },
  
  // [ValidationIssueCode.UNVERIFIED_MODEL]: {
  //   title: "Unverified model for structured output",
  //   description: (data?: ValidationData) => {
  //     if (isProviderValidationData(data)) {
  //       return `Model "${data.modelName}" has not been verified for structured output support`;
  //     }
  //     return `This model has not been verified for structured output support`;
  //   },
  //   suggestion: "Structured output may work, but compatibility is not guaranteed"
  // },
  
  [ValidationIssueCode.UNDEFINED_PROVIDER_PARAMETER]: {
    title: "Undefined provider parameter",
    description: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        return `Agent "${agentName(data)}" has a parameter that cannot be processed: "${data.parameter}"`;
      }
      return `This parameter is not defined for the selected provider`;
    },
    suggestion: "This parameter is not supported by the model provider. Check provider documentation or disable this parameter"
  },
  
  [ValidationIssueCode.PARAMETER_OUT_OF_RANGE]: {
    title: "Parameter value out of range",
    description: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        const rangeInfo = [];
        if (data.min !== undefined) rangeInfo.push(`min: ${data.min}`);
        if (data.max !== undefined) rangeInfo.push(`max: ${data.max}`);
        const range = rangeInfo.length > 0 ? ` (${rangeInfo.join(', ')})` : '';
        return `Agent "${agentName(data)}"'s parameter "${data.parameter}" has a value ${data.value} that is outside of its valid range ${range}`;
      }
      return `Parameter value is outside the valid range`;
    },
    suggestion: (data?: ValidationData) => {
      if (isProviderValidationData(data)) {
        const rangeInfo = [];
        if (data.min !== undefined) rangeInfo.push(`min: ${data.min}`);
        if (data.max !== undefined) rangeInfo.push(`max: ${data.max}`);
        return `The value of the parameter should be within ${rangeInfo.length > 0 ? ': ' + rangeInfo.join(', ') : ''}`;
      }
      return `Set the parameter value within the valid range`;
    }
  },
  
  // Data Update Errors
  [ValidationIssueCode.DATA_STORE_INVALID_INITIAL_VALUE]: {
    title: "Invalid initial value",
    description: (data?: ValidationData) => `Data update "${agentName(data)}" has an invalid initial value that doesn't match the schema`,
    suggestion: "Ensure the initial value matches the defined schema structure"
  },
  
  [ValidationIssueCode.DATA_STORE_MISSING_INITIAL_VALUE]: {
    title: "Missing initial value",
    description: (data?: ValidationData) => `Data update "${agentName(data)}" is missing an initial value`,
    suggestion: "Provide an initial value for the data update"
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