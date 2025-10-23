/**
 * Hook that provides the logic for finding and updating agent references when renaming
 * Returns the updated data that can be saved using mutations in the component
 */

import { Agent } from "@/entities/agent/domain";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";
import { sanitizeFileName } from "@/shared/lib/file-utils";
import { replaceAgentReferences, hasAgentReferences } from "@/features/flow/flow-multi/utils/extract-agent-variables";

interface UpdateResult {
  updatedAgents: Agent[];
  responseTemplateChanged: boolean;
  totalReferencesUpdated: number;
  updatedResponseTemplate?: string;
  updatedNodes?: any[]; // Non-agent nodes that were updated (if-nodes, data-store nodes)
}

/**
 * Get all agents from flow nodes
 */
async function getAllAgentsFromFlow(flow: any): Promise<Map<string, Agent>> {
  const agentNodes = flow.props.nodes.filter((n: any) => n.type === 'agent');
  const agentMap = new Map<string, Agent>();
  
  // Fetch all agents
  for (const node of agentNodes) {
    const agentId = node.data?.agentId || node.id;
    try {
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isSuccess) {
        agentMap.set(agentId, agentResult.getValue());
      }
    } catch (error) {
      console.warn(`Failed to load agent ${agentId}:`, error);
    }
  }
  
  return agentMap;
}

