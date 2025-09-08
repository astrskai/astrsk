/**
 * Agent Operation Processors for Flow Resources
 * Handles agent-specific operations like promptMessages, field updates, etc.
 * 
 * Following successful patterns from IF node and data store node direct service calls:
 * 1. Initialize data structures properly
 * 2. Manipulate the full resource object
 * 3. Return OperationResult with success/error status
 * 4. Handle resource state properly like successful direct service calls
 */

import { pathPatterns, PathProcessor, OperationContext, PathMatchResult } from '../../path-processor-factory';
import { UniqueEntityID } from '@/shared/domain';
import { OperationResult } from '../../operation-processor-factory';
import { handleOperationError, handleCriticalError, handleDebugError } from '../../operation-error-handler';

/**
 * Create a properly structured agent prompt message from partial data
 * Uses the same domain parsing logic as direct service calls
 */
async function createAgentPromptMessageFromData(data: any): Promise<any> {
  try {
    // Use the same domain parsing logic that direct service calls use
    const { parsePromptMessage } = await import("@/modules/agent/domain/prompt-message");
    
    // Handle both plain and history message types
    let domainData: any = {
      id: data.id || new UniqueEntityID().toString(),
      type: data.type || 'plain',
      enabled: data.enabled ?? true,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt
    };

    if (data.type === 'history') {
      // History message structure - preserve all history-specific fields
      console.log('🏗️ [AGENT-OPERATIONS] Processing history message with data:', data);
      
      // Transform user prompt blocks
      const transformedUserPromptBlocks = (data.userPromptBlocks || []).map((block: any) => ({
        id: block.id || new UniqueEntityID().toString(),
        name: block.name || 'User Block',
        type: block.type || 'plain',
        template: block.template || block.content || '',
        isDeleteUnnecessaryCharacters: block.isDeleteUnnecessaryCharacters ?? false,
        createdAt: block.createdAt || new Date(),
        updatedAt: block.updatedAt || new Date()
      }));

      // Transform assistant prompt blocks  
      const transformedAssistantPromptBlocks = (data.assistantPromptBlocks || []).map((block: any) => ({
        id: block.id || new UniqueEntityID().toString(),
        name: block.name || 'Assistant Block',
        type: block.type || 'plain',
        template: block.template || block.content || '',
        isDeleteUnnecessaryCharacters: block.isDeleteUnnecessaryCharacters ?? false,
        createdAt: block.createdAt || new Date(),
        updatedAt: block.updatedAt || new Date()
      }));

      domainData = {
        ...domainData,
        historyType: data.historyType || 'split',
        start: data.start ?? 0,
        end: data.end ?? 12,
        countFromEnd: data.countFromEnd ?? true,
        userPromptBlocks: transformedUserPromptBlocks,
        assistantPromptBlocks: transformedAssistantPromptBlocks,
        userMessageRole: data.userMessageRole || 'user',
        charMessageRole: data.charMessageRole || 'assistant', 
        subCharMessageRole: data.subCharMessageRole || 'user'
      };
    } else {
      // Plain message structure - transform regular prompt blocks
      const transformedPromptBlocks = (data.promptBlocks || []).map((block: any) => ({
        id: block.id || new UniqueEntityID().toString(),
        name: block.name || 'Unnamed Block',
        type: block.type || 'plain',
        template: block.template || block.content || '',
        isDeleteUnnecessaryCharacters: block.isDeleteUnnecessaryCharacters ?? false,
        createdAt: block.createdAt || new Date(),
        updatedAt: block.updatedAt || new Date()
      }));

      domainData = {
        ...domainData,
        role: data.role || 'system',
        promptBlocks: transformedPromptBlocks
      };
    }
    
    const messageResult = parsePromptMessage(domainData);
    if (messageResult.isSuccess) {
      // Return the JSON representation like direct service calls do
      return messageResult.getValue().toJSON();
    } else {
      // Use debug error handling for domain parsing failures (not critical, has fallback)
      handleDebugError(messageResult.getError(), {
        operation: 'parse_prompt_message',
        path: 'domain.promptMessage',
        processor: 'agent-operations',
        inputData: data,
        transformedData: domainData
      });
      // Fallback to simple structure
      return domainData;
    }
  } catch (error) {
    console.error('Error creating prompt message from domain:', error);
    // Fallback to preserve original structure based on type
    if (data.type === 'history') {
      return {
        id: data.id || new UniqueEntityID().toString(),
        type: 'history',
        enabled: data.enabled ?? true,
        historyType: data.historyType || 'split',
        start: data.start ?? 0,
        end: data.end ?? 12,
        countFromEnd: data.countFromEnd ?? true,
        userPromptBlocks: data.userPromptBlocks || [],
        assistantPromptBlocks: data.assistantPromptBlocks || [],
        userMessageRole: data.userMessageRole || 'user',
        charMessageRole: data.charMessageRole || 'assistant', 
        subCharMessageRole: data.subCharMessageRole || 'user',
        createdAt: new Date()
      };
    } else {
      return {
        id: data.id || new UniqueEntityID().toString(),
        type: data.type || 'plain',
        role: data.role || 'system',
        enabled: data.enabled ?? true,
        promptBlocks: data.promptBlocks || [],
        createdAt: new Date()
      };
    }
  }
}

