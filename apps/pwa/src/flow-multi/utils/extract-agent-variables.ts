/**
 * Utility for extracting agent name variables from template strings
 * Uses the same parsing logic as the variable validators
 */

import { sanitizeFileName } from "@/shared/lib/file-utils";

/**
 * Extract all variables from a template string, excluding local loop variables
 * This is the same logic used in variable-validators.ts
 */
export const extractVariables = (template: string): string[] => {
  const loopVariables = new Set<string>();
  const variables: string[] = [];
  let match;
  
  // First, find all loop variables and the variables they iterate over
  const forLoopPattern = /\{%\s*for\s+(\w+)(?:\s*,\s*(\w+))?\s+in\s+([^%]+)\s*%\}/g;
  
  while ((match = forLoopPattern.exec(template)) !== null) {
    loopVariables.add(match[1]); // Add the loop variable
    if (match[2]) {
      loopVariables.add(match[2]); // Add second variable if it's a key,value loop
    }
    
    // Extract the iterable expression (e.g., "cast.inactive" from "{% for npc in cast.inactive %}")
    const iterableExpression = match[3].trim();
    // Extract variable from the iterable expression
    const iterableMatch = iterableExpression.match(/^(\w+(?:\.\w+)*)/);
    if (iterableMatch) {
      variables.push(iterableMatch[1]);
    }
  }
  
  // Also find variables defined in {% set %} statements (these are also local)
  const setPattern = /\{%\s*set\s+(\w+)\s*=\s*([^%]+)\s*%\}/g;
  while ((match = setPattern.exec(template)) !== null) {
    loopVariables.add(match[1]);
    
    // Also extract variables from the right side of the assignment
    const assignmentExpression = match[2].trim();
    // Handle potential filters in the assignment
    const pipeIndex = assignmentExpression.indexOf('|');
    const variablePart = pipeIndex !== -1 ? assignmentExpression.substring(0, pipeIndex).trim() : assignmentExpression;
    
    const varMatches = variablePart.match(/\b(\w+(?:\.\w+)*)\b/g);
    if (varMatches) {
      varMatches.forEach(v => {
        const baseVar = v.split('.')[0];
        if (!loopVariables.has(baseVar)) {
          variables.push(v);
        }
      });
    }
  }
  
  // Extract variables from {% if %}, {% elif %} conditions
  const conditionalPattern = /\{%\s*(?:if|elif)\s+([^%]+)\s*%\}/g;
  while ((match = conditionalPattern.exec(template)) !== null) {
    const condition = match[1].trim();
    const varMatches = condition.match(/\b(\w+(?:\.\w+)*)\b/g);
    if (varMatches) {
      varMatches.forEach(v => {
        const baseVar = v.split('.')[0];
        if (!loopVariables.has(baseVar) && !['true', 'false', 'none', 'null', 'and', 'or', 'not', 'in', 'is'].includes(baseVar.toLowerCase())) {
          variables.push(v);
        }
      });
    }
  }
  
  // Now extract all variables used in {{ }} expressions
  const variablePattern = /\{\{([^}]+)\}\}/g;
  
  while ((match = variablePattern.exec(template)) !== null) {
    const expression = match[1].trim();
    if (!expression || expression.includes('history')) {
      continue;
    }
    
    // Handle Jinja2 filters - split by pipe and only process the variable part
    const pipeIndex = expression.indexOf('|');
    const variablePart = pipeIndex !== -1 ? expression.substring(0, pipeIndex).trim() : expression;
    
    // Extract all variable references from the variable part only
    const varMatches = variablePart.match(/\b(\w+(?:\.\w+)*)\b/g);
    if (varMatches) {
      varMatches.forEach(v => {
        const baseVar = v.split('.')[0];
        // Only add if it's not a local loop variable and not a Jinja2 filter/function
        if (!loopVariables.has(baseVar) && !['range', 'dict', 'list', 'tuple', 'set'].includes(baseVar)) {
          variables.push(v);
        }
      });
    }
  }
  
  // Remove duplicates and return
  return [...new Set(variables)];
};

/**
 * Extract agent name variables from a template
 * Returns a Set of sanitized agent names that are referenced in the template
 * @param template The template string to parse
 * @param knownAgentNames Optional set of known agent names (sanitized) to filter by
 */
