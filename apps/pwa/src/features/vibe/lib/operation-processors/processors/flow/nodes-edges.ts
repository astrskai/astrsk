/**
 * Node and Edge Operation Processors for Flow Resources
 * Handles complete node/edge operations with transaction safety
 * 
 * Key Features:
 * 1. Whole entity operations (complete nodes/edges, not field-by-field)
 * 2. Transaction safety with rollback on failures
 * 3. Automatic domain entity creation/cleanup
 * 4. Integration with existing FlowService.updateNodesAndEdges
 * 5. Support for analysis agent predetermined IDs (UUID conversion done by backend)
 */

import { pathPatterns, PathProcessor, OperationContext, PathMatchResult } from '../../path-processor-factory';
import { OperationResult } from '../../operation-processor-factory';
import { handleOperationError, handleCriticalError } from '../../operation-error-handler';
import { UniqueEntityID } from '@/shared/domain';
import { FlowService } from '@/app/services/flow-service';
import { AgentService } from '@/app/services/agent-service';
import { DataStoreNodeService } from '@/app/services/data-store-node-service';
import { IfNodeService } from '@/app/services/if-node-service';
import { NodeType } from "@/entities/flow/model/node-types";
import { getNextAvailableColor } from '@/features/flow/flow-multi/utils/node-color-assignment';
import { Edge } from '@/entities/flow/domain/flow';
import { notifyFlowNodesEdgesUpdate } from '@/shared/lib/flow-local-state-sync';

/**
 * Create domain entity with predetermined ID from analysis agent
 * The analysis agent provides UUIDs (after converting from simple IDs internally)
 */
async function createNodeEntityWithPredeterminedId(
  nodeType: NodeType, 
  nodeData: any, 
  flowId: string, 
  predeterminedId: string,
  flowResource: any
): Promise<string> {
  // Pre-validation phase
  if (!flowId) {
    throw new Error('Flow ID is required for node creation');
  }
  
  if (!predeterminedId) {
    throw new Error('Predetermined ID from analysis agent is required');
  }
  
  try {
    // Get the next available color from the flow system (unless explicitly provided)
    const nodeColor = nodeData.color || await getNextAvailableColor({ 
      props: { 
        nodes: flowResource.nodes || []
      },
      id: flowId
    });
    
    switch (nodeType) {
      case NodeType.AGENT:
        // Create agent domain entity first, then save it
        const { Agent, ApiType } = await import('@/entities/agent/domain');
        const agentOrError = Agent.create({
          name: nodeData.name || `Agent ${predeterminedId}`,
          description: nodeData.description || '',
          targetApiType: nodeData.targetApiType || ApiType.Chat,
          color: nodeColor, // Use flow system color assignment
          promptMessages: nodeData.promptMessages || [],
          schemaFields: nodeData.schemaFields || [],
          ...nodeData
        }, new UniqueEntityID(predeterminedId));
        
        if (agentOrError.isFailure) {
          throw new Error(`Agent creation failed: ${agentOrError.getError()}`);
        }
        
        const agent = agentOrError.getValue();
        const saveResult = await AgentService.saveAgent.execute(agent);
        if (saveResult.isFailure) {
          throw new Error(`Agent save failed: ${saveResult.getError()}`);
        }
        return predeterminedId;
        
      case NodeType.DATA_STORE:
        console.log(`🟢🟢🟢 [NODES-EDGES] DATA STORE NODE CREATION CALLED - OPERATION PROCESSOR PATH`, {
          nodeId: predeterminedId,
          flowId: flowId,
          name: nodeData.name || `Data Store ${predeterminedId}`,
          hasDataStoreFields: !!(nodeData.dataStoreFields || []).length,
          color: nodeColor,
          timestamp: new Date().toISOString()
        });
        
        const dataStoreResult = await DataStoreNodeService.createDataStoreNode.execute({
          nodeId: predeterminedId, // Use predetermined UUID from analysis agent
          flowId: flowId,
          name: nodeData.name || `Data Store ${predeterminedId}`,
          dataStoreFields: nodeData.dataStoreFields || [],
          color: nodeColor, // Use flow system color assignment
          ...nodeData
        });
        if (dataStoreResult.isFailure) {
          throw new Error(`DataStore creation failed: ${dataStoreResult.getError()}`);
        }
        return predeterminedId;
        
      case NodeType.IF:
        console.log('🔍 [IF-NODE-CREATION] Service call parameters:', {
          nodeId: predeterminedId,
          flowId: flowId,
          name: nodeData.name || `If Node ${predeterminedId}`,
          hasConditions: !!(nodeData.conditions || []).length,
          logicOperator: nodeData.logicOperator || 'AND',
          color: nodeColor
        });
        
        const ifNodeResult = await IfNodeService.createIfNode.execute({
          nodeId: predeterminedId, // Use predetermined UUID from analysis agent
          flowId: flowId,
          name: nodeData.name || `If Node ${predeterminedId}`,
          conditions: nodeData.conditions || [],
          logicOperator: nodeData.logicOperator || 'AND',
          color: nodeColor, // Use flow system color assignment
          ...nodeData
        });
        if (ifNodeResult.isFailure) {
          throw new Error(`IfNode creation failed: ${ifNodeResult.getError()}`);
        }
        return predeterminedId;
        
      case NodeType.START:
      case NodeType.END:
        // Start/End nodes don't have domain entities
        return predeterminedId;
        
      default:
        throw new Error(`Unsupported node type: ${nodeType}`);
    }
  } catch (error) {
    // Rollback: If entity creation started but failed, ensure cleanup
    try {
      await cleanupFailedEntity(nodeType, predeterminedId);
    } catch (cleanupError) {
      console.error('Failed to cleanup entity after creation failure:', cleanupError);
    }
    throw error;
  }
}

