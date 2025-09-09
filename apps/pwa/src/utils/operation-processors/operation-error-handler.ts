/**
 * Standardized Error Handling for Operation Processors
 * 
 * Provides consistent error formatting, logging, and user notifications
 * across all operation processors.
 */

export interface OperationErrorContext {
  operation: string;
  path: string;
  processor: string;
  inputData?: any;
  transformedData?: any;
}

export interface StandardOperationError {
  success: false;
  error: string;
  code?: string;
  context?: OperationErrorContext;
}

export interface ErrorHandlerOptions {
  /** Log level for console output */
  logLevel?: 'error' | 'warn' | 'debug';
  /** Include input/transformed data in logs (for debugging) */
  includeData?: boolean;
  /** Show toast notification to user for critical errors */
  showToast?: boolean;
  /** Custom user-friendly message for toast */
  userMessage?: string;
}

/**
 * Centralized error handler for operation processors
 * 
 * Features:
 * - Consistent error formatting across all processors
 * - Structured logging with operation context
 * - Optional user toast notifications for critical errors
 * - Configurable data inclusion for debugging
 * 
 * @param error - The error that occurred
 * @param context - Operation context for debugging
 * @param options - Configuration options
 */
export function handleOperationError(
  error: Error | string, 
  context: OperationErrorContext,
  options: ErrorHandlerOptions = {}
): StandardOperationError {
  
  const {
    logLevel = 'error',
    includeData = false,
    showToast = false,
    userMessage
  } = options;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const errorCode = error instanceof Error ? error.name : 'OPERATION_ERROR';
  
  // Structured console logging
  const logData = {
    path: context.path,
    error: errorMessage,
    processor: context.processor,
    operation: context.operation,
    ...(includeData && context.inputData && { inputData: context.inputData }),
    ...(includeData && context.transformedData && { transformedData: context.transformedData })
  };

  const logPrefix = `[${context.processor.toUpperCase()}]`;
  
  switch (logLevel) {
    case 'error':
      console.error(`${logPrefix} ${context.operation} failed:`, logData);
      break;
    case 'warn':
      console.warn(`${logPrefix} ${context.operation} warning:`, logData);
      break;
    case 'debug':
      console.debug(`${logPrefix} ${context.operation} debug:`, logData);
      break;
  }

  // Show user toast notification for critical errors
  if (showToast) {
    showErrorToast(userMessage || generateUserFriendlyMessage(context), errorMessage);
  }

  return {
    success: false,
    error: `${context.operation} failed: ${errorMessage}`,
    code: errorCode,
    context
  };
}

/**
 * Generate user-friendly error message based on operation context
 */
function generateUserFriendlyMessage(context: OperationErrorContext): string {
  const { operation, processor } = context;
  
  // Map technical operations to user-friendly messages
  const operationMessages: Record<string, string> = {
    'update_name': 'Failed to update flow name',
    'update_response_template': 'Failed to update response template',
    'update_data_store_schema': 'Failed to update data store schema',
    'parse_prompt_message': 'Failed to process prompt message',
    'update_agent_field': 'Failed to update agent configuration',
    'update_if_node_conditions': 'Failed to update condition logic',
    'update_data_store_field': 'Failed to update data store field',
    'append_data_store_field': 'Failed to add new data store field',
    'append_agent_schema_field': 'Failed to add new agent schema field',
    'append_prompt_message': 'Failed to add new prompt message'
  };

  const processorNames: Record<string, string> = {
    'flow-fields': 'Flow',
    'agent-operations': 'Agent',
    'data-store-nodes': 'Data Store',
    'data-store-schema': 'Data Store Schema',
    'if-nodes': 'Conditional Logic'
  };

  const userOperation = operationMessages[operation] || `Failed to ${operation.replace(/_/g, ' ')}`;
  const userProcessor = processorNames[processor] || processor;
  
  return `${userProcessor}: ${userOperation}`;
}

/**
 * Show error toast to user using the app's toast system
 */
function showErrorToast(title: string, details?: string) {
  try {
    // Import toast dynamically to avoid circular dependencies
    import('sonner').then((module) => {
      const { toast } = module;
      toast.error(title, {
        description: details ? `Details: ${details}` : undefined,
        duration: 5000
      });
    }).catch(err => {
      console.warn('Could not show error toast:', err);
      // Fallback to console notification
      console.error('USER NOTIFICATION:', title, details);
    });
  } catch (err) {
    console.warn('Toast system not available:', err);
    console.error('USER NOTIFICATION:', title, details);
  }
}

/**
 * Convenience function for critical errors that should notify the user
 */
export function handleCriticalError(
  error: Error | string,
  context: OperationErrorContext,
  userMessage?: string
): StandardOperationError {
  return handleOperationError(error, context, {
    showToast: true,
    includeData: true,
    userMessage
  });
}

/**
 * Convenience function for development/debugging errors
 */
export function handleDebugError(
  error: Error | string,
  context: OperationErrorContext
): StandardOperationError {
  return handleOperationError(error, context, {
    logLevel: 'debug',
    includeData: true
  });
}