export function useAgentReferenceMutations() {

  /**
   * Update all references to an agent when its name changes
   */
  const updateAgentNameReferences = async (
    oldName: string,
    newName: string,
    currentAgentId: string,
    currentFlow: any
  ): Promise<UpdateResult> => {
    // Get all agents from flow nodes
    const flowAgents = await getAllAgentsFromFlow(currentFlow);
    
    const oldSanitizedName = sanitizeFileName(oldName);
    const newSanitizedName = sanitizeFileName(newName);
    
    console.log('🔍 Agent rename reference update:', {
      oldName,
      newName,
      oldSanitizedName,
      newSanitizedName,
      currentAgentId,
      totalAgents: flowAgents.size
    });
    
    if (oldSanitizedName === newSanitizedName) {
      console.log('⚠️ Sanitized names are identical, no updates needed');
      return { updatedAgents: [], responseTemplateChanged: false, totalReferencesUpdated: 0 };
    }
    
    const updatedAgents: Agent[] = [];
    let totalReferencesUpdated = 0;
    
    flowAgents.forEach((agent, agentId) => {
      let agentChanged = false;
      
      // Check and update textPrompt for text-based agents
      let updatedTextPrompt = agent.props.textPrompt;
      if (updatedTextPrompt && hasAgentReferences(updatedTextPrompt, oldSanitizedName)) {
        const beforeUpdate = updatedTextPrompt;
        updatedTextPrompt = replaceAgentReferences(updatedTextPrompt, oldSanitizedName, newSanitizedName);
        if (beforeUpdate !== updatedTextPrompt) {
          // Count the number of replacements made
          const matches = beforeUpdate.match(new RegExp(`\\b${oldSanitizedName}\\b`, 'g'));
          if (matches) {
            totalReferencesUpdated += matches.length;
          }
          agentChanged = true;
        }
      }
      
      // Check and update promptMessages for chat-based agents
      const updatedMessages = agent.props.promptMessages.map(message => {
        let messageChanged = false;
        
        // Check if message has promptBlocks and handle accordingly
        if (!message.props.promptBlocks) {
          return message;
        }
        
        const updatedBlocks = message.props.promptBlocks.map((block: any) => {
          if (block.props.type === 'plain' && block.props.template) {
            const originalTemplate = block.props.template;
            
            if (hasAgentReferences(originalTemplate, oldSanitizedName)) {
              const updatedTemplate = replaceAgentReferences(originalTemplate, oldSanitizedName, newSanitizedName);
              
              if (originalTemplate !== updatedTemplate) {
                console.log(`🎯 Found references in agent ${agentId} prompt:`, {
                  template: originalTemplate.substring(0, 100),
                  updated: updatedTemplate.substring(0, 100)
                });
                
                // Count the replacements
                const matches = originalTemplate.match(new RegExp(`\\b${oldSanitizedName}\\b`, 'g'));
                if (matches) {
                  totalReferencesUpdated += matches.length;
                }
                
                const updateResult = block.update({ template: updatedTemplate });
                if (updateResult.isSuccess) {
                  messageChanged = true;
                  return block; // Return the updated block object itself
                }
              }
            }
          }
          return block;
        });
        
        if (messageChanged) {
          agentChanged = true;
          const updateResult = message.update({ promptBlocks: updatedBlocks });
          if (updateResult.isSuccess) {
            return message; // Return the updated message object itself
          } else {
            return message;
          }
        }
        return message;
      });
      
      // Check and update schema field descriptions
      let updatedSchemaFields = agent.props.schemaFields;
      if (updatedSchemaFields && updatedSchemaFields.length > 0) {
        const newSchemaFields = updatedSchemaFields.map((field) => {
          if (field.description && hasAgentReferences(field.description, oldSanitizedName)) {
            const originalDescription = field.description;
            const updatedDescription = replaceAgentReferences(originalDescription, oldSanitizedName, newSanitizedName);
            
            if (originalDescription !== updatedDescription) {
              // Count the replacements
              const matches = originalDescription.match(new RegExp(`\\b${oldSanitizedName}\\b`, 'g'));
              if (matches) {
                totalReferencesUpdated += matches.length;
              }
              agentChanged = true;
              
              return {
                ...field,
                description: updatedDescription
              };
            }
          }
          return field;
        });
        
        if (agentChanged) {
          updatedSchemaFields = newSchemaFields;
        }
      }
      
      if (agentChanged) {
        // Build update object with promptMessages, textPrompt, and schemaFields
        const updateData: any = { promptMessages: updatedMessages as any };
        if (updatedTextPrompt !== agent.props.textPrompt) {
          updateData.textPrompt = updatedTextPrompt;
        }
        if (updatedSchemaFields !== agent.props.schemaFields) {
          updateData.schemaFields = updatedSchemaFields;
        }
        
        const updatedAgent = agent.update(updateData);
        if (updatedAgent.isSuccess) {
          updatedAgents.push(updatedAgent.getValue());
        }
      }
    });
    
    // Update if-nodes and data-store nodes
    const updatedNodes: any[] = [];
    const nonAgentNodes = currentFlow.props.nodes.filter((n: any) => n.type === 'if' || n.type === 'dataStore');
    
    console.log('🔍 Checking non-agent nodes for references:', {
      ifNodes: nonAgentNodes.filter((n: any) => n.type === 'if').length,
      dataStoreNodes: nonAgentNodes.filter((n: any) => n.type === 'dataStore').length
    });
    
    nonAgentNodes.forEach((node: any) => {
      let nodeChanged = false;
      const updatedNode = { ...node };
      
      if (node.type === 'if' && node.data?.conditions) {
        // Check and update if-node conditions
        const updatedConditions = node.data.conditions.map((condition: any) => {
          let conditionChanged = false;
          const updatedCondition = { ...condition };
          
          // Check value1
          if (condition.value1 && hasAgentReferences(condition.value1, oldSanitizedName)) {
            const originalValue1 = condition.value1;
            updatedCondition.value1 = replaceAgentReferences(condition.value1, oldSanitizedName, newSanitizedName);
            if (originalValue1 !== updatedCondition.value1) {
              console.log(`🎯 Found reference in if-node ${node.id} value1:`, {
                original: originalValue1,
                updated: updatedCondition.value1
              });
              conditionChanged = true;
              totalReferencesUpdated++;
            }
          }
          
          // Check value2
          if (condition.value2 && hasAgentReferences(condition.value2, oldSanitizedName)) {
            const originalValue2 = condition.value2;
            updatedCondition.value2 = replaceAgentReferences(condition.value2, oldSanitizedName, newSanitizedName);
            if (originalValue2 !== updatedCondition.value2) {
              console.log(`🎯 Found reference in if-node ${node.id} value2:`, {
                original: originalValue2,
                updated: updatedCondition.value2
              });
              conditionChanged = true;
              totalReferencesUpdated++;
            }
          }
          
          return conditionChanged ? updatedCondition : condition;
        });
        
        if (JSON.stringify(updatedConditions) !== JSON.stringify(node.data.conditions)) {
          updatedNode.data = { ...node.data, conditions: updatedConditions };
          nodeChanged = true;
        }
      }
      
      if (node.type === 'dataStore' && node.data?.dataStoreFields) {
        // Check and update data-store node fields
        const updatedFields = node.data.dataStoreFields.map((field: any) => {
          if (field.logic && hasAgentReferences(field.logic, oldSanitizedName)) {
            const originalLogic = field.logic;
            const updatedLogic = replaceAgentReferences(field.logic, oldSanitizedName, newSanitizedName);
            if (originalLogic !== updatedLogic) {
              console.log(`🎯 Found reference in data-store node ${node.id} field ${field.id}:`, {
                original: originalLogic,
                updated: updatedLogic
              });
              totalReferencesUpdated++;
              return { ...field, logic: updatedLogic };
            }
          }
          return field;
        });
        
        if (JSON.stringify(updatedFields) !== JSON.stringify(node.data.dataStoreFields)) {
          updatedNode.data = { ...node.data, dataStoreFields: updatedFields };
          nodeChanged = true;
        }
      }
      
      if (nodeChanged) {
        updatedNodes.push(updatedNode);
      }
    });
    
    // Update flow response template
    let responseTemplateChanged = false;
    let updatedResponseTemplate = currentFlow.props.responseTemplate;
    
    console.log('📝 Checking response template for references:', {
      hasTemplate: !!updatedResponseTemplate,
      templateLength: updatedResponseTemplate?.length,
      templatePreview: updatedResponseTemplate?.substring(0, 200),
      lookingFor: oldSanitizedName,
      hasReferences: updatedResponseTemplate ? hasAgentReferences(updatedResponseTemplate, oldSanitizedName) : false
    });
    
    if (updatedResponseTemplate && hasAgentReferences(updatedResponseTemplate, oldSanitizedName)) {
      const originalTemplate = updatedResponseTemplate;
      updatedResponseTemplate = replaceAgentReferences(originalTemplate, oldSanitizedName, newSanitizedName);
      
      console.log('✅ Response template updated:', {
        originalPreview: originalTemplate.substring(0, 200),
        updatedPreview: updatedResponseTemplate.substring(0, 200),
        changed: originalTemplate !== updatedResponseTemplate
      });
      
      if (originalTemplate !== updatedResponseTemplate) {
        // Count the replacements
        const matches = originalTemplate.match(new RegExp(`\\b${oldSanitizedName}\\b`, 'g'));
        if (matches) {
          totalReferencesUpdated += matches.length;
          console.log(`🔢 Found ${matches.length} references to replace in response template`);
        }
        responseTemplateChanged = true;
      }
      
      if (responseTemplateChanged) {
        // Return the updated template, don't modify the flow directly
        console.log('📤 Returning updated response template for saving');
      }
    } else {
      console.log('❌ No references found in response template');
    }
    
    console.log('📊 Update summary:', {
      agentsUpdated: updatedAgents.length,
      nodesUpdated: updatedNodes.length,
      responseTemplateChanged,
      totalReferencesUpdated
    });
    
    return { 
      updatedAgents, 
      responseTemplateChanged, 
      totalReferencesUpdated,
      updatedResponseTemplate: responseTemplateChanged ? updatedResponseTemplate : undefined,
      updatedNodes: updatedNodes.length > 0 ? updatedNodes : undefined
    };
  };


  return {
    // Function for finding and updating agent references
    updateAgentNameReferences
  };
}