/**
 * Cleanup failed entity creation
 */
async function cleanupFailedEntity(nodeType: NodeType, entityId: string): Promise<void> {
  try {
    await deleteNodeEntity(nodeType, entityId);
  } catch (error) {
    // Log but don't throw - this is cleanup attempt
    console.error(`Cleanup failed for ${nodeType} entity ${entityId}:`, error);
  }
}

/**
 * Delete domain entity based on node type
 */
async function deleteNodeEntity(nodeType: NodeType, nodeId: string): Promise<void> {
  switch (nodeType) {
    case NodeType.AGENT:
      const agentResult = await AgentService.deleteAgent.execute(new UniqueEntityID(nodeId));
      if (agentResult.isFailure) {
        throw new Error(agentResult.getError());
      }
      break;
      
    case NodeType.DATA_STORE:
      const dataStoreResult = await DataStoreNodeService.deleteDataStoreNode.execute({ nodeId });
      if (dataStoreResult.isFailure) {
        throw new Error(dataStoreResult.getError());
      }
      break;
      
    case NodeType.IF:
      const ifNodeResult = await IfNodeService.deleteIfNode.execute({ nodeId });
      if (ifNodeResult.isFailure) {
        throw new Error(ifNodeResult.getError());
      }
      break;
      
    case NodeType.START:
    case NodeType.END:
      // Start/End nodes don't have domain entities to delete
      break;
      
    default:
      console.warn(`Unknown node type for deletion: ${nodeType}`);
  }
}

