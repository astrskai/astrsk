import { ValidationIssue, ValidationIssueCode } from "@/entities/flow/model/validation-types";
import { ValidatorFunction } from "@/features/flow/flow-multi/validation/types/functional-validation-types";
import { forEachConnectedAgent, generateIssueId } from "@/features/flow/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/features/flow/flow-multi/validation/utils/message-generator";
import { ModelProviderRegistry } from "@/features/flow/flow-multi/validation/model-provider-registry";
import { Agent, PromptMessageType } from "@/entities/agent/domain";
import { MessageRole } from "@/shared/prompt/domain";
import { ApiSource } from "@/entities/api/domain";

// Check if there are non-system messages between system messages (for Google and Claude models)
export const validateSystemMessagePlacement: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent) => {
    const issues: ValidationIssue[] = [];
    
    const messages = agent.props.promptMessages || [];
    if (messages.length < 3) return issues; // Need at least 3 messages to have something between
    
    const modelName = agent.props.modelName;
    const providerInfo = modelName ? ModelProviderRegistry.detectModelProvider(modelName) : null;
    const isGemini = providerInfo?.provider === ApiSource.GoogleGenerativeAI;
    const isClaude = providerInfo?.provider === ApiSource.Anthropic;
    
    // Only validate for Google and Claude models
    if (!isGemini && !isClaude) return issues;
    
    let inSystemBlock = false;
    let foundNonSystem = false;
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      if (message.role === MessageRole.System) {
        if (foundNonSystem && inSystemBlock) {
          // We found a system message after finding non-system messages after other system messages
          const validationMessage = generateValidationMessage(
            ValidationIssueCode.NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES,
            { agentName: agent.props.name }
          );
          issues.push({
            id: generateIssueId(ValidationIssueCode.NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES, agentId),
            code: ValidationIssueCode.NON_SYSTEM_MESSAGE_BETWEEN_SYSTEM_MESSAGES,
            severity: 'warning',
            ...validationMessage,
            agentId,
            agentName: agent.props.name,
          });
          break; // One error is enough
        }
        inSystemBlock = true;
      } else {
        // Non-system message (user, assistant, or history)
        if (inSystemBlock) {
          foundNonSystem = true;
        }
      }
    }
    
    return issues;
  }
);

// Check if Gemini models have user or history message right after last system message
export const validateGeminiMessageStructure: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent) => {
    const issues: ValidationIssue[] = [];
    
    const modelName = agent.props.modelName;
    if (!modelName) return issues;
    
    const providerInfo = ModelProviderRegistry.detectModelProvider(modelName);
    if (providerInfo?.provider !== ApiSource.GoogleGenerativeAI) return issues;
    
    const messages = agent.props.promptMessages || [];
    if (messages.length === 0) return issues;
    
    // Find the last consecutive system message from the beginning
    let lastConsecutiveSystemIndex = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === MessageRole.System) {
        lastConsecutiveSystemIndex = i;
      } else {
        // Once we hit a non-system message, stop looking
        break;
      }
    }
    
    // If there are consecutive system messages at the start
    if (lastConsecutiveSystemIndex >= 0) {
      let isValidMessage = false;
      
      // Check if there's a message after the last consecutive system message
      if (lastConsecutiveSystemIndex < messages.length - 1) {
        const messageAfterSystem = messages[lastConsecutiveSystemIndex + 1];
        
        // Check if it's a user message
        if (messageAfterSystem.role === MessageRole.User) {
          isValidMessage = true;
        } 
        // Check if it's a history message
        else if ('type' in messageAfterSystem && messageAfterSystem.type === PromptMessageType.History) {
          isValidMessage = true;
        }
      }
      // If there's no message after system messages (only system messages), it's also invalid
      
      if (!isValidMessage) {
        const validationMessage = generateValidationMessage(
          ValidationIssueCode.MISSING_USER_MESSAGE_AFTER_SYSTEM,
          { agentName: agent.props.name }
        );
        issues.push({
          id: generateIssueId(ValidationIssueCode.MISSING_USER_MESSAGE_AFTER_SYSTEM, agentId),
          code: ValidationIssueCode.MISSING_USER_MESSAGE_AFTER_SYSTEM,
          severity: 'warning',
          ...validationMessage,
          agentId,
          agentName: agent.props.name,
        });
      }
    }
    
    return issues;
  }
);

// Check for history message usage
export const validateHistoryMessage: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent) => {
    const issues: ValidationIssue[] = [];
    
    const messages = agent.props.promptMessages || [];
    let hasHistoryVariable = false;
    
    for (const message of messages) {
      // Check if this is a HistoryPromptMessage
      if ('type' in message && message.type === PromptMessageType.History) {
        hasHistoryVariable = true;
        break;
      }
      
      // Check if message contains {{history}} variable
      if ('promptBlocks' in message) {
        const hasHistory = message.promptBlocks?.some(block => 
          block.type === 'plain' && block.template?.includes('{{history}}')
        );
        if (hasHistory) {
          hasHistoryVariable = true;
          break;
        }
      }
    }
    
    if (!hasHistoryVariable) {
      const message = generateValidationMessage(ValidationIssueCode.MISSING_HISTORY_MESSAGE, {
        agentName: agent.props.name
      });
      issues.push({
        id: generateIssueId(ValidationIssueCode.MISSING_HISTORY_MESSAGE, agentId),
        code: ValidationIssueCode.MISSING_HISTORY_MESSAGE,
        severity: 'warning',
        ...message,
        agentId,
        agentName: agent.props.name,
      });
    }
    
    return issues;
  }
);