/**
 * Create a properly structured agent schema field from partial data
 */
function createAgentSchemaFieldFromData(data: any): any {
  return {
    id: data.id || new UniqueEntityID().toString(),
    name: data.name || 'newField',
    type: data.type || 'string',
    description: data.description || '',
    required: data.required ?? false,
    defaultValue: data.defaultValue || null
  };
}

/**
 * Agent operation processors - following successful direct service call patterns
 */
export const agentProcessors = {
  // Schema fields processors (most specific patterns first)
  agentSchemaFieldsAppend: {
    pattern: pathPatterns.agents.schemaFields.append,
    description: "Append new schema field to agent",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;

        if (operation === 'put') {
          // Initialize agent structure if needed (like direct service calls do)
          if (!resource.agents) resource.agents = {};
          if (!resource.agents[agentId]) resource.agents[agentId] = {};
          if (!resource.agents[agentId].schemaFields) resource.agents[agentId].schemaFields = [];

          // Create a new schema field from the provided data
          const schemaField = createAgentSchemaFieldFromData(value);
          resource.agents[agentId].schemaFields.push(schemaField);
          
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent schemaFields append`), {
          operation: 'append_agent_schema_field',
          path: `agents.${match.groups.group1}.schemaFields.append`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_agent_schema_field',
          path: `agents.${match.groups.group1}.schemaFields.append`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  agentSchemaFieldsIndexed: {
    pattern: pathPatterns.agents.schemaFields.indexed,
    description: "Update specific schema field by index",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;
        const fieldIndex = parseInt(match.groups.group2);

        // Initialize agent structure if needed (like direct service calls do)
        if (!resource.agents) resource.agents = {};
        if (!resource.agents[agentId]) resource.agents[agentId] = {};
        if (!resource.agents[agentId].schemaFields) resource.agents[agentId].schemaFields = [];

        const fields = resource.agents[agentId].schemaFields;

        // Extend array if needed (robust like direct service calls)
        while (fields.length <= fieldIndex) {
          fields.push(createAgentSchemaFieldFromData({}));
        }

        if (operation === 'set') {
          fields[fieldIndex] = value;
          return { success: true, result: resource };
        }

        if (operation === 'put') {
          // PUT should INSERT at the index, shifting existing items
          const schemaField = createAgentSchemaFieldFromData(value);
          fields.splice(fieldIndex, 0, schemaField);
          return { success: true, result: resource };
        }

        if (operation === 'remove') {
          fields.splice(fieldIndex, 1);
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent schemaFields[${fieldIndex}]`), {
          operation: 'update_agent_schema_field_indexed',
          path: `agents.${match.groups.group1}.schemaFields[${fieldIndex}]`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_agent_schema_field_indexed',
          path: `agents.${match.groups.group1}.schemaFields[${match.groups.group2}]`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  agentSchemaFieldsField: {
    pattern: pathPatterns.agents.schemaFields.field,
    description: "Update specific property of a schema field",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;
        const fieldIndex = parseInt(match.groups.group2);
        const fieldName = match.groups.group3;

        // Initialize agent structure if needed (like direct service calls do)
        if (!resource.agents) resource.agents = {};
        if (!resource.agents[agentId]) resource.agents[agentId] = {};
        if (!resource.agents[agentId].schemaFields) resource.agents[agentId].schemaFields = [];

        const fields = resource.agents[agentId].schemaFields;

        // Extend array if needed and ensure field exists (robust like direct service calls)
        while (fields.length <= fieldIndex) {
          fields.push(createAgentSchemaFieldFromData({}));
        }

        if (!fields[fieldIndex]) {
          fields[fieldIndex] = createAgentSchemaFieldFromData({});
        }

        if (operation === 'set') {
          // Auto-detect and parse JSON strings (from lorebook pattern)
          let processedValue = value;
          if (typeof value === 'string' && value.trim().match(/^[\[{].*[\]}]$/)) {
            try {
              processedValue = JSON.parse(value);
            } catch (error) {
              // Use original value if parsing fails
            }
          }
          
          fields[fieldIndex][fieldName] = processedValue;
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent schemaFields[${fieldIndex}].${fieldName}`), {
          operation: 'update_agent_schema_field_property',
          path: `agents.${match.groups.group1}.schemaFields[${fieldIndex}].${fieldName}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_agent_schema_field_property',
          path: `agents.${match.groups.group1}.schemaFields[${match.groups.group2}].${match.groups.group3}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  // Agent prompt messages array operations
  agentPromptMessagesAppend: {
    pattern: pathPatterns.agents.promptMessages.append,
    description: "Append new prompt message to agent",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;

        if (operation === 'put') {
          // Initialize agent structure if needed (like direct service calls do)
          if (!resource.agents) resource.agents = {};
          if (!resource.agents[agentId]) resource.agents[agentId] = {};
          if (!resource.agents[agentId].promptMessages) resource.agents[agentId].promptMessages = [];

          // Create a new prompt message using domain parsing logic (like direct service calls)
          const promptMessage = await createAgentPromptMessageFromData(value);
          resource.agents[agentId].promptMessages.push(promptMessage);
          
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent promptMessages append`), {
          operation: 'append_agent_prompt_message',
          path: `agents.${match.groups.group1}.promptMessages.append`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_agent_prompt_message',
          path: `agents.${match.groups.group1}.promptMessages.append`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  // Agent prompt messages indexed operations
  agentPromptMessagesIndexed: {
    pattern: pathPatterns.agents.promptMessages.indexed,
    description: "Update specific prompt message by index",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;
        const messageIndex = parseInt(match.groups.group2);

        // Initialize agent structure if needed (like direct service calls do)
        if (!resource.agents) resource.agents = {};
        if (!resource.agents[agentId]) resource.agents[agentId] = {};
        if (!resource.agents[agentId].promptMessages) resource.agents[agentId].promptMessages = [];

        const messages = resource.agents[agentId].promptMessages;

        // Extend array if needed (robust like direct service calls)
        while (messages.length <= messageIndex) {
          messages.push(await createAgentPromptMessageFromData({}));
        }

        if (operation === 'set') {
          const promptMessage = await createAgentPromptMessageFromData(value);
          messages[messageIndex] = promptMessage;
          return { success: true, result: resource };
        }

        if (operation === 'put') {
          // PUT should INSERT at the index, shifting existing items
          const promptMessage = await createAgentPromptMessageFromData(value);
          messages.splice(messageIndex, 0, promptMessage);
          return { success: true, result: resource };
        }

        if (operation === 'remove') {
          messages.splice(messageIndex, 1);
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent promptMessages[${messageIndex}]`), {
          operation: 'update_agent_prompt_message_indexed',
          path: `agents.${match.groups.group1}.promptMessages[${messageIndex}]`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_agent_prompt_message_indexed',
          path: `agents.${match.groups.group1}.promptMessages[${match.groups.group2}]`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  // Agent prompt message field updates
  agentPromptMessageFieldUpdate: {
    pattern: pathPatterns.agents.promptMessages.field,
    description: "Update field of specific prompt message",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;
        const messageIndex = parseInt(match.groups.group2);
        const fieldName = match.groups.group3;

        // Initialize agent structure if needed (like direct service calls do)
        if (!resource.agents) resource.agents = {};
        if (!resource.agents[agentId]) resource.agents[agentId] = {};
        if (!resource.agents[agentId].promptMessages) resource.agents[agentId].promptMessages = [];

        const messages = resource.agents[agentId].promptMessages;

        // Extend array if needed and ensure message exists (robust like direct service calls)
        while (messages.length <= messageIndex) {
          messages.push(await createAgentPromptMessageFromData({}));
        }

        if (!messages[messageIndex]) {
          messages[messageIndex] = await createAgentPromptMessageFromData({});
        }

        if (operation === 'set') {
          messages[messageIndex][fieldName] = value;
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent promptMessages[${messageIndex}].${fieldName}`), {
          operation: 'update_agent_prompt_message_field',
          path: `agents.${match.groups.group1}.promptMessages[${messageIndex}].${fieldName}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_agent_prompt_message_field',
          path: `agents.${match.groups.group1}.promptMessages[${match.groups.group2}].${match.groups.group3}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  // Generic agent field updates (fallback - should be last to avoid pattern conflicts)
  agentFieldUpdate: {
    pattern: pathPatterns.agents.field,
    description: "Update agent field (name, description, etc.)",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const { operation, value, resource } = context;
        const agentId = match.groups.group1;
        const fieldName = match.groups.group2;

        // Initialize agent structure if needed (like direct service calls do)
        if (!resource.agents) resource.agents = {};
        if (!resource.agents[agentId]) resource.agents[agentId] = {};

        if (operation === 'set') {
          resource.agents[agentId][fieldName] = value;
          return { success: true, result: resource };
        }

        return handleOperationError(new Error(`Unsupported operation '${operation}' for agent field ${fieldName}`), {
          operation: 'update_agent_field',
          path: `agents.${match.groups.group1}.${fieldName}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_agent_field',
          path: `agents.${match.groups.group1}.${match.groups.group2}`,
          processor: 'agent-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor
};