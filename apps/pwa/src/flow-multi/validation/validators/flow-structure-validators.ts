import { ValidationIssue, ValidationIssueCode } from "@/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/flow-multi/validation/types/functional-validation-types";
import { generateIssueId } from "@/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/flow-multi/validation/utils/message-generator";
import { traverseFlow } from "@/flow-multi/utils/flow-traversal";

// Check if flow has valid path from start to end
export const validateFlowPath: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  // Use the existing flow traversal utility to check for valid flow
  const traversalResult = traverseFlow(context.flow);
  
  // Check if there's a valid flow path using the existing hasValidFlow property
  if (!traversalResult.hasValidFlow) {
    const message = generateValidationMessage(ValidationIssueCode.INVALID_FLOW_STRUCTURE);
    issues.push({
      id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE),
      code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
      severity: 'error',
      ...message,
    });
  }
  
  return issues;
};