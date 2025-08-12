import { ValidationIssue, ValidationIssueCode } from "@/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/flow-multi/validation/types/functional-validation-types";
import { forEachConnectedAgent, generateIssueId } from "@/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/flow-multi/validation/utils/message-generator";
import { VariableValidationData, SyntaxErrorData } from "@/flow-multi/validation/types/message-data-types";
import { Agent } from "@/modules/agent/domain";
import { TemplateRenderer } from "@/shared/utils/template-renderer";
import { VariableLibrary } from "@/shared/prompt/domain/variable";
import { sanitizeFileName } from "@/shared/utils/file-utils";

// Extract variables from template string, excluding local loop variables
const extractVariables = (template: string): string[] => {
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

// Check for undefined output variables
export const validateUndefinedOutputVariables: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  // Helper function to validate variables against available agents and data store schema
  const validateVariables = (variables: string[], sourceAgentId: string, sourceAgentName: string, location?: string, isHistoryMessage: boolean = false) => {
    for (const variable of variables) {
      // Check if it's a turn variable
      if (variable.startsWith('turn.')) {
        // Turn variables are only valid in history messages
        if (!isHistoryMessage) {
          const message = generateValidationMessage(ValidationIssueCode.TURN_VARIABLE_OUTSIDE_HISTORY, {
            agentName: sourceAgentName,
            variable,
            location
          });
          issues.push({
            id: generateIssueId(ValidationIssueCode.TURN_VARIABLE_OUTSIDE_HISTORY, sourceAgentId),
            code: ValidationIssueCode.TURN_VARIABLE_OUTSIDE_HISTORY,
            severity: 'error',
            ...message,
            agentId: sourceAgentId,
            agentName: sourceAgentName,
            metadata: { variable, location },
          });
        }
        continue;
      }
      
      // First check if it's a system variable (including nested paths like cast.active.name)
      if (VariableLibrary.isValidVariable(variable)) {
        continue; // It's a valid system variable, skip validation
      }
      
      // Check if it's a data store field that's actually configured in a connected data store node
      const dataStoreSchema = context.flow.props.dataStoreSchema;
      if (dataStoreSchema && dataStoreSchema.fields) {
        // First check if this variable matches a schema field name
        const schemaField = dataStoreSchema.fields.find(field => field.name === variable);
        if (schemaField) {
          // Now check if any connected data store node has this field configured
          let isFieldConfigured = false;
          
          // Check all connected nodes for data store nodes
          for (const nodeId of context.connectedNodes) {
            const node = context.flow.props.nodes.find(n => n.id === nodeId);
            if (node && node.type === 'dataStore') {
              // Check if this data store node has the field configured
              const nodeData = node.data as any;
              if (nodeData?.dataStoreFields) {
                // Check if this field is imported in this node
                const hasField = nodeData.dataStoreFields.some((f: any) => 
                  f.schemaFieldId === schemaField.id
                );
                if (hasField) {
                  isFieldConfigured = true;
                  break;
                }
              }
            }
          }
          
          if (isFieldConfigured) {
            continue; // It's a valid configured data store field
          } else {
            // Field exists in schema but not configured in any connected data store node
            const message = generateValidationMessage(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, {
              agentName: sourceAgentName,
              referencedAgent: 'datastore',
              field: variable,
              variable,
              location
            });
            issues.push({
              id: generateIssueId(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, sourceAgentId),
              code: ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE,
              severity: 'error',
              ...message,
              agentId: sourceAgentId,
              agentName: sourceAgentName,
              metadata: { variable, referencedAgent: 'datastore', field: variable },
            });
            continue;
          }
        }
      }
      
      // If not a system variable or data store field, check if it references an agent's output
      const parts = variable.split('.');
      
      // Handle both agent.field format and single agent references
      const referencedAgentName = parts[0];
      const fieldParts = parts.slice(1);
      
      // Find the referenced agent by comparing sanitized names (only among connected agents)
      let referencedAgent: Agent | undefined;
      let originalAgentName: string | undefined;
      for (const connectedAgentId of context.connectedAgents) {
        const a = context.agents.get(connectedAgentId);
        if (a) {
          const sanitizedName = sanitizeFileName(a.props.name);
          if (sanitizedName === referencedAgentName) {
            referencedAgent = a;
            originalAgentName = a.props.name;
            break;
          }
        }
      }
      
      if (!referencedAgent || !originalAgentName) {
        const message = generateValidationMessage(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, {
          agentName: sourceAgentName,
          referencedAgent: referencedAgentName,
          variable,
          location
        });
        issues.push({
          id: generateIssueId(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, sourceAgentId),
          code: ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE,
          severity: 'error',
          ...message,
          agentId: sourceAgentId,
          agentName: sourceAgentName,
          metadata: { variable, referencedAgent: referencedAgentName },
        });
        continue;
      }
      
      // If there are field parts, check if the field exists
      if (fieldParts.length > 0) {
        const topLevelField = fieldParts[0];
        let fieldExists = false;
        
        if (referencedAgent.props.enabledStructuredOutput && referencedAgent.props.schemaFields) {
          // When structured output is enabled, check against defined fields
          fieldExists = referencedAgent.props.schemaFields.some(
            field => field.name === topLevelField
          );
        } else {
          // When structured output is disabled, only 'response' field is valid
          fieldExists = topLevelField === 'response';
        }
        
        if (!fieldExists) {
          const message = generateValidationMessage(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, {
            agentName: sourceAgentName,
            referencedAgent: originalAgentName, // Use original name in error message
            field: topLevelField,
            variable,
            location
          });
          issues.push({
            id: generateIssueId(ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE, sourceAgentId),
            code: ValidationIssueCode.UNDEFINED_OUTPUT_VARIABLE,
            severity: 'error',
            ...message,
            agentId: sourceAgentId,
            agentName: sourceAgentName,
            metadata: { variable, referencedAgent: originalAgentName, field: topLevelField },
          });
        }
      }
      // If it's just an agent reference without field (e.g., {{analyzer}}), it's valid as long as the agent exists
    }
  };
  
  // Check each agent's templates
  context.connectedAgents.forEach(agentId => {
    const agent = context.agents.get(agentId);
    if (!agent) return;
    
    // 1. Check prompt messages (including history messages)
    agent.props.promptMessages?.forEach((message, messageIndex) => {
      if ('promptBlocks' in message) {
        // Regular prompt messages and merge type history messages
        message.promptBlocks?.forEach(block => {
          if (block.type === 'plain' && block.template) {
            const variables = extractVariables(block.template);
            // Use the block's name if available, otherwise fall back to generic message name
            const blockName = (block as any).name || `Message ${messageIndex + 1}`;
            validateVariables(variables, agentId, agent.props.name, `prompt message "${blockName}"`, false);
          }
        });
      }
      
      // History messages with split type have separate user/assistant blocks
      if ('userPromptBlocks' in message) {
        message.userPromptBlocks?.forEach(block => {
          if (block.type === 'plain' && block.template) {
            const variables = extractVariables(block.template);
            // Use the block's name if available, otherwise fall back to generic history message name
            const blockName = (block as any).name || `History ${messageIndex + 1}`;
            validateVariables(variables, agentId, agent.props.name, `history message "${blockName}" (user)`, true);
          }
        });
      }
      
      if ('assistantPromptBlocks' in message) {
        message.assistantPromptBlocks?.forEach(block => {
          if (block.type === 'plain' && block.template) {
            const variables = extractVariables(block.template);
            // Use the block's name if available, otherwise fall back to generic history message name
            const blockName = (block as any).name || `History ${messageIndex + 1}`;
            validateVariables(variables, agentId, agent.props.name, `history message "${blockName}" (assistant)`, true);
          }
        });
      }
    });
    
    // 2. Check structured output field descriptions
    if (agent.props.schemaFields) {
      agent.props.schemaFields.forEach(field => {
        if (field.description) {
          const variables = extractVariables(field.description);
          validateVariables(variables, agentId, agent.props.name, `output "${field.name}"`, false);
        }
      });
    }
    
    // 3. Check schema description
    if (agent.props.schemaDescription) {
      const variables = extractVariables(agent.props.schemaDescription);
      validateVariables(variables, agentId, agent.props.name, `output description`, false);
    }
  });
  
  // Check flow's response template separately
  if (context.flow.props.responseTemplate) {
    const responseVariables = extractVariables(context.flow.props.responseTemplate);
    validateVariables(responseVariables, 'response-design', 'Response Design', undefined, false);
  }
  
  // Check if-node condition fields
  context.connectedNodes.forEach(nodeId => {
    const node = context.flow.props.nodes.find(n => n.id === nodeId);
    if (node && node.type === 'if') {
      const nodeData = node.data as any;
      const nodeName = nodeData?.label || `If-node ${nodeId}`;
      
      // Check conditions (both conditions and draftConditions)
      const conditions = nodeData?.conditions || nodeData?.draftConditions || [];
      conditions.forEach((condition: any, index: number) => {
        // Check value1 field for variables
        if (condition.value1 && typeof condition.value1 === 'string') {
          // Extract variables from value1 (it might contain {{variable}} syntax)
          const value1Variables = extractVariables(condition.value1);
          if (value1Variables.length > 0) {
            validateVariables(value1Variables, nodeId, nodeName, `condition ${index + 1} value1`, false);
          }
        }
        
        // Check value2 field for variables
        if (condition.value2 && typeof condition.value2 === 'string') {
          // Extract variables from value2
          const value2Variables = extractVariables(condition.value2);
          if (value2Variables.length > 0) {
            validateVariables(value2Variables, nodeId, nodeName, `condition ${index + 1} value2`, false);
          }
        }
      });
    }
  });
  
  // Check data store node logic fields
  context.connectedNodes.forEach(nodeId => {
    const node = context.flow.props.nodes.find(n => n.id === nodeId);
    if (node && node.type === 'dataStore') {
      const nodeData = node.data as any;
      const nodeName = nodeData?.label || `DataStore-node ${nodeId}`;
      
      // Check each data store field's logic expression
      if (nodeData?.dataStoreFields && Array.isArray(nodeData.dataStoreFields)) {
        nodeData.dataStoreFields.forEach((field: any, index: number) => {
          if (field.logic && typeof field.logic === 'string') {
            // Extract variables from the logic expression
            const logicVariables = extractVariables(field.logic);
            if (logicVariables.length > 0) {
              const fieldName = field.name || `field ${index + 1}`;
              validateVariables(logicVariables, nodeId, nodeName, `field "${fieldName}" logic`, false);
            }
          }
        });
      }
    }
  });
  
  return issues;
};

