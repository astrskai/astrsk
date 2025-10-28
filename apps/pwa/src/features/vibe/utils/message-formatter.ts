/**
 * Format step-by-step plan for display
 */
export function formatStepPlan(plan: any[]): string {
  if (!plan || plan.length === 0) return '';

  const steps = plan.map((step, index) => {
    const stepNum = index + 1;
    const description = step.description || step.stepDescription || 'No description';
    const complexity = step.estimatedComplexity || step.complexity;
    
    let formattedStep = `${stepNum}. ${description}`;
    
    if (complexity) {
      formattedStep += ` (${complexity} complexity)`;
    }
    
    return formattedStep;
  });

  return steps.join('\n');
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.errorDetails) {
    return error.errorDetails;
  }
  
  return 'An unknown error occurred';
}

/**
 * Format resource name for display
 */
export function formatResourceName(resource: any): string {
  if (resource.name) return resource.name;
  if (resource.props?.name) return resource.props.name;
  if (resource.common?.title) return resource.common.title;
  if (resource.character?.name) return resource.character.name;
  return 'Unnamed Resource';
}

/**
 * Get conversation history from messages for AI context
 */
export function formatConversationHistory(messages: any[]): any[] {
  return messages
    .filter(msg => !msg.isProcessing && (msg.role === 'user' || msg.role === 'assistant'))
    .map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
}

/**
 * Format change summary for display
 */
export function formatChangeSummary(changes: any[]): string {
  if (!changes || changes.length === 0) {
    return 'No changes';
  }

  const summary = {
    set: 0,
    put: 0,
    remove: 0,
  };

  changes.forEach(change => {
    if (summary[change.operation as keyof typeof summary] !== undefined) {
      summary[change.operation as keyof typeof summary]++;
    }
  });

  const parts = [];
  if (summary.set > 0) parts.push(`${summary.set} edit${summary.set !== 1 ? 's' : ''}`);
  if (summary.put > 0) parts.push(`${summary.put} addition${summary.put !== 1 ? 's' : ''}`);
  if (summary.remove > 0) parts.push(`${summary.remove} removal${summary.remove !== 1 ? 's' : ''}`);

  return parts.join(', ') || 'No changes';
}