/**
 * Base operation processing utilities
 */

export interface Operation {
  path: string;
  operation: 'set' | 'put' | 'remove';
  value?: any;
  metadata?: {
    changeReason: string;
    confidence: number;
  };
}

/**
 * Parse path string into parts
 * "agents.agent1.promptMessages[2]" → ["agents", "agent1", "promptMessages", "2"]
 */
export function parsePath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')  // [2] → .2
    .split('.')
    .filter(p => p !== '');
}

/**
 * Set value at path (replace existing value)
 */
export function setValueAtPath(obj: any, pathParts: string[], value: any): void {
  let current = obj;
  
  // Navigate to parent
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    
    if (current[part] === undefined) {
      // Create intermediate object/array as needed
      const nextPart = pathParts[i + 1];
      current[part] = isNaN(Number(nextPart)) ? {} : [];
    }
    
    current = current[part];
  }
  
  // Set the value
  const lastPart = pathParts[pathParts.length - 1];
  current[lastPart] = value;
}

/**
 * Remove value at path
 */
export function removeValueAtPath(obj: any, pathParts: string[]): void {
  if (pathParts.length === 0) return;
  
  let current = obj;
  
  // Navigate to parent
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (current[part] === undefined) return; // Path doesn't exist
    current = current[part];
  }
  
  const lastPart = pathParts[pathParts.length - 1];
  const index = Number(lastPart);
  
  if (!isNaN(index) && Array.isArray(current)) {
    // Remove from array (splice to maintain indices)
    current.splice(index, 1);
  } else {
    // Remove from object
    delete current[lastPart];
  }
}