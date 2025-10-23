/**
 * Filter resource data to only include editable fields
 * Removes metadata fields that should not be modified by AI
 */

import type { 
  EditableCharacterCard, 
  EditablePlotCard, 
  EditableFlowData,
  CompleteFlowData,
  EditableCard,
  ResourceType,
  EditableAgentData,
  EditableIfNodeData,
  EditableDataStoreNodeData,
  EditablePromptMessage,
  EditableSchemaField
} from 'vibe-shared-types';
import { 
  ApiType,
  SchemaFieldType
} from 'vibe-shared-types';
import { AgentDrizzleMapper } from '@/entities/agent/mappers/agent-drizzle-mapper';
import { IfNodeDrizzleMapper } from '@/entities/if-node/mappers/if-node-drizzle-mapper';
import { DataStoreNodeDrizzleMapper } from '@/entities/data-store-node/mappers/data-store-node-drizzle-mapper';
import { sanitizeFileName } from '@/shared/lib/file-utils';

/**
 * FIELD CATEGORIES:
 * 
 * METADATA (Not editable by AI):
 * - common.id
 * - common.icon_asset_id
 * - common.type
 * - common.tags
 * - common.creator
 * - common.card_summary
 * - common.version
 * - common.conceptual_origin
 * 
 * CONTENT FIELDS (Editable by AI):
 * - common.title (the display name)
 * - character.name (the character's actual name)
 * - character.description
 * - character.example_dialogue
 * - character.lorebook
 * - plot.description
 * - plot.scenarios
 * - plot.lorebook
 */

/**
 * Remove timestamp fields from any object
 * Filters out createdAt, updatedAt, created_at, updated_at
 */
function removeTimestamps<T extends Record<string, any>>(data: T): Omit<T, 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'> {
  const { createdAt, updatedAt, created_at, updated_at, ...cleanData } = data;
  return cleanData;
}

/**
 * Filter character card data to only include content fields that should be editable by AI
 */
export function filterEditableCharacterCardFields(cardData: any): EditableCharacterCard | null {
  if (!cardData || !cardData.character) return null;
  
  // Remove timestamp fields first
  const cleanCardData = removeTimestamps(cardData);
  
  return {
    common: {
      title: cleanCardData.common?.title || '',
    },
    character: {
      name: cleanCardData.character.name || '',
      description: cleanCardData.character.description || '',
      example_dialogue: cleanCardData.character.example_dialogue || '',
      lorebook: cleanCardData.character.lorebook || { entries: [] },
    }
  };
}

/**
 * Filter plot card data to only include content fields that should be editable by AI
 */
export function filterEditablePlotCardFields(cardData: any): EditablePlotCard | null {
  if (!cardData || !cardData.plot) return null;
  
  // Remove timestamp fields first
  const cleanPlotData = removeTimestamps(cardData);
  
  return {
    common: {
      title: cleanPlotData.common?.title || '',
    },
    plot: {
      description: cleanPlotData.plot.description || '',
      scenarios: cleanPlotData.plot.scenarios || [],
      lorebook: cleanPlotData.plot.lorebook || { entries: [] },
    }
  };
}

/**
 * Filter card data to only include content fields that should be editable by AI
 * Returns proper typed EditableCard
 */
export function filterEditableCardFields(cardData: any): EditableCard | null {
  if (!cardData) return null;
  
  // Determine card type and return appropriately typed data
  if (cardData.character) {
    return filterEditableCharacterCardFields(cardData);
  } else if (cardData.plot) {
    return filterEditablePlotCardFields(cardData);
  }
  
  return null;
}

/**
 * Filter agent data to only include editable fields
 * Converts from Agent persistence format to EditableAgentData
 */
