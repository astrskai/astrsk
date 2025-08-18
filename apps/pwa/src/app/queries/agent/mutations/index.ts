/**
 * Agent Mutations Export
 * 
 * Central export point for all agent-related mutations
 * Organized by concern for easy access
 */

// Metadata mutations (name, description, color)
export * from './metadata-mutations';

// Model mutations (API type, model selection, tokens)
export * from './model-mutations';

// Prompt mutations (messages, text prompt, blocks)
export * from './prompt-mutations';

// Parameter mutations (enable/disable, values)
export * from './parameter-mutations';

// Structured output mutations (schema, fields, format)
export * from './structured-output-mutations';