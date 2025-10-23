/**
 * If Node processors
 * 
 * IF Node Condition Operation Requirements:
 * - PUT operations are NOT allowed when conditions array is empty
 * - First condition must be created using SET operation at index 0
 * - Empty first condition means value1 and operator are null/not set
 * - After first condition is established with SET, PUT operations can append new conditions
 * - REMOVE operations work normally once conditions exist
 */

import { pathPatterns, PathProcessor, OperationContext, PathMatchResult } from '../path-processor-factory';
import { handleOperationError, handleCriticalError } from '../operation-error-handler';
import { FlowService } from '@/app/services/flow-service';
import { IfCondition } from 'vibe-shared-types';
import { UniqueEntityID } from '@/shared/domain';

/**
 * Create if condition from data using proper domain types
 * Uses UniqueEntityID for ID generation (consistent with domain objects)
 * Supports empty conditions where dataType and operator can be null
 */
function createIfConditionFromData(data: any): any {
  // Use UniqueEntityID for consistency with domain objects
  const id = data.id || new UniqueEntityID().toString();
  
  // Support empty conditions - allow null dataType and operator
  // Empty first condition means value1 and operator are not set
  return {
    id,
    dataType: data.dataType || null, // Allow null for empty conditions
    value1: data.value1 || '',
    operator: data.operator || null, // Allow null for empty conditions
    value2: data.value2 || ''
  };
}