export function filterEditableAgentFields(agentPersistenceData: any): EditableAgentData | null {
  if (!agentPersistenceData) {
    return null;
  }
  
  // Remove timestamp fields first
  const cleanData = removeTimestamps(agentPersistenceData);
  
  // Convert from persistence format (snake_case) to domain object (camelCase with props)
  let agentDomain;
  try {
    agentDomain = AgentDrizzleMapper.toDomain(cleanData as any);
  } catch (error) {
    console.error('Failed to convert agent to domain:', error);
    return null;
  }
  
  // Now extract editable fields from the domain object
  const props = agentDomain.props;
  
  // Convert prompt messages to editable format
  const promptMessages: EditablePromptMessage[] = [];
  if (props.promptMessages && Array.isArray(props.promptMessages)) {
    props.promptMessages.forEach((msg: any) => {
      // Domain objects have props structure
      const msgData = msg.props;
      
      if (msgData.type === 'plain') {
        promptMessages.push({
          id: msgData.id,
          type: 'plain',
          enabled: msgData.enabled,
          role: msgData.role,
          promptBlocks: msgData.promptBlocks?.map((block: any) => ({
            id: block.props.id,
            template: block.props.template
          })) || []
        });
      } else if (msgData.type === 'history') {
        const historyMessage: any = {
          id: msgData.id,
          type: 'history',
          enabled: msgData.enabled,
          historyType: msgData.historyType,
          start: msgData.start,
          end: msgData.end,
          countFromEnd: msgData.countFromEnd
        };
        
        if (msgData.userPromptBlocks) {
          historyMessage.userPromptBlocks = msgData.userPromptBlocks.map((block: any) => ({
            id: block.props.id,
            template: block.props.template
          }));
        }
        
        if (msgData.assistantPromptBlocks) {
          historyMessage.assistantPromptBlocks = msgData.assistantPromptBlocks.map((block: any) => ({
            id: block.props.id,
            template: block.props.template
          }));
        }
        
        if (msgData.userMessageRole) historyMessage.userMessageRole = msgData.userMessageRole;
        if (msgData.charMessageRole) historyMessage.charMessageRole = msgData.charMessageRole;
        if (msgData.subCharMessageRole) historyMessage.subCharMessageRole = msgData.subCharMessageRole;
        
        promptMessages.push(historyMessage);
      }
    });
  }
  
  // Convert schema fields to editable format
  const schemaFields: EditableSchemaField[] = [];
  if (props.schemaFields && Array.isArray(props.schemaFields)) {
    props.schemaFields.forEach((field: any) => {
      schemaFields.push({
        name: field.name,
        description: field.description,
        required: field.required,
        array: field.array,
        type: field.type as SchemaFieldType,
        minimum: field.minimum,
        maximum: field.maximum,
        enum: field.enum
      });
    });
  }
  
  // Build result from domain object props - sanitize name for backend template usage
  // Filter out non-editable fields: description, color
  const result: EditableAgentData = {
    id: agentDomain.id.toString(),
    name: sanitizeFileName(props.name), // Frontend sanitizes agent name so backend only works with sanitized versions
    targetApiType: props.targetApiType,
    enabledStructuredOutput: props.enabledStructuredOutput
  };
  
  // Add optional fields if they exist
  if (promptMessages.length > 0) {
    result.promptMessages = promptMessages;
  }
  
  if (props.textPrompt !== undefined) {
    result.textPrompt = props.textPrompt;
  }
  
  if (props.schemaDescription !== undefined) {
    result.schemaDescription = props.schemaDescription;
  }
  
  if (schemaFields.length > 0) {
    result.schemaFields = schemaFields;
  }
  
  return result;
}

/**
 * Filter if-node data to only include editable fields
 */
export function filterEditableIfNodeFields(ifNodePersistenceData: any): EditableIfNodeData | null {
  if (!ifNodePersistenceData) return null;
  
  // Remove timestamp fields first
  const cleanData = removeTimestamps(ifNodePersistenceData);
  
  // Convert from persistence format to domain object
  let ifNodeDomain;
  try {
    ifNodeDomain = IfNodeDrizzleMapper.toDomain(cleanData as any);
  } catch (error) {
    console.error('Failed to convert if-node to domain:', error);
    return null;
  }
  
  // Extract editable fields from domain object
  return {
    id: ifNodeDomain.id.toString(),
    flowId: ifNodeDomain.flowId,
    name: ifNodeDomain.name,
    logicOperator: ifNodeDomain.logicOperator,
    conditions: ifNodeDomain.conditions
  };
}

/**
 * Filter data-store node data to only include editable fields
 */
export function filterEditableDataStoreNodeFields(dataStoreNodePersistenceData: any): EditableDataStoreNodeData | null {
  if (!dataStoreNodePersistenceData) return null;
  
  // Remove timestamp fields first
  const cleanData = removeTimestamps(dataStoreNodePersistenceData);
  
  // Convert from persistence format to domain object
  let dataStoreNodeDomain;
  try {
    dataStoreNodeDomain = DataStoreNodeDrizzleMapper.toDomain(cleanData as any);
  } catch (error) {
    console.error('Failed to convert data-store-node to domain:', error);
    return null;
  }
  
  // Extract editable fields from domain object
  return {
    id: dataStoreNodeDomain.id.toString(),
    flowId: dataStoreNodeDomain.flowId,
    name: dataStoreNodeDomain.name,
    color: dataStoreNodeDomain.color,
    dataStoreFields: dataStoreNodeDomain.dataStoreFields
  };
}

