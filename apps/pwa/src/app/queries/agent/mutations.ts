/**
 * Agent Mutations
 * 
 * Combined hook that returns all mutations for an agent
 */

import { 
  useUpdateAgentName,
  useUpdateAgentDescription,
  useUpdateAgentColor
} from './mutations/metadata-mutations';

import {
  useUpdateAgentApiType,
  useUpdateAgentModel,
  useUpdateAgentTokenCount
} from './mutations/model-mutations';

import {
  useUpdateAgentTextPrompt,
  useAddAgentPromptMessage,
  useRemoveAgentPromptMessage,
  useUpdateAgentPromptMessage,
  useReorderAgentPromptMessages,
  useToggleAgentPromptMessage
} from './mutations/prompt-mutations';

import {
  useUpdateAgentParameterValue,
  useUpdateAgentParameters,
  useToggleAgentParameter,
  useResetAgentParameters
} from './mutations/parameter-mutations';

import {
  useToggleAgentStructuredOutput,
  useUpdateAgentOutputFormat,
  useUpdateAgentSchemaMetadata,
  useAddAgentSchemaField,
  useRemoveAgentSchemaField,
  useUpdateAgentSchemaField,
  useReorderAgentSchemaFields
} from './mutations/structured-output-mutations';

/**
 * Combined hook that returns all mutations for an agent
 * 
 * @param agentId - The agent ID
 * @param flowId - The flow ID (optional, used for validation invalidation)
 * @returns All agent mutations
 * 
 * @example
 * const mutations = useAgentMutations(agentId, flowId);
 * 
 * // Update agent name
 * mutations.updateName.mutate("New Agent Name");
 * 
 * // Use isEditing for text fields
 * const { data } = useQuery({
 *   ...agentQueries.detail(agentId),
 *   enabled: !mutations.updateName.isEditing
 * });
 */
export const useAgentMutations = (agentId: string, flowId?: string) => {
  // Use empty string if flowId not provided to satisfy hooks
  const fId = flowId || '';
  
  return {
    // Metadata mutations
    updateName: useUpdateAgentName(fId, agentId),
    updateDescription: useUpdateAgentDescription(fId, agentId),
    updateColor: useUpdateAgentColor(fId, agentId),
    
    // Model mutations
    updateApiType: useUpdateAgentApiType(fId, agentId),
    updateModel: useUpdateAgentModel(fId, agentId),
    updateTokenCount: useUpdateAgentTokenCount(fId, agentId),
    
    // Prompt mutations
    updateTextPrompt: useUpdateAgentTextPrompt(fId, agentId),
    addPromptMessage: useAddAgentPromptMessage(fId, agentId),
    removePromptMessage: useRemoveAgentPromptMessage(fId, agentId),
    reorderPromptMessages: useReorderAgentPromptMessages(fId, agentId),
    
    // Parameter mutations
    updateParameterValue: useUpdateAgentParameterValue(fId, agentId),
    updateParameters: useUpdateAgentParameters(fId, agentId),
    toggleParameter: useToggleAgentParameter(fId, agentId),
    resetParameters: useResetAgentParameters(fId, agentId),
    
    // Structured output mutations
    toggleStructuredOutput: useToggleAgentStructuredOutput(fId, agentId),
    updateOutputFormat: useUpdateAgentOutputFormat(fId, agentId),
    updateSchemaMetadata: useUpdateAgentSchemaMetadata(fId, agentId),
    addSchemaField: useAddAgentSchemaField(fId, agentId),
    removeSchemaField: useRemoveAgentSchemaField(fId, agentId),
    updateSchemaField: useUpdateAgentSchemaField(fId, agentId),
    reorderSchemaFields: useReorderAgentSchemaFields(fId, agentId),
  };
};

// Re-export individual hooks for direct use
export * from './mutations/metadata-mutations';
export * from './mutations/model-mutations';
export * from './mutations/prompt-mutations';
export * from './mutations/parameter-mutations';
export * from './mutations/structured-output-mutations';