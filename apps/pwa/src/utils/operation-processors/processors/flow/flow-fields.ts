/**
 * Flow field processors (name, response_template, data_store_schema)
 */

import { pathPatterns, PathProcessor, OperationContext, PathMatchResult } from '../../path-processor-factory';
import { handleOperationError, handleCriticalError } from '../../operation-error-handler';

export const flowFieldProcessors = {
  name: {
    pattern: pathPatterns.flow.fields.name,
    description: "Set flow name field",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        
        if (!context || !context.resource) {
          throw new Error('Context or resource is undefined');
        }
        
        const resource = context.resource;
        if (context.operation === 'set') {
          resource.name = context.value;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'update_name',
          path: 'flow.name',
          processor: 'flow-fields',
          inputData: context.value
        }, 'Failed to update flow name');
      }
    }
  } as PathProcessor,
  
  response_template: {
    pattern: pathPatterns.flow.fields.response_template,
    description: "Set flow response_template field",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        
        const resource = context.resource;
        if (context.operation === 'set') {
          resource.response_template = context.value;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'update_response_template',
          path: 'flow.response_template',
          processor: 'flow-fields',
          inputData: context.value
        }, 'Failed to update response template');
      }
    }
  } as PathProcessor,
  
  data_store_schema: {
    pattern: pathPatterns.flow.fields.data_store_schema,
    description: "Set flow data_store_schema field",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        
        const resource = context.resource;
        if (context.operation === 'set') {
          resource.data_store_schema = context.value;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'update_data_store_schema',
          path: 'flow.data_store_schema',
          processor: 'flow-fields',
          inputData: context.value
        }, 'Failed to update data store schema');
      }
    }
  } as PathProcessor
};