/**
 * Filter flow data to include editable fields and structure
 * Returns proper typed EditableFlowData
 * 
 * For flows, we include:
 * - Flow name (title)
 * - Response template (response design)
 * - Data store schema
 * - Nodes and edges (with original UUIDs for backend to map)
 * - Separate agent, if-node, and data-store node data
 * 
 * The backend will convert UUIDs to simple IDs for AI processing,
 * then map them back when returning changes.
 */
export function filterEditableFlowFields(flowData: any): EditableFlowData | null {
  if (!flowData) return null;
  
  // Filter node implementations to proper types
  const filteredAgents: Record<string, EditableAgentData> = {};
  if (flowData.agents) {
    Object.entries(flowData.agents).forEach(([nodeId, agentData]: [string, any]) => {
      // Filter agent data for AI editing (filterEditableAgentFields handles timestamp removal and conversion)
      const filtered = filterEditableAgentFields(agentData);
      if (filtered) {
        filteredAgents[nodeId] = filtered;
      }
    });
  }
  
  const filteredIfNodes: Record<string, EditableIfNodeData> = {};
  if (flowData.ifNodes) {
    Object.entries(flowData.ifNodes).forEach(([nodeId, ifNodeData]: [string, any]) => {
      // Filter if-node data (filterEditableIfNodeFields handles timestamp removal and conversion)
      const filtered = filterEditableIfNodeFields(ifNodeData);
      if (filtered) {
        filteredIfNodes[nodeId] = filtered;
      }
    });
  }
  
  const filteredDataStoreNodes: Record<string, EditableDataStoreNodeData> = {};
  if (flowData.dataStoreNodes) {
    Object.entries(flowData.dataStoreNodes).forEach(([nodeId, dataStoreNodeData]: [string, any]) => {
      // Filter data-store node data (filterEditableDataStoreNodeFields handles timestamp removal and conversion)
      const filtered = filterEditableDataStoreNodeFields(dataStoreNodeData);
      if (filtered) {
        filteredDataStoreNodes[nodeId] = filtered;
      }
    });
  }
  
  const result = {
    name: flowData.name,
    response_template: flowData.response_template || flowData.responseTemplate,
    data_store_schema: flowData.data_store_schema || flowData.dataStoreSchema,
    // Include nodes and edges with original UUIDs
    nodes: flowData.nodes?.map((node: any) => {
      const nodeData: any = {
        id: node.id,
        type: node.type,
        position: node.position,
      };
      
      // Ensure data is always present and is an object
      nodeData.data = node.data || {};
      
      if (node.name) {
        nodeData.name = node.name;
      }
      return nodeData;
    }) || [],
    edges: flowData.edges || [],
    // Always include node data fields (even if empty) so backend knows they exist
    agents: filteredAgents,
    ifNodes: filteredIfNodes,
    dataStoreNodes: filteredDataStoreNodes
  };
  
  return result;
}

/**
 * Prepare complete flow data with all associated entities
 * This matches the export format with agents as a Record
 */
export function prepareCompleteFlowData(
  flowData: any,
  agents?: Record<string, any>,
  ifNodes?: Array<any>,
  dataStoreNodes?: Array<any>
): CompleteFlowData {
  const baseFlow = filterEditableFlowFields(flowData);
  if (!baseFlow) {
    return {
      name: '',
      response_template: '',
      nodes: [],
      edges: [],
      data_store_schema: undefined,
      agents: agents || {},
      ifNodes: ifNodes || [],
      dataStoreNodes: dataStoreNodes || []
    };
  }
  
  return {
    name: baseFlow.name,
    response_template: baseFlow.response_template,
    data_store_schema: baseFlow.data_store_schema,
    // Ensure nodes have required data field for CompleteFlowData
    nodes: (baseFlow.nodes || []).map(node => ({
      ...node,
      data: node.data || {}
    })),
    edges: baseFlow.edges || [],
    agents: agents || {},
    ifNodes: ifNodes || [],
    dataStoreNodes: dataStoreNodes || []
  };
}

/**
 * Filter resource based on its type with proper return typing
 */
export function filterEditableResourceFields<T extends ResourceType>(
  resourceType: T,
  resourceData: any
): EditableCharacterCard | EditablePlotCard | EditableFlowData | null {
  if (!resourceData) return null;
  
  switch (resourceType) {
    case 'character_card':
      return filterEditableCharacterCardFields(resourceData);
    case 'plot_card':
      return filterEditablePlotCardFields(resourceData);
    case 'flow':
      return filterEditableFlowFields(resourceData);
    default:
      return null;
  }
}