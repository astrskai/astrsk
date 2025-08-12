import { ValidationIssue, ValidationIssueCode } from "@/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/flow-multi/validation/types/functional-validation-types";
import { generateIssueId } from "@/flow-multi/validation/utils/validator-utils";
import { DataStoreFieldType } from "@/flow-multi/panels/data-store-schema/data-store-schema-types";

// Validate initial values in data store schema match their field types
export const validateDataStoreSchemaInitialValues: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  if (!context.flow.props.dataStoreSchema?.fields) {
    return issues;
  }
  
  const schemaFields = context.flow.props.dataStoreSchema.fields;
  
  for (const field of schemaFields) {
    // Check for missing initial values
    if (!field.initialValue || field.initialValue === '') {
      issues.push({
        id: generateIssueId(ValidationIssueCode.DATA_STORE_MISSING_INITIAL_VALUE, `field_${field.id}`),
        code: ValidationIssueCode.DATA_STORE_MISSING_INITIAL_VALUE,
        severity: 'warning',
        title: 'Missing Initial Value in Data Store Schema',
        description: `Field "${field.name}" (${field.type}) has no initial value`,
        suggestion: `Provide an initial value for the field to avoid undefined behavior`,
        metadata: {
          fieldName: field.name,
          fieldType: field.type
        }
      });
      continue;
    }
    
    const validation = validateInitialValue(field.initialValue, field.type);
    if (!validation.isValid) {
      issues.push({
        id: generateIssueId(ValidationIssueCode.DATA_STORE_INVALID_INITIAL_VALUE, `field_${field.id}`),
        code: ValidationIssueCode.DATA_STORE_INVALID_INITIAL_VALUE,
        severity: 'warning',
        title: 'Invalid Initial Value in Data Store Schema',
        description: `Field "${field.name}" has an invalid initial value: ${validation.message}`,
        suggestion: `Update the initial value to match the ${field.type} type`,
        metadata: {
          fieldName: field.name,
          fieldType: field.type,
          currentValue: field.initialValue
        }
      });
    }
  }
  
  return issues;
};

// Helper function to validate a value against a field type
function validateInitialValue(value: string, type: DataStoreFieldType): { isValid: boolean; message: string } {
  switch (type) {
    case 'boolean':
      if (value !== 'true' && value !== 'false') {
        return { 
          isValid: false, 
          message: `Boolean value must be "true" or "false", got "${value}"` 
        };
      }
      return { isValid: true, message: '' };
      
    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { 
          isValid: false, 
          message: `"${value}" is not a valid number` 
        };
      }
      return { isValid: true, message: '' };
      
    case 'integer':
      const intValue = Number(value);
      if (isNaN(intValue)) {
        return { 
          isValid: false, 
          message: `"${value}" is not a valid integer` 
        };
      }
      if (!Number.isInteger(intValue)) {
        return { 
          isValid: false, 
          message: `"${value}" is not a whole number (has decimal part)` 
        };
      }
      return { isValid: true, message: '' };
      
    case 'string':
      return { isValid: true, message: '' }; // Any value is valid for string
      
    default:
      return { isValid: true, message: '' };
  }
}