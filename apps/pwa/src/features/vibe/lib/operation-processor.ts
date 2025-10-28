/**
 * Operation-based editing processor for frontend
 * Applies operations sequentially to create final resources
 * 
 * Updated to use the new path-to-function mapping system
 */

import { Operation } from './operation-processors/base-operations';

// Re-export Operation for external use
export type { Operation } from './operation-processors/base-operations';

// Export OperationError type
export type { OperationError };
import { processLorebookPutOperation, isLorebookEntryPath } from './operation-processors/lorebook-operations';
import { processOperation } from './operation-processors/operation-processor-factory';
import type { OperationContext } from './operation-processors/path-processor-factory';

interface OperationError {
  operation: Operation;
  error: string;
  timestamp: Date;
  context?: any;
}

/**
 * Apply a list of operations to a resource using the new factory system with comprehensive error handling
 */
export async function applyOperations(
  resource: any, 
  operations: Operation[], 
  flowId?: string
): Promise<{ 
  result: any; 
  errors: OperationError[];
  successCount: number;
}> {
  
  let result = JSON.parse(JSON.stringify(resource));
  const errors: OperationError[] = [];
  let successCount = 0;
  
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    
    try {
      // Map deprecated/invalid paths to valid ones
      let mappedPath = op.path;
      let mappedValue = op.value;
      
      // Handle deprecated character.first_mes -> character.example_dialogue
      if (op.path === 'character.first_mes') {
        mappedPath = 'character.example_dialogue';
      }
      
      // Handle character.personality -> merge into character.description
      if (op.path === 'character.personality') {
        mappedPath = 'character.description';
        // If description already exists, append personality info
        if (result?.character?.description && op.value) {
          mappedValue = result.character.description + '\n\nPersonality: ' + op.value;
        }
      }

      // Create operation context with enhanced error context
      const context: OperationContext = {
        path: mappedPath,
        operation: op.operation,
        value: mappedValue,
        pathParts: mappedPath.replace(/\[(\d+)\]/g, '.$1').split('.').filter(p => p !== ''),
        resource: result,
        // Pass flowId from parameters if available
        flowId: flowId
      };
      
      // Use factory processor system
      const factoryResult = await processOperation(context);
      
      if (factoryResult.success && factoryResult.result) {
        result = factoryResult.result;
        successCount++;
      } else {
        const errorMessage = `Factory failed: ${factoryResult.error || 'Unknown error'}`;
        
        errors.push({
          operation: op,
          error: errorMessage,
          timestamp: new Date(),
          context: { 
            factoryError: factoryResult.error || 'Unknown error',
            deepMergeDisabled: 'Deep merge system disabled for testing',
            operationIndex: i + 1,
            resourceState: typeof result
          }
        });
      }
      
    } catch (unexpectedError) {
      const errorMessage = `Unexpected error during operation processing: ${unexpectedError?.toString?.() || String(unexpectedError) || 'Unknown error'}`;
      
      errors.push({
        operation: op,
        error: errorMessage,
        timestamp: new Date(),
        context: { 
          stack: (unexpectedError as Error)?.stack,
          operationIndex: i + 1,
          resourceState: typeof result,
          unexpectedError: true
        }
      });
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ [OPERATION-PROCESSOR] Errors encountered:', errors.map((e, index) => ({
      errorIndex: index + 1,
      path: e.operation.path,
      operation: e.operation.operation,
      error: e.error,
      timestamp: e.timestamp
    })));
  }
  
  return { result, errors, successCount };
}

/**
 * Apply a list of operations using only the deep merge strategy (legacy)
 * @deprecated This function is deprecated. Use applyOperations() instead.
 */
export function applyOperationsLegacy(resource: any, operations: Operation[]): any {
  console.warn('applyOperationsLegacy is deprecated. Use applyOperations() instead.');
  // Redirect to the new implementation without flowId
  return applyOperations(resource, operations).then(result => result.result);
}

// Legacy operation functions are now in separated modules
// Main processing now uses deep merge strategy for better path handling

/**
 * Check if operations would create a valid resource
 */
export async function validateOperations(resource: any, operations: Operation[]): Promise<{
  valid: boolean;
  errors: string[];
  operationErrors: OperationError[];
}> {
  const errors: string[] = [];
  let operationErrors: OperationError[] = [];
  
  try {
    const { result, errors: opErrors } = await applyOperations(resource, operations);
    operationErrors = opErrors;
    
    // Add operation errors to general errors
    if (opErrors.length > 0) {
      errors.push(...opErrors.map(e => `Operation ${e.operation.path}: ${e.error}`));
    }
    
    // Basic validation - ensure result is an object
    if (!result || typeof result !== 'object') {
      errors.push('Operations result in invalid resource');
    }
    
    // Resource-specific validation could go here
    // For example: check required fields exist
    
  } catch (error) {
    errors.push(`Failed to apply operations: ${error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    operationErrors
  };
}