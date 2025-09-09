/**
 * Flow Data Store Schema processors
 */

import { pathPatterns, PathProcessor, OperationContext, PathMatchResult } from '../../path-processor-factory';
import { handleOperationError, handleCriticalError } from '../../operation-error-handler';

import { UniqueEntityID } from '@/shared/domain';

// Helper function for data store schema field creation
function createDataStoreFieldFromData(data: any): any {
  return {
    id: data.id || new UniqueEntityID().toString(),
    name: data.name || 'new_field',
    type: data.type || 'string',
    initialValue: data.initialValue || (
      data.type === 'number' || data.type === 'integer' ? '0' :
      data.type === 'boolean' ? 'false' : ''
    ),
    description: data.description || ''
  };
}

export const flowDataStoreSchemaProcessors = {
  base: {
    pattern: pathPatterns.flow.dataStoreSchema.base,
    description: "Set entire flow data store schema",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        if (context.operation === 'set') {
          resource.data_store_schema = context.value;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleCriticalError(error as Error, {
          operation: 'set_data_store_schema',
          path: 'flow.data_store_schema',
          processor: 'data-store-schema',
          inputData: context.value
        }, 'Failed to update data store schema');
      }
    }
  } as PathProcessor,

  fields: {
    pattern: pathPatterns.flow.dataStoreSchema.fields,
    description: "Append field to flow data store schema fields array",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const resource = context.resource;
        
        if (!resource.data_store_schema) {
          resource.data_store_schema = { fields: [] };
        }
        if (!Array.isArray(resource.data_store_schema.fields)) {
          resource.data_store_schema.fields = [];
        }
        
        if (context.operation === 'put') {
          const newField = createDataStoreFieldFromData(context.value);
          resource.data_store_schema.fields.push(newField);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_schema_field',
          path: 'flow.data_store_schema.fields.append',
          processor: 'data-store-schema',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  field: {
    pattern: pathPatterns.flow.dataStoreSchema.field,
    description: "Update specific field in flow data store schema",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const index = parseInt(match.groups.group1);
        const resource = context.resource;
        
        if (!resource.data_store_schema) {
          resource.data_store_schema = { fields: [] };
        }
        if (!Array.isArray(resource.data_store_schema.fields)) {
          resource.data_store_schema.fields = [];
        }
        
        const fields = resource.data_store_schema.fields;
        
        // Extend array if needed
        while (fields.length <= index) {
          fields.push(createDataStoreFieldFromData({}));
        }
        
        if (context.operation === 'set') {
          fields[index] = {
            id: fields[index].id, // Preserve existing ID
            name: context.value.name || fields[index].name,
            type: context.value.type || fields[index].type,
            initialValue: context.value.initialValue || fields[index].initialValue,
            description: context.value.description || fields[index].description
          };
        } else if (context.operation === 'put') {
          // INSERT operation: add new field at index, shifting existing fields right
          const newField = createDataStoreFieldFromData(context.value);
          fields.splice(index, 0, newField);
        } else if (context.operation === 'remove') {
          fields.splice(index, 1);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_schema_field',
          path: `flow.data_store_schema.fields[${match.groups.group1}]`,
          processor: 'data-store-schema',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  fieldProperty: {
    pattern: pathPatterns.flow.dataStoreSchema.fieldProperty,
    description: "Update specific property of a field in flow data store schema",
    handler: (context: OperationContext, match: PathMatchResult) => {
      try {
        const index = parseInt(match.groups.group1);
        const property = match.groups.group2;
        const resource = context.resource;
        
        if (!resource.data_store_schema) {
          resource.data_store_schema = { fields: [] };
        }
        if (!Array.isArray(resource.data_store_schema.fields)) {
          resource.data_store_schema.fields = [];
        }
        
        const fields = resource.data_store_schema.fields;
        
        // Extend array if needed
        while (fields.length <= index) {
          fields.push(createDataStoreFieldFromData({}));
        }
        
        if (context.operation === 'set') {
          if (property === 'name' || property === 'type' || property === 'initialValue' || property === 'description') {
            fields[index][property] = context.value;
          }
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_schema_field_property',
          path: `flow.data_store_schema.fields[${match.groups.group1}].${match.groups.group2}`,
          processor: 'data-store-schema',
          inputData: context.value
        });
      }
    }
  } as PathProcessor
};