// Check for unused output variables
export const validateUnusedOutputVariables: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent, context) => {
    const issues: ValidationIssue[] = [];
    
    // Only check agents with structured output
    if (!agent.props.enabledStructuredOutput || !agent.props.schemaFields) {
      return issues;
    }
    
    // Get the sanitized agent name for variable references
    const sanitizedAgentName = sanitizeFileName(agent.props.name);
    
    // Get all variables that could be used from this agent
    const agentOutputVariables = agent.props.schemaFields.map(field => 
      `${sanitizedAgentName}.${field.name}`
    );
    
    // Check if the parent agent variable (e.g., {{analyzer}}) is used
    let isParentAgentUsed = false;
    
    // Check all connected agents for parent agent usage
    for (const otherAgentId of context.connectedAgents) {
      if (otherAgentId === agentId) continue;
      
      const otherAgent = context.agents.get(otherAgentId);
      if (!otherAgent) continue;
      
      // Helper function to check if template contains the variable
      const checkTemplate = (template: string | undefined) => {
        if (!template) return false;
        return template.includes(`{{${sanitizedAgentName}}}`) || 
               template.includes(`{{ ${sanitizedAgentName} }}`);
      };
      
      // Check prompts
      otherAgent.props.promptMessages?.forEach(message => {
        if ('promptBlocks' in message) {
          message.promptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isParentAgentUsed = true;
            }
          });
        }
        
        // Check history messages
        if ('userPromptBlocks' in message) {
          message.userPromptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isParentAgentUsed = true;
            }
          });
        }
        
        if ('assistantPromptBlocks' in message) {
          message.assistantPromptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isParentAgentUsed = true;
            }
          });
        }
      });
      
      // Check structured output field descriptions
      if (otherAgent.props.schemaFields) {
        otherAgent.props.schemaFields.forEach(field => {
          if (checkTemplate(field.description)) {
            isParentAgentUsed = true;
          }
        });
      }
      
      // Check schema description (response design)
      if (checkTemplate(otherAgent.props.schemaDescription)) {
        isParentAgentUsed = true;
      }
      
      if (isParentAgentUsed) break;
    }
    
    // Also check flow's response template for parent agent usage
    if (context.flow.props.responseTemplate) {
      const checkTemplate = (template: string) => {
        return template.includes(`{{${sanitizedAgentName}}}`) || 
               template.includes(`{{ ${sanitizedAgentName} }}`);
      };
      
      if (checkTemplate(context.flow.props.responseTemplate)) {
        isParentAgentUsed = true;
      }
    }
    
    // If parent agent is used, all fields are considered used
    if (isParentAgentUsed) {
      return issues;
    }
    
    // Check if these variables are used anywhere
    for (const variable of agentOutputVariables) {
      let isUsed = false;
      
      // Check all connected agents
      for (const otherAgentId of context.connectedAgents) {
        if (otherAgentId === agentId) continue;
        
        const otherAgent = context.agents.get(otherAgentId);
        if (!otherAgent) continue;
        
        // Helper function to check if template contains the variable
        const checkTemplate = (template: string | undefined) => {
          if (!template) return false;
          return template.includes(`{{${variable}}}`) || 
                 template.includes(`{{ ${variable} }}`);
        };
        
        // Check prompts
        otherAgent.props.promptMessages?.forEach(message => {
          if ('promptBlocks' in message) {
            message.promptBlocks?.forEach(block => {
              if (block.type === 'plain' && checkTemplate(block.template)) {
                isUsed = true;
              }
            });
          }
          
          // Check history messages
          if ('userPromptBlocks' in message) {
            message.userPromptBlocks?.forEach(block => {
              if (block.type === 'plain' && checkTemplate(block.template)) {
                isUsed = true;
              }
            });
          }
          
          if ('assistantPromptBlocks' in message) {
            message.assistantPromptBlocks?.forEach(block => {
              if (block.type === 'plain' && checkTemplate(block.template)) {
                isUsed = true;
              }
            });
          }
        });
        
        // Check structured output field descriptions
        if (otherAgent.props.schemaFields) {
          otherAgent.props.schemaFields.forEach(field => {
            if (checkTemplate(field.description)) {
              isUsed = true;
            }
          });
        }
        
        // Check schema description (response design)
        if (checkTemplate(otherAgent.props.schemaDescription)) {
          isUsed = true;
        }
        
        if (isUsed) break;
      }
      
      // Also check flow's response template
      if (!isUsed && context.flow.props.responseTemplate) {
        const checkTemplate = (template: string) => {
          return template.includes(`{{${variable}}}`) || 
                 template.includes(`{{ ${variable} }}`);
        };
        
        if (checkTemplate(context.flow.props.responseTemplate)) {
          isUsed = true;
        }
      }
      
      if (!isUsed) {
        const fieldName = variable.split('.')[1];
        const message = generateValidationMessage(ValidationIssueCode.UNUSED_OUTPUT_VARIABLE, {
          agentName: agent.props.name,
          field: fieldName,
          variable
        });
        issues.push({
          id: generateIssueId(ValidationIssueCode.UNUSED_OUTPUT_VARIABLE, agentId),
          code: ValidationIssueCode.UNUSED_OUTPUT_VARIABLE,
          severity: 'warning',
          ...message,
          agentId,
          agentName: agent.props.name,
          metadata: { variable, field: fieldName },
        });
      }
    }
    
    return issues;
  }
);

