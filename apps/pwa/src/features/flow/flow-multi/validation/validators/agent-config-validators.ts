import { ValidationIssue, ValidationIssueCode } from "@/features/flow/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/features/flow/flow-multi/validation/types/functional-validation-types";
import { forEachConnectedAgent, generateIssueId } from "@/features/flow/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/features/flow/flow-multi/validation/utils/message-generator";
import { Agent, ApiType, OutputFormat } from "@/modules/agent/domain";
import { isModelAvailable } from "@/features/flow/flow-multi/components/model-selection";

// Check if agent has a model selected and if it's available
export const validateModelSelection: ValidatorFunction = (context) => {
  // Run the forEachConnectedAgent logic
  const connectedAgentValidator = forEachConnectedAgent(
    (agentId, agent: Agent) => {
      const agentIssues: ValidationIssue[] = [];

      // Check if model is selected
      if (!agent.props.modelName) {
        const message = generateValidationMessage(ValidationIssueCode.NO_MODEL_SELECTED, {
          agentName: agent.props.name
        });
        agentIssues.push({
          id: generateIssueId(ValidationIssueCode.NO_MODEL_SELECTED, agentId),
          code: ValidationIssueCode.NO_MODEL_SELECTED,
          severity: 'error',
          ...message,
          agentId,
          agentName: agent.props.name,
        });
      } else if (context.apiConnectionsWithModels) {
        // Check if model is available in API connections
        const modelAvailable = isModelAvailable(
          agent.props.modelName,
          agent.props.apiSource,
          agent.props.modelId,
          context.apiConnectionsWithModels
        );
        
        if (!modelAvailable) {
          const message = generateValidationMessage(ValidationIssueCode.MODEL_NOT_AVAILABLE, {
            agentName: agent.props.name
          });
          agentIssues.push({
            id: generateIssueId(ValidationIssueCode.MODEL_NOT_AVAILABLE, agentId),
            code: ValidationIssueCode.MODEL_NOT_AVAILABLE,
            severity: 'error',
            ...message,
            agentId,
            agentName: agent.props.name,
          });
        }
      }
      
      return agentIssues;
    }
  );
  
  return connectedAgentValidator(context);
};

// Check if agent has a name, is at least 3 characters, and is unique
export const validateAgentName: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  const nameMap = new Map<string, string[]>(); // name -> [agentIds]
  
  // First pass: collect all agent names and check basic validation
  context.connectedAgents.forEach(agentId => {
    const agent = context.agents.get(agentId);
    if (!agent) return;
    
    const name = agent.props.name?.trim();
    
    // Check if name is missing
    if (!name) {
      const message = generateValidationMessage(ValidationIssueCode.MISSING_AGENT_NAME);
      issues.push({
        id: generateIssueId(ValidationIssueCode.MISSING_AGENT_NAME, agentId),
        code: ValidationIssueCode.MISSING_AGENT_NAME,
        severity: 'error',
        ...message,
        agentId,
      });
      return;
    }
    
    // Check if name is too short
    if (name.length < 3) {
      const message = generateValidationMessage(ValidationIssueCode.AGENT_NAME_TOO_SHORT, {
        agentName: agent.props.name
      });
      issues.push({
        id: generateIssueId(ValidationIssueCode.AGENT_NAME_TOO_SHORT, agentId),
        code: ValidationIssueCode.AGENT_NAME_TOO_SHORT,
        severity: 'error',
        ...message,
        agentId,
        agentName: agent.props.name,
      });
    }
    
    // Collect names for duplicate check
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(agentId);
  });
  
  // Second pass: check for duplicates
  nameMap.forEach((agentIds, name) => {
    if (agentIds.length > 1) {
      // Add issue for each agent with duplicate name
      agentIds.forEach(agentId => {
        const agent = context.agents.get(agentId);
        if (!agent) return;
        
        const message = generateValidationMessage(ValidationIssueCode.DUPLICATE_AGENT_NAME, {
          agentName: name
        });
        issues.push({
          id: generateIssueId(ValidationIssueCode.DUPLICATE_AGENT_NAME, agentId),
          code: ValidationIssueCode.DUPLICATE_AGENT_NAME,
          severity: 'error',
          ...message,
          agentId,
          agentName: name,
        });
      });
    }
  });
  
  return issues;
};

// Check if agent has prompt messages
export const validatePromptMessages: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent) => {
    const issues: ValidationIssue[] = [];
    
    if (agent.props.targetApiType === ApiType.Chat) {
      if (!agent.props.promptMessages || agent.props.promptMessages.length === 0) {
        const message = generateValidationMessage(ValidationIssueCode.MISSING_PROMPT, {
          agentName: agent.props.name
        });
        issues.push({
          id: generateIssueId(ValidationIssueCode.MISSING_PROMPT, agentId),
          code: ValidationIssueCode.MISSING_PROMPT,
          severity: 'error',
          ...message,
          agentId,
          agentName: agent.props.name,
        });
      }
    }
    
    return issues;
  }
);

// Check structured output configuration
export const validateStructuredOutput: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent) => {
    const issues: ValidationIssue[] = [];
    
    // Check if structured output is enabled
    const isStructuredOutputEnabled = 
      agent.props.outputFormat === OutputFormat.StructuredOutput || 
      agent.props.enabledStructuredOutput;
    
    if (isStructuredOutputEnabled) {
      if (!agent.props.schemaFields || agent.props.schemaFields.length === 0) {
        const message = generateValidationMessage(ValidationIssueCode.MISSING_STRUCTURED_OUTPUT_SCHEMA, {
          agentName: agent.props.name
        });
        issues.push({
          id: generateIssueId(ValidationIssueCode.MISSING_STRUCTURED_OUTPUT_SCHEMA, agentId),
          code: ValidationIssueCode.MISSING_STRUCTURED_OUTPUT_SCHEMA,
          severity: 'error',
          ...message,
          agentId,
          agentName: agent.props.name,
        });
      }
    }
    
    return issues;
  }
);