/**
 * Operation Processor Factory - Organized with separate processor modules
 * 
 * Query factory pattern for operation processors.
 * This provides:
 * - Hierarchical operation handlers
 * - Type-safe operation processing
 * - Co-location of patterns and handlers
 * - Systematic path-to-function mapping
 */

import { pathPatterns, matchPath, PathProcessor, OperationContext, PathMatchResult } from './path-processor-factory';
import { handleOperationError, handleCriticalError } from './operation-error-handler';
import { createLorebookEntryFromData } from './lorebook-operations';
import { UniqueEntityID } from '@/shared/domain';

// Import organized processors
import { 
  flowFieldProcessors, 
  flowDataStoreSchemaProcessors,
  agentProcessors as originalAgentProcessors,
  nodeEdgeProcessors
} from './processors/flow';
import { dataStoreNodeProcessors } from './processors/data-store-nodes';
import { ifNodeProcessors as originalIfNodeProcessors } from './processors/if-nodes';

// Base operation processor interface
export interface OperationResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Create a properly structured data store schema field from partial data
 */
function createDataStoreFieldFromData(data: any): any {
  return {
    id: data.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name || 'new_field',
    type: data.type || 'string',
    initialValue: data.initialValue || (
      data.type === 'number' || data.type === 'integer' ? '0' :
      data.type === 'boolean' ? 'false' : ''
    ),
    description: data.description || ''
  };
}