// Check for unused data store fields
export const validateUnusedDataStoreFields: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  // Only check if data store schema is defined
  if (!context.flow.props.dataStoreSchema) {
    return issues;
  }
  
  const dataStoreFields = context.flow.props.dataStoreSchema.fields;
  
  // Check each field for usage
  for (const field of dataStoreFields) {
    const variable = field.name; // Use direct field name, not datastore.fieldname
    let isUsed = false;
    
    // Helper function to check if template contains the variable
    const checkTemplate = (template: string | undefined) => {
      if (!template) return false;
      return template.includes(`{{${variable}}}`) || 
             template.includes(`{{ ${variable} }}`);
    };
    
    // Check all connected agents
    for (const agentId of context.connectedAgents) {
      const agent = context.agents.get(agentId);
      if (!agent) continue;
      
      // Check prompts
      agent.props.promptMessages?.forEach(message => {
        if ('promptBlocks' in message) {
          message.promptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isUsed = true;
            }
          });
        }
        
        // Check history messages
        if ('userPromptBlocks' in message) {
          message.userPromptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isUsed = true;
            }
          });
        }
        
        if ('assistantPromptBlocks' in message) {
          message.assistantPromptBlocks?.forEach(block => {
            if (block.type === 'plain' && checkTemplate(block.template)) {
              isUsed = true;
            }
          });
        }
      });
      
      // Check structured output field descriptions
      if (agent.props.schemaFields) {
        agent.props.schemaFields.forEach(schemaField => {
          if (checkTemplate(schemaField.description)) {
            isUsed = true;
          }
        });
      }
      
      // Check schema description
      if (checkTemplate(agent.props.schemaDescription)) {
        isUsed = true;
      }
      
      if (isUsed) break;
    }
    
    // Also check flow's response template
    if (!isUsed && context.flow.props.responseTemplate) {
      if (checkTemplate(context.flow.props.responseTemplate)) {
        isUsed = true;
      }
    }
    
    if (!isUsed) {
      const message = generateValidationMessage(ValidationIssueCode.UNUSED_OUTPUT_VARIABLE, {
        agentName: 'Data Store',
        field: field.name,
        variable: `{{${variable}}}`
      });
      issues.push({
        id: generateIssueId(ValidationIssueCode.UNUSED_OUTPUT_VARIABLE, 'datastore'),
        code: ValidationIssueCode.UNUSED_OUTPUT_VARIABLE,
        severity: 'warning',
        ...message,
        agentId: 'datastore',
        agentName: 'Data Store',
        metadata: { variable: `{{${variable}}}`, field: field.name },
      });
    }
  }
  
  return issues;
};

