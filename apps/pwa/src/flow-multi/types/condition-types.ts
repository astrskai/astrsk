// Data types for conditions
export type ConditionDataType = 'string' | 'number' | 'integer' | 'boolean';

// String operators
export type StringOperator = 
  | 'string_exists'
  | 'string_not_exists'
  | 'string_is_empty'
  | 'string_is_not_empty'
  | 'string_equals'
  | 'string_not_equals'
  | 'string_contains'
  | 'string_not_contains'
  | 'string_starts_with'
  | 'string_not_starts_with'
  | 'string_ends_with'
  | 'string_not_ends_with'
  | 'string_matches_regex'
  | 'string_not_matches_regex';

// Number operators
export type NumberOperator = 
  | 'number_exists'
  | 'number_not_exists'
  | 'number_is_empty'
  | 'number_is_not_empty'
  | 'number_equals'
  | 'number_not_equals'
  | 'number_greater_than'
  | 'number_less_than'
  | 'number_greater_than_or_equals'
  | 'number_less_than_or_equals';

// Integer operators (explicitly defined)
export type IntegerOperator = 
  | 'integer_exists'
  | 'integer_not_exists'
  | 'integer_is_empty'
  | 'integer_is_not_empty'
  | 'integer_equals'
  | 'integer_not_equals'
  | 'integer_greater_than'
  | 'integer_less_than'
  | 'integer_greater_than_or_equals'
  | 'integer_less_than_or_equals';

// Boolean operators
export type BooleanOperator = 
  | 'boolean_exists'
  | 'boolean_not_exists'
  | 'boolean_is_empty'
  | 'boolean_is_not_empty'
  | 'boolean_is_true'
  | 'boolean_is_false'
  | 'boolean_equals'
  | 'boolean_not_equals';

// Union of all operators
export type ConditionOperator = StringOperator | NumberOperator | IntegerOperator | BooleanOperator;

// Operators that don't require a second value
export const UNARY_OPERATORS: ConditionOperator[] = [
  'string_exists',
  'string_not_exists',
  'string_is_empty',
  'string_is_not_empty',
  'number_exists',
  'number_not_exists',
  'number_is_empty',
  'number_is_not_empty',
  'integer_exists',
  'integer_not_exists',
  'integer_is_empty',
  'integer_is_not_empty',
  'boolean_exists',
  'boolean_not_exists',
  'boolean_is_empty',
  'boolean_is_not_empty',
  'boolean_is_true',
  'boolean_is_false'
];

// Updated condition interface
export interface Condition {
  id: string;
  dataType: ConditionDataType;
  value1: string;
  operator: ConditionOperator;
  value2: string;
}

// Operator configurations
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  // String operators
  'string_exists': 'exists',
  'string_not_exists': 'does not exist',
  'string_is_empty': 'is empty',
  'string_is_not_empty': 'is not empty',
  'string_equals': 'is equal to',
  'string_not_equals': 'is not equal to',
  'string_contains': 'contains',
  'string_not_contains': 'does not contain',
  'string_starts_with': 'starts with',
  'string_not_starts_with': 'does not start with',
  'string_ends_with': 'ends with',
  'string_not_ends_with': 'does not end with',
  'string_matches_regex': 'matches regex',
  'string_not_matches_regex': 'does not match regex',
  
  // Number operators
  'number_exists': 'exists',
  'number_not_exists': 'does not exist',
  'number_is_empty': 'is empty',
  'number_is_not_empty': 'is not empty',
  'number_equals': 'is equal to',
  'number_not_equals': 'is not equal to',
  'number_greater_than': 'is greater than',
  'number_less_than': 'is less than',
  'number_greater_than_or_equals': 'is greater than or equal to',
  'number_less_than_or_equals': 'is less than or equal to',
  
  // Integer operators
  'integer_exists': 'exists',
  'integer_not_exists': 'does not exist',
  'integer_is_empty': 'is empty',
  'integer_is_not_empty': 'is not empty',
  'integer_equals': 'is equal to',
  'integer_not_equals': 'is not equal to',
  'integer_greater_than': 'is greater than',
  'integer_less_than': 'is less than',
  'integer_greater_than_or_equals': 'is greater than or equal to',
  'integer_less_than_or_equals': 'is less than or equal to',
  
  // Boolean operators
  'boolean_exists': 'exists',
  'boolean_not_exists': 'does not exist',
  'boolean_is_empty': 'is empty',
  'boolean_is_not_empty': 'is not empty',
  'boolean_is_true': 'is true',
  'boolean_is_false': 'is false',
  'boolean_equals': 'is equal to',
  'boolean_not_equals': 'is not equal to'
};

// Get operators for a specific data type
export function getOperatorsForDataType(dataType: ConditionDataType): ConditionOperator[] {
  switch (dataType) {
    case 'string':
      return [
        'string_exists',
        'string_not_exists',
        'string_is_empty',
        'string_is_not_empty',
        'string_equals',
        'string_not_equals',
        'string_contains',
        'string_not_contains',
        'string_starts_with',
        'string_not_starts_with',
        'string_ends_with',
        'string_not_ends_with',
        'string_matches_regex',
        'string_not_matches_regex'
      ];
    case 'number':
      return [
        'number_exists',
        'number_not_exists',
        'number_is_empty',
        'number_is_not_empty',
        'number_equals',
        'number_not_equals',
        'number_greater_than',
        'number_less_than',
        'number_greater_than_or_equals',
        'number_less_than_or_equals'
      ];
    case 'integer':
      return [
        'integer_exists',
        'integer_not_exists',
        'integer_is_empty',
        'integer_is_not_empty',
        'integer_equals',
        'integer_not_equals',
        'integer_greater_than',
        'integer_less_than',
        'integer_greater_than_or_equals',
        'integer_less_than_or_equals'
      ];
    case 'boolean':
      return [
        'boolean_exists',
        'boolean_not_exists',
        'boolean_is_empty',
        'boolean_is_not_empty',
        'boolean_is_true',
        'boolean_is_false',
        'boolean_equals',
        'boolean_not_equals'
      ];
  }
}

// Check if operator requires a second value
export function isUnaryOperator(operator: ConditionOperator): boolean {
  return UNARY_OPERATORS.includes(operator);
}

// Get default operator for a data type
export function getDefaultOperatorForDataType(dataType: ConditionDataType): ConditionOperator {
  switch (dataType) {
    case 'string':
      return 'string_equals';
    case 'number':
      return 'number_equals';
    case 'integer':
      return 'integer_equals';
    case 'boolean':
      return 'boolean_is_true';
  }
}

// Validate if an operator is valid for a data type
export function isValidOperatorForDataType(operator: ConditionOperator, dataType: ConditionDataType): boolean {
  const validOperators = getOperatorsForDataType(dataType);
  return validOperators.includes(operator);
}