export const nodeEdgeProcessors = {
  // Node Operations with Transaction Safety
  addNode: {
    pattern: pathPatterns.flow.nodes.append,
    description: "Add complete node to flow with transaction safety",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      
      try {
        const { id, nodeType, position, name } = context.value;
        const resource = context.resource;
        const flowId = resource.id || context.flowId;
        
        console.log('🔍 [NODE-CREATION] FlowId resolution:', {
          resourceId: resource.id,
          contextFlowId: context.flowId,
          finalFlowId: flowId,
          nodeType: nodeType,
          predeterminedId: id
        });
        
        if (!flowId) {
          throw new Error('Flow ID is required for node creation');
        }
        
        if (!resource.nodes) resource.nodes = [];
        
        if (context.operation === 'put') {
          // Extract predetermined ID from analysis agent
          const predeterminedId = id;
          if (!predeterminedId) {
            throw new Error('Node ID from analysis agent is required');
          }
          
          console.log('🔍 [NODE-CREATION] PREVIEW MODE - Preparing node for preview (no changes to resource):', {
            predeterminedId,
            nodeType,
            flowId
          });
          
          // PREVIEW MODE: Don't modify the resource or notify UI
          // Just validate the operation can be performed
          // The actual node creation will happen during approval phase via flow-operations.ts
          
          console.log('✅ [NODE-CREATION] Node operation validated for preview - no resource changes made');
          
          // Return unmodified resource - changes will only be applied during approval
        }
        
        return { success: true, result: resource };
      } catch (error) {
        // No rollback needed for preview mode since we don't create backend entities
        console.error('🔥 [NODE-CREATION] Preview creation failed:', error);
        
        return handleCriticalError(error as Error, {
          operation: 'add_node',
          path: 'flow.nodes.append',
          processor: 'nodes-edges',
          inputData: context.value
        }, 'Failed to add node to flow');
      }
    }
  } as PathProcessor,
  
  removeNode: {
    pattern: pathPatterns.flow.nodes.indexed,  
    description: "Remove complete node from flow with transaction safety",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      try {
        const nodeIndex = parseInt(match.groups.group1);
        const resource = context.resource;
        const flowId = resource.id || context.flowId;
        
        if (!resource.nodes || !resource.nodes[nodeIndex]) {
          throw new Error(`Node at index ${nodeIndex} not found`);
        }
        
        if (context.operation === 'remove') {
          const nodeToRemove = resource.nodes[nodeIndex];
          
          // Delete associated domain entity first (safer order)
          try {
            await deleteNodeEntity(nodeToRemove.type, nodeToRemove.id);
          } catch (entityError) {
            console.warn(`Failed to delete entity for node ${nodeToRemove.id}:`, entityError);
            // Continue with node removal even if entity deletion fails
          }
          
          // Remove node from array
          resource.nodes.splice(nodeIndex, 1);
          
          // Remove connected edges
          if (resource.edges) {
            resource.edges = resource.edges.filter((edge: Edge) => 
              edge.source !== nodeToRemove.id && edge.target !== nodeToRemove.id
            );
          }
          
          // Notify flow panels of local state change
          // Ensure all edges have the required 'type' field for ReactFlow
          const edgesWithType = (resource.edges || []).map((edge: any) => ({
            ...edge,
            type: edge.type || 'default'
          }));
          
          notifyFlowNodesEdgesUpdate(flowId, resource.nodes, edgesWithType);
          
          // Update flow via FlowService
          if (flowId) {
            const result = await FlowService.updateNodesAndEdges.execute({
              flowId,
              nodes: resource.nodes,
              edges: resource.edges || []
            });
            
            if (result.isFailure) {
              throw new Error(result.getError());
            }
          }
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'remove_node',
          path: `flow.nodes[${match.groups.group1}]`,
          processor: 'nodes-edges',
          inputData: context.value
        }, 'Failed to remove node from flow');
      }
    }
  } as PathProcessor,

  // Edge Operations - Pass-through processors to prevent factory errors
  // Actual edge creation handled in flow-operations.ts during approval phase
  addEdge: {
    pattern: pathPatterns.flow.edges.append,
    description: "Pass-through for edge operations (handled in flow-operations.ts)",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      // Pass-through: Don't create edges here, just acknowledge the operation
      console.log(`🔄 [NODES-EDGES] Pass-through for flow.edges operation - handled in flow-operations.ts:`, {
        path: 'flow.edges',
        source: context.value?.source,
        target: context.value?.target,
        operation: context.operation
      });
      
      return { success: true, result: context.resource };
    }
  } as PathProcessor,
  
  removeEdge: {
    pattern: pathPatterns.flow.edges.indexed,
    description: "Pass-through for edge removal (handled in flow-operations.ts)",
    handler: async (context: OperationContext, match: PathMatchResult): Promise<OperationResult> => {
      // Pass-through: Don't remove edges here, just acknowledge the operation
      console.log(`🔄 [NODES-EDGES] Pass-through for flow.edges[index] operation - handled in flow-operations.ts:`, {
        path: `flow.edges[${match.groups.group1}]`,
        operation: context.operation
      });
      
      return { success: true, result: context.resource };
    }
  } as PathProcessor
};