// Check for syntax errors in templates
export const validateTemplateSyntax: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  // First check all agents' templates
  context.connectedAgents.forEach(agentId => {
    const agent = context.agents.get(agentId);
    if (!agent) return;
    
    agent.props.promptMessages?.forEach((message, messageIndex) => {
      if ('promptBlocks' in message) {
        message.promptBlocks?.forEach((block, blockIndex) => {
          if (block.type === 'plain' && block.template) {
            try {
              // Try to render with empty context to check syntax
              TemplateRenderer.render(block.template, {});
            } catch (error: any) {
              const message = generateValidationMessage(ValidationIssueCode.SYNTAX_ERROR, {
                agentName: agent.props.name,
                error: error.message
              });
              issues.push({
                id: generateIssueId(ValidationIssueCode.SYNTAX_ERROR, agentId),
                code: ValidationIssueCode.SYNTAX_ERROR,
                severity: 'error',
                ...message,
                agentId,
                agentName: agent.props.name,
                metadata: {
                  messageIndex,
                  blockIndex,
                  error: error.message,
                  template: block.template
                },
              });
            }
          }
        });
      }
    });
  });
  
  // Also check flow's response template syntax
  if (context.flow.props.responseTemplate) {
    try {
      // Try to render with empty context to check syntax
      TemplateRenderer.render(context.flow.props.responseTemplate, {});
    } catch (error: any) {
      const message = generateValidationMessage(ValidationIssueCode.SYNTAX_ERROR, {
        agentName: 'Response Design',
        error: error.message
      });
      issues.push({
        id: generateIssueId(ValidationIssueCode.SYNTAX_ERROR, 'response-design'),
        code: ValidationIssueCode.SYNTAX_ERROR,
        severity: 'error',
        ...message,
        agentId: 'response-design',
        agentName: 'Response Design',
        metadata: {
          error: error.message,
          template: context.flow.props.responseTemplate
        },
      });
    }
  }
  
  return issues;
};