export function extractAgentVariables(template: string, knownAgentNames?: Set<string>): Set<string> {
  const variables = extractVariables(template);
  const agentNames = new Set<string>();
  
  for (const variable of variables) {
    // Get the base variable name (before any dots)
    const baseName = variable.split('.')[0];
    
    // Skip system variables
    if (['turn', 'cast', 'session', 'flow', 'card'].includes(baseName)) {
      continue;
    }
    
    // If we have a list of known agent names, only include those
    if (knownAgentNames) {
      if (knownAgentNames.has(baseName)) {
        agentNames.add(baseName);
      }
    } else {
      // Otherwise include all non-system variables as potential agent names
      agentNames.add(baseName);
    }
  }
  
  return agentNames;
}

/**
 * Replace agent name references in a template
 * @param template The template string to update
 * @param oldSanitizedName The old sanitized agent name
 * @param newSanitizedName The new sanitized agent name
 * @returns The updated template string
 */
export function replaceAgentReferences(
  template: string, 
  oldSanitizedName: string, 
  newSanitizedName: string
): string {
  if (!template || oldSanitizedName === newSanitizedName) {
    return template;
  }
  
  // Replace in {{ }} expressions (handles both {{agent.field}} and {{agent}})
  // We need to be careful to match word boundaries to avoid partial replacements
  let result = template;
  
  // Replace {{oldName.something}} with {{newName.something}}
  const dotPattern = new RegExp(`\\{\\{\\s*${oldSanitizedName}\\.`, 'g');
  result = result.replace(dotPattern, `{{${newSanitizedName}.`);
  
  // Replace {{ oldName.something }} with {{ newName.something }} (with spaces)
  const dotPatternSpaces = new RegExp(`\\{\\{\\s*${oldSanitizedName}\\s*\\.`, 'g');
  result = result.replace(dotPatternSpaces, `{{ ${newSanitizedName}.`);
  
  // Replace {{oldName}} with {{newName}} (exact match)
  const exactPattern = new RegExp(`\\{\\{\\s*${oldSanitizedName}\\s*\\}\\}`, 'g');
  result = result.replace(exactPattern, `{{${newSanitizedName}}}`);
  
  // Replace in {% %} expressions (for loops, conditions, etc.)
  // Replace in for loops: {% for item in oldName.items %}
  const forPattern = new RegExp(`(\\{%\\s*for\\s+\\w+(?:\\s*,\\s*\\w+)?\\s+in\\s+)${oldSanitizedName}(\\.\\w+|\\s*%\\})`, 'g');
  result = result.replace(forPattern, `$1${newSanitizedName}$2`);
  
  // Replace in conditions: {% if oldName.field %}
  const conditionPattern = new RegExp(`(\\{%\\s*(?:if|elif)\\s+[^%]*\\b)${oldSanitizedName}(\\.)`, 'g');
  result = result.replace(conditionPattern, `$1${newSanitizedName}$2`);
  
  // Replace in set statements: {% set var = oldName.field %}
  const setPattern = new RegExp(`(\\{%\\s*set\\s+\\w+\\s*=\\s*[^%]*\\b)${oldSanitizedName}(\\.)`, 'g');
  result = result.replace(setPattern, `$1${newSanitizedName}$2`);
  
  return result;
}

/**
 * Check if a template contains references to a specific agent
 * @param template The template string to check
 * @param sanitizedAgentName The sanitized agent name to look for
 */
export function hasAgentReferences(template: string, sanitizedAgentName: string): boolean {
  if (!template) return false;
  
  // Check for {{agent}} or {{agent.field}} references
  const patterns = [
    new RegExp(`\\{\\{\\s*${sanitizedAgentName}\\s*\\}\\}`, 'g'), // {{agent}}
    new RegExp(`\\{\\{\\s*${sanitizedAgentName}\\.`, 'g'), // {{agent.field}}
    new RegExp(`\\{%[^%]*\\b${sanitizedAgentName}\\.`, 'g'), // {% ... agent.field ... %}
  ];
  
  return patterns.some(pattern => pattern.test(template));
}