import { ValidationContext, ValidationIssue } from "./validation-types";

// Functional validator type - a pure function that takes context and returns issues
export type ValidatorFunction = (context: ValidationContext) => ValidationIssue[];

// Validator with metadata for better management
export interface FunctionalValidator {
  name: string;
  description: string;
  enabled: boolean;
  validate: ValidatorFunction;
}

// Validator composer for combining multiple validators
export type ValidatorComposer = (...validators: ValidatorFunction[]) => ValidatorFunction;

// Validator filter for conditional validation
export type ValidatorFilter = (predicate: (context: ValidationContext) => boolean) => 
  (validator: ValidatorFunction) => ValidatorFunction;

// Validator enhancer for adding functionality
export type ValidatorEnhancer = (validator: ValidatorFunction) => ValidatorFunction;