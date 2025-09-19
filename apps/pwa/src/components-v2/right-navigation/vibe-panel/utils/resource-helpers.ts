import { SimpleResource } from '../types';

/**
 * Get editable fields for a resource based on its type
 */
export function getEditableFields(resource: any, resourceType: SimpleResource['type']) {
  if (resourceType === 'flow') {
    return filterEditableFlowFields(resource);
  } else if (resourceType === 'character_card' || resourceType === 'plot_card') {
    return filterEditableCardFields(resource);
  }
  return resource;
}

/**
 * Filter flow to only include editable fields
 */
function filterEditableFlowFields(flow: any) {
  if (!flow) return null;

  const editableFlow: any = {
    id: flow.id,
    name: flow.name,
    response_template: flow.response_template || flow.props?.responseTemplate,
    data_store_schema: flow.data_store_schema || flow.props?.dataStoreSchema,
  };

  // Add agents with editable fields
  if (flow.agents) {
    editableFlow.agents = {};
    Object.entries(flow.agents).forEach(([nodeId, agent]: [string, any]) => {
      editableFlow.agents[nodeId] = filterEditableAgentFields(agent);
    });
  }

  // Add if nodes
  if (flow.ifNodes) {
    editableFlow.ifNodes = {};
    Object.entries(flow.ifNodes).forEach(([nodeId, ifNode]: [string, any]) => {
      editableFlow.ifNodes[nodeId] = {
        condition: ifNode.condition,
        nodeLabel: ifNode.nodeLabel,
      };
    });
  }

  // Add data store nodes
  if (flow.dataStoreNodes) {
    editableFlow.dataStoreNodes = {};
    Object.entries(flow.dataStoreNodes).forEach(([nodeId, dsNode]: [string, any]) => {
      editableFlow.dataStoreNodes[nodeId] = {
        nodeLabel: dsNode.nodeLabel,
        operation: dsNode.operation,
        targetField: dsNode.targetField,
        value: dsNode.value,
      };
    });
  }

  // Add nodes and edges for structural changes
  if (flow.nodes) {
    editableFlow.nodes = flow.nodes;
  }
  if (flow.edges) {
    editableFlow.edges = flow.edges;
  }

  return editableFlow;
}

/**
 * Filter agent to only include editable fields
 */
function filterEditableAgentFields(agent: any) {
  if (!agent) return null;

  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    targetApiType: agent.targetApiType,
    apiSource: agent.apiSource,
    modelId: agent.modelId,
    modelName: agent.modelName,
    promptMessages: agent.promptMessages || [],
    textPrompt: agent.textPrompt,
    enabledParameters: agent.enabledParameters,
    parameterValues: agent.parameterValues,
    enabledStructuredOutput: agent.enabledStructuredOutput,
    outputFormat: agent.outputFormat,
    outputStreaming: agent.outputStreaming,
    schemaName: agent.schemaName,
    schemaDescription: agent.schemaDescription,
    schemaFields: agent.schemaFields || [],
  };
}

/**
 * Filter card to only include editable fields
 */
function filterEditableCardFields(card: any) {
  if (!card) return null;

  const editableCard: any = {
    id: card.id,
    spec: card.spec,
  };

  // Common fields
  if (card.common) {
    editableCard.common = {
      title: card.common.title,
      tags: card.common.tags,
      creator: card.common.creator,
      attachments: card.common.attachments,
    };
  }

  // Character-specific fields
  if (card.character) {
    editableCard.character = {
      name: card.character.name,
      description: card.character.description,
      personality: card.character.personality,
      appearance: card.character.appearance,
      connections: card.character.connections,
      nicknames: card.character.nicknames,
      background: card.character.background,
      mannerisms: card.character.mannerisms,
      voice: card.character.voice,
    };

    // Lorebook
    if (card.character.lorebook) {
      editableCard.character.lorebook = {
        entries: card.character.lorebook.entries || [],
      };
    }

    // Example dialogues
    if (card.character.exampleDialogue) {
      editableCard.character.exampleDialogue = card.character.exampleDialogue;
    }
  }

  // Plot-specific fields
  if (card.plot) {
    editableCard.plot = {
      description: card.plot.description,
      requirements: card.plot.requirements,
    };

    // Scenarios
    if (card.plot.scenarios) {
      editableCard.plot.scenarios = card.plot.scenarios;
    }
  }

  return editableCard;
}

/**
 * Get resource type from resource data
 */
export function getResourceType(resource: any): SimpleResource['type'] {
  if (resource.nodes && resource.edges) {
    return 'flow';
  } else if (resource.spec === 'chara_card_v2' || resource.character) {
    return 'character_card';
  } else if (resource.spec === 'plot_card_v1' || resource.plot) {
    return 'plot_card';
  }
  throw new Error('Unknown resource type');
}

/**
 * Create resource type mapping for backend
 */
export function createResourceTypeMapping(resources: SimpleResource[]): Record<string, SimpleResource['type']> {
  const mapping: Record<string, SimpleResource['type']> = {};
  resources.forEach(resource => {
    mapping[resource.id] = resource.type;
  });
  return mapping;
}