// Character processors (kept inline for now - can be moved later)
export const characterProcessors = {
  lorebookEntriesAppend: {
    pattern: pathPatterns.character.lorebook.entries.append,
    description: "Append entry to character lorebook entries",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        
        if (!resource.character) resource.character = {};
        if (!resource.character.lorebook) resource.character.lorebook = { entries: [] };
        if (!Array.isArray(resource.character.lorebook.entries)) {
          resource.character.lorebook.entries = [];
        }
        
        if (context.operation === 'put') {
          const processedEntry = createLorebookEntryFromData(context.value);
          resource.character.lorebook.entries.push(processedEntry);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_lorebook_entry',
          path: 'character.lorebook.entries.append',
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  lorebookEntriesIndexed: {
    pattern: pathPatterns.character.lorebook.entries.indexed,
    description: "Set character lorebook entry at index",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        
        if (!resource.character) resource.character = {};
        if (!resource.character.lorebook) resource.character.lorebook = { entries: [] };
        if (!Array.isArray(resource.character.lorebook.entries)) {
          resource.character.lorebook.entries = [];
        }
        
        // Extend array if needed
        while (resource.character.lorebook.entries.length <= index) {
          resource.character.lorebook.entries.push(createLorebookEntryFromData({}));
        }
        
        if (context.operation === 'put') {
          const processedEntry = createLorebookEntryFromData(context.value);
          resource.character.lorebook.entries[index] = processedEntry;
        } else if (context.operation === 'remove') {
          resource.character.lorebook.entries.splice(index, 1);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_indexed_lorebook_entry',
          path: `character.lorebook.entries[${match.groups.group1}]`,
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  lorebookEntriesField: {
    pattern: pathPatterns.character.lorebook.entries.field,
    description: "Set individual lorebook entry field",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        const fieldName = match.groups.group2;
        
        if (!resource.character) resource.character = {};
        if (!resource.character.lorebook) resource.character.lorebook = { entries: [] };
        if (!Array.isArray(resource.character.lorebook.entries)) {
          resource.character.lorebook.entries = [];
        }
        
        // Extend array if needed
        while (resource.character.lorebook.entries.length <= index) {
          resource.character.lorebook.entries.push(createLorebookEntryFromData({}));
        }
        
        // Ensure entry exists at index
        if (!resource.character.lorebook.entries[index]) {
          resource.character.lorebook.entries[index] = createLorebookEntryFromData({});
        }
        
        if (context.operation === 'set') {
          const currentEntry = resource.character.lorebook.entries[index];
          
          // Auto-detect and parse JSON strings
          let processedValue = context.value;
          if (typeof context.value === 'string' && context.value.trim().match(/^[\[\{].*[\]\}]$/)) {
            try {
              processedValue = JSON.parse(context.value);
            } catch (error) {
              // Use original value if parsing fails
            }
          }
          
          currentEntry[fieldName] = processedValue;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_lorebook_entry_field',
          path: `character.lorebook.entries[${match.groups.group1}].${match.groups.group2}`,
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  name: {
    pattern: pathPatterns.character.fields.name,
    description: "Set character name",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        if (!resource.character) resource.character = {};
        resource.character.name = context.value;
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'set_character_name',
          path: 'character.name',
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  description: {
    pattern: pathPatterns.character.fields.description,
    description: "Set character description",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        if (!resource.character) resource.character = {};
        resource.character.description = context.value;
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'set_character_description',
          path: 'character.description',
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  exampleDialogue: {
    pattern: pathPatterns.character.fields.exampleDialogue,
    description: "Set character example dialogue",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        if (!resource.character) resource.character = {};
        resource.character.example_dialogue = context.value;
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'set_character_example_dialogue',
          path: 'character.example_dialogue',
          processor: 'character-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor
};

// Plot processors (similar to character processors)
export const plotProcessors = {
  lorebookEntriesAppend: {
    pattern: pathPatterns.plot.lorebook.entries.append,
    description: "Append entry to plot lorebook entries",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        
        if (!resource.plot) resource.plot = {};
        if (!resource.plot.lorebook) resource.plot.lorebook = { entries: [] };
        if (!Array.isArray(resource.plot.lorebook.entries)) {
          resource.plot.lorebook.entries = [];
        }
        
        if (context.operation === 'put') {
          const processedEntry = createLorebookEntryFromData(context.value);
          resource.plot.lorebook.entries.push(processedEntry);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_lorebook_entry',
          path: 'plot.lorebook.entries.append',
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  lorebookEntriesIndexed: {
    pattern: pathPatterns.plot.lorebook.entries.indexed,
    description: "Set plot lorebook entry at index",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        
        if (!resource.plot) resource.plot = {};
        if (!resource.plot.lorebook) resource.plot.lorebook = { entries: [] };
        if (!Array.isArray(resource.plot.lorebook.entries)) {
          resource.plot.lorebook.entries = [];
        }
        
        // Extend array if needed
        while (resource.plot.lorebook.entries.length <= index) {
          resource.plot.lorebook.entries.push(createLorebookEntryFromData({}));
        }
        
        if (context.operation === 'put') {
          const processedEntry = createLorebookEntryFromData(context.value);
          resource.plot.lorebook.entries[index] = processedEntry;
        } else if (context.operation === 'remove') {
          resource.plot.lorebook.entries.splice(index, 1);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_indexed_lorebook_entry',
          path: `plot.lorebook.entries[${match.groups.group1}]`,
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  lorebookEntriesField: {
    pattern: pathPatterns.plot.lorebook.entries.field,
    description: "Set individual plot lorebook entry field",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        const fieldName = match.groups.group2;
        
        if (!resource.plot) resource.plot = {};
        if (!resource.plot.lorebook) resource.plot.lorebook = { entries: [] };
        if (!Array.isArray(resource.plot.lorebook.entries)) {
          resource.plot.lorebook.entries = [];
        }
        
        // Extend array if needed
        while (resource.plot.lorebook.entries.length <= index) {
          resource.plot.lorebook.entries.push(createLorebookEntryFromData({}));
        }
        
        // Ensure entry exists at index
        if (!resource.plot.lorebook.entries[index]) {
          resource.plot.lorebook.entries[index] = createLorebookEntryFromData({});
        }
        
        if (context.operation === 'set') {
          const currentEntry = resource.plot.lorebook.entries[index];
          
          // Auto-detect and parse JSON strings
          let processedValue = context.value;
          if (typeof context.value === 'string' && context.value.trim().match(/^[\[\{].*[\]\}]$/)) {
            try {
              processedValue = JSON.parse(context.value);
            } catch (error) {
              // Use original value if parsing fails
            }
          }
          
          currentEntry[fieldName] = processedValue;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_lorebook_entry_field',
          path: `plot.lorebook.entries[${match.groups.group1}].${match.groups.group2}`,
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  scenariosAppend: {
    pattern: pathPatterns.plot.scenarios.append,
    description: "Append scenario to plot scenarios",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        
        if (!resource.plot) resource.plot = {};
        if (!Array.isArray(resource.plot.scenarios)) {
          resource.plot.scenarios = [];
        }
        
        if (context.operation === 'put') {
          const processedScenario = {
            name: context.value?.name || 'New Scenario',
            description: context.value?.description || ''
          };
          resource.plot.scenarios.push(processedScenario);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'append_scenario',
          path: 'plot.scenarios.append',
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  scenariosIndexed: {
    pattern: pathPatterns.plot.scenarios.indexed,
    description: "Set plot scenario at index",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        
        if (!resource.plot) resource.plot = {};
        if (!Array.isArray(resource.plot.scenarios)) {
          resource.plot.scenarios = [];
        }
        
        // Extend array if needed
        while (resource.plot.scenarios.length <= index) {
          resource.plot.scenarios.push({ name: 'New Scenario', description: '' });
        }
        
        if (context.operation === 'put') {
          const processedScenario = {
            name: context.value?.name || 'New Scenario',
            description: context.value?.description || ''
          };
          resource.plot.scenarios[index] = processedScenario;
        } else if (context.operation === 'remove') {
          resource.plot.scenarios.splice(index, 1);
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_indexed_scenario',
          path: `plot.scenarios[${match.groups.group1}]`,
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor,

  scenariosField: {
    pattern: pathPatterns.plot.scenarios.field,
    description: "Set individual plot scenario field",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        const index = parseInt(match.groups.group1);
        const fieldName = match.groups.group2;
        
        if (!resource.plot) resource.plot = {};
        if (!Array.isArray(resource.plot.scenarios)) {
          resource.plot.scenarios = [];
        }
        
        // Extend array if needed
        while (resource.plot.scenarios.length <= index) {
          resource.plot.scenarios.push({ name: 'New Scenario', description: '' });
        }
        
        // Ensure scenario exists at index
        if (!resource.plot.scenarios[index]) {
          resource.plot.scenarios[index] = { name: 'New Scenario', description: '' };
        }
        
        if (context.operation === 'set') {
          resource.plot.scenarios[index][fieldName] = context.value;
        }
        
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'update_scenario_field',
          path: `plot.scenarios[${match.groups.group1}].${match.groups.group2}`,
          processor: 'plot-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor
};

// Common processors
export const commonProcessors = {
  title: {
    pattern: pathPatterns.common.fields.title,
    description: "Set common title field",
    handler: (context: OperationContext, match: PathMatchResult): OperationResult => {
      try {
        const resource = context.resource;
        if (!resource.common) resource.common = {};
        resource.common.title = context.value;
        return { success: true, result: resource };
      } catch (error) {
        return handleOperationError(error as Error, {
          operation: 'set_common_title',
          path: 'common.title',
          processor: 'common-operations',
          inputData: context.value
        });
      }
    }
  } as PathProcessor
};


// Agent processors - using both factory processors and deep merge for comprehensive coverage
export const agentProcessors = originalAgentProcessors;

// If node processors - keeping original for now
export const ifNodeProcessors = originalIfNodeProcessors;

/**
 * Master processor registry - organized by category
 */
export const operationProcessors: PathProcessor[] = [
  // Character processors
  ...Object.values(characterProcessors),
  
  // Plot processors
  ...Object.values(plotProcessors),
  
  // Common processors
  ...Object.values(commonProcessors),
  
  // Agent processors
  ...Object.values(agentProcessors),
  
  // Flow processors (organized)
  ...Object.values(flowFieldProcessors),
  ...Object.values(flowDataStoreSchemaProcessors),
  ...Object.values(nodeEdgeProcessors),
  ...Object.values(dataStoreNodeProcessors),
  ...Object.values(ifNodeProcessors),
];

/**
 * Find processor for a given path
 */
export function findProcessor(path: string): PathProcessor | null {
  
  // Debug logging for dataStoreFields operations
  if (path.includes('dataStoreFields')) {
    console.log('🔍 [PROCESSOR-FACTORY] Looking for processor for dataStoreFields path:', path);
  }
  
  for (const processor of operationProcessors) {
    const match = matchPath(path, processor.pattern);
    
    if (match.matches) {
      if (!processor.handler || typeof processor.handler !== 'function') {
        continue;
      }
      
      // Debug logging for dataStoreFields operations
      if (path.includes('dataStoreFields')) {
        console.log('✅ [PROCESSOR-FACTORY] Found processor:', processor.description);
      }
      
      return processor;
    }
  }
  
  // Debug logging for dataStoreFields operations
  if (path.includes('dataStoreFields')) {
    console.log('❌ [PROCESSOR-FACTORY] No processor found for path:', path);
  }
  
  return null;
}

/**
 * Process operation using matched processor
 */
export async function processOperation(context: OperationContext): Promise<OperationResult> {
  
  const processor = findProcessor(context.path);
  
  if (!processor) {
    return {
      success: false,
      error: `No processor found for path: ${context.path}`
    };
  }
  
  const match = matchPath(context.path, processor.pattern);
  const result = await processor.handler(context, match);
  
  
  return result;
}