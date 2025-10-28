import { ValidationContext, ValidationIssue } from "@/entities/flow/model/validation-types";
import { ValidatorFunction, ValidatorComposer, ValidatorFilter, ValidatorEnhancer } from "@/features/flow/flow-multi/validation/types/functional-validation-types";

// Compose multiple validators into one
export const composeValidators: ValidatorComposer = (...validators) => (context) => {
  return validators.flatMap(validator => validator(context));
};

// Filter validator based on predicate
export const filterValidator: ValidatorFilter = (predicate) => (validator) => (context) => {
  if (!predicate(context)) return [];
  return validator(context);
};

// Enhance validator with additional functionality
export const withLogging: ValidatorEnhancer = (validator) => (context) => {
  console.log(`Running validator on flow: ${context.flow.id}`);
  const issues = validator(context);
  console.log(`Found ${issues.length} issues`);
  return issues;
};

// Only run validator if agents exist
export const requireAgents: ValidatorFilter = (predicate = () => true) => 
  filterValidator((context) => context.agents.size > 0 && predicate(context));

// Only run validator for connected agents
export const requireConnectedAgents: ValidatorFilter = () => 
  filterValidator((context) => context.connectedAgents.size > 0);

// Map over connected agents
export const forEachConnectedAgent = (
  fn: (agentId: string, agent: any, context: ValidationContext) => ValidationIssue[]
): ValidatorFunction => (context) => {
  const issues: ValidationIssue[] = [];
  
  for (const agentId of context.connectedAgents) {
    const agent = context.agents.get(agentId);
    if (agent) {
      issues.push(...fn(agentId, agent, context));
    }
  }
  
  return issues;
};

// Generate unique issue ID
export const generateIssueId = (code: string, agentId?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return agentId ? `${code}_${agentId}_${timestamp}_${random}` : `${code}_${timestamp}_${random}`;
};