export const ifNodeProcessors = {
  // Specific patterns first (more specific patterns should be checked before generic ones)
  conditionsAppend: {
    pattern: pathPatterns.ifNodes.conditions.append,
    description: "Append condition to if node conditions array",
    handler: async (context: OperationContext, match: PathMatchResult) => {
      try {
        
        const resource = context.resource;
        const nodeId = match.groups.group1;
        
        if (!resource.ifNodes) resource.ifNodes = {};
        if (!resource.ifNodes[nodeId]) resource.ifNodes[nodeId] = {};
        if (!Array.isArray(resource.ifNodes[nodeId].conditions)) {
          resource.ifNodes[nodeId].conditions = [];
        }
        
        if (context.operation === 'put') {
          // PUT operation: append new condition to the conditions array
          const processedCondition = createIfConditionFromData(context.value);
          resource.ifNodes[nodeId].conditions.push(processedCondition);
          
          // Check if flowId is available for service calls
          const flowId = context.flowId || resource.id || resource.flowId;
          
          if (flowId) {
            // Use service layer to update the if-node conditions
            const { IfNodeService } = await import('@/app/services/if-node-service');
            
            const result = await IfNodeService.updateIfNodeConditions.execute({
              flowId: flowId,
              nodeId: nodeId,
              conditions: resource.ifNodes[nodeId].conditions,
            });
            
            if (result.isSuccess) {
              // Invalidate specific if-node queries
              try {
                const { queryClient } = await import("@/app/queries/query-client");
                const { ifNodeKeys } = await import("@/app/queries/if-node/query-factory");

                // Invalidate if-node queries
                queryClient.invalidateQueries({
                  queryKey: ifNodeKeys.detail(nodeId),
                });
              } catch (invalidationError) {
                console.warn('⚠️ [IF-NODE-PROCESSOR] Could not invalidate if-node queries:', invalidationError);
              }
            } else {
              throw new Error(`Failed to update if-node conditions: ${result.getError()}`);
            }
          }
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'append_if_node_condition',
          path: `ifNodes.${match.groups.group1}.conditions.append`,
          processor: 'if-nodes',
          inputData: context.value
        }, 'Failed to add condition to IF node');
      }
    }
  } as PathProcessor,

  conditionsIndexed: {
    pattern: pathPatterns.ifNodes.conditions.indexed,
    description: "Set if node condition at specific index",
    handler: async (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;
        const index = parseInt(match.groups.group2);
        
        if (!resource.ifNodes) resource.ifNodes = {};
        if (!resource.ifNodes[nodeId]) resource.ifNodes[nodeId] = {};
        if (!Array.isArray(resource.ifNodes[nodeId].conditions)) {
          resource.ifNodes[nodeId].conditions = [];
        }
        
        // Extend array if needed
        while (resource.ifNodes[nodeId].conditions.length <= index) {
          resource.ifNodes[nodeId].conditions.push({
            dataType: 'string',
            value1: '',
            operator: 'string_equals',
            value2: '',
            id: new UniqueEntityID().toString()
          });
        }
        
        if (context.operation === 'set') {
          const processedCondition = createIfConditionFromData(context.value);
          resource.ifNodes[nodeId].conditions[index] = processedCondition;
        } else if (context.operation === 'put') {
          // For PUT at index, we treat it as an insert operation
          const processedCondition = createIfConditionFromData(context.value);
          
          if (resource.ifNodes[nodeId].conditions.length === 0) {
            // Special case: first condition - set at index 0
            resource.ifNodes[nodeId].conditions[0] = processedCondition;
          } else {
            // Insert at specific index
            resource.ifNodes[nodeId].conditions.splice(index, 0, processedCondition);
          }
        } else if (context.operation === 'remove') {
          if (index < resource.ifNodes[nodeId].conditions.length) {
            resource.ifNodes[nodeId].conditions.splice(index, 1);
          }
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'update_if_node_condition',
          path: `ifNodes.${match.groups.group1}.conditions[${match.groups.group2}]`,
          processor: 'if-nodes',
          inputData: context.value
        }, 'Failed to update IF node condition');
      }
    }
  } as PathProcessor,

  base: {
    pattern: pathPatterns.ifNodes.base,
    description: "Set entire if node",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;
        
        if (!resource.ifNodes) resource.ifNodes = {};
        
        if (context.operation === 'set') {
          resource.ifNodes[nodeId] = context.value;
        } else if (context.operation === 'remove') {
          delete resource.ifNodes[nodeId];
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'set_if_node',
          path: `ifNodes.${match.groups.group1}`,
          processor: 'if-nodes',
          inputData: context.value
        }, 'Failed to update IF node');
      }
    }
  } as PathProcessor,
  
  field: {
    pattern: pathPatterns.ifNodes.field,
    description: "Set individual if node field",
    handler: async (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        const nodeId = match.groups.group1;
        const fieldName = match.groups.group2;
        
        if (!resource.ifNodes) resource.ifNodes = {};
        if (!resource.ifNodes[nodeId]) resource.ifNodes[nodeId] = {};
        
        // For conditions field, process and prepare the data structure
        if (fieldName === 'conditions' && (context.operation === 'set' || context.operation === 'put')) {
          // Convert single condition to array if needed
          let conditions = Array.isArray(context.value) ? context.value : [context.value];
          
          // Process conditions to ensure they have proper structure
          conditions = conditions.map(condition => {
            if (condition && typeof condition === 'object' && condition.dataType && condition.operator) {
              return {
                id: condition.id || new UniqueEntityID().toString(),
                dataType: condition.dataType,
                value1: condition.value1 || '',
                operator: condition.operator,
                value2: condition.value2 || ''
              };
            }
            return condition;
          });
          
          resource.ifNodes[nodeId][fieldName] = conditions;
        } else if (fieldName === 'logicOperator' && (context.operation === 'set' || context.operation === 'put')) {
          // Handle logicOperator field with service layer integration
          resource.ifNodes[nodeId][fieldName] = context.value;
          
          // Check if flowId is available for service calls
          const flowId = context.flowId || resource.id || resource.flowId;
          
          if (flowId) {
            // Use service layer to update the logic operator
            const { IfNodeService } = await import('@/app/services/if-node-service');
            
            const result = await IfNodeService.updateIfNodeLogicOperator.execute({
              flowId: flowId,
              nodeId: nodeId,
              logicOperator: context.value,
            });
            
            if (result.isSuccess) {
              // Invalidate specific if-node queries
              try {
                const { queryClient } = await import("@/app/queries/query-client");
                const { ifNodeKeys } = await import("@/app/queries/if-node/query-factory");

                // Invalidate if-node queries
                queryClient.invalidateQueries({
                  queryKey: ifNodeKeys.detail(nodeId),
                });
              } catch (invalidationError) {
                console.warn('⚠️ [IF-NODE-PROCESSOR] Could not invalidate if-node queries:', invalidationError);
              }
            } else {
              throw new Error(`Failed to update if-node logic operator: ${result.getError()}`);
            }
          }
        } else {
          // For other fields, use simple local update
          if (context.operation === 'set' || context.operation === 'put') {
            resource.ifNodes[nodeId][fieldName] = context.value;
          } else if (context.operation === 'remove') {
            delete resource.ifNodes[nodeId][fieldName];
          }
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_if_node_field',
          path: `ifNodes.${match.groups.group1}.${match.groups.group2}`,
          processor: 'if-nodes',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,
  
  
};
