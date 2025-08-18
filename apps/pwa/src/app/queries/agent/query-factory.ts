/**
 * Agent Query Factory
 * 
 * Centralized query key factory for all agent-related queries.
 * Ensures consistent query key structure across the application.
 */

export const agentKeys = {
  // Root key for all agent queries
  all: ['agents'] as const,
  
  // List queries
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters?: any) => [...agentKeys.lists(), filters] as const,
  
  // Detail queries
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  
  // Agent metadata
  metadata: (id: string) => [...agentKeys.detail(id), 'metadata'] as const,
  
  // Agent prompts
  prompts: (id: string) => [...agentKeys.detail(id), 'prompts'] as const,
  prompt: (id: string, promptId: string) => [...agentKeys.prompts(id), promptId] as const,
  messages: (id: string) => [...agentKeys.detail(id), 'messages'] as const,
  message: (id: string, messageId: string) => [...agentKeys.messages(id), messageId] as const,
  
  // Agent model configuration
  model: (id: string) => [...agentKeys.detail(id), 'model'] as const,
  apiType: (id: string) => [...agentKeys.detail(id), 'apiType'] as const,
  
  // Agent parameters
  parameters: (id: string) => [...agentKeys.detail(id), 'parameters'] as const,
  parameter: (id: string, paramName: string) => [...agentKeys.parameters(id), paramName] as const,
  
  // Agent structured output
  structuredOutput: (id: string) => [...agentKeys.detail(id), 'structuredOutput'] as const,
  schema: (id: string) => [...agentKeys.detail(id), 'schema'] as const,
  schemaField: (id: string, fieldName: string) => [...agentKeys.schema(id), fieldName] as const,
  
  // Agent relationships
  flows: (id: string) => [...agentKeys.detail(id), 'flows'] as const,
  sessions: (id: string) => [...agentKeys.detail(id), 'sessions'] as const,
};