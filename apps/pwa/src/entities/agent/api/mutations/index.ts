/**
 * Agent Mutations Export
 * 
 * Central export point for all agent-related mutations
 * Organized by concern for easy access
 */

// Agent node mutations (name update from flow editor)
export * from './agent-node-mutations';

// Model mutations (API type, model selection)
export * from './model-mutations';

// Prompt mutations (messages, text prompt)
export * from './prompt-mutations-new';

// Parameter mutations (enable/disable, values)
export * from './parameter-mutations';

// Output mutations (format, schema fields)
export * from './output-mutations';