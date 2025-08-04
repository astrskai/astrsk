/**
 * Astrsk AI Parameters
 * Since Astrsk uses Vertex AI, we import and re-export Vertex AI parameters
 * Updated: January 2025
 */

import { vertexAIParameterList } from './vertex-ai-parameters';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter } from '@/flow-multi/validation/types/validation-parameter-types';

/**
 * Astrsk Parameters - Re-exported from Vertex AI with updated API source mapping
 */
export const astrskParameterList: ValidationParameter[] = vertexAIParameterList.map(param => ({
  ...param,
  // Update the nameByApiSource to use AstrskAi instead of GoogleGenerativeAI
  nameByApiSource: new Map([
    [ApiSource.AstrskAi, param.nameByApiSource.get(ApiSource.GoogleGenerativeAI) || param.id],
  ]),
}));

/**
 * Export the same comparison function for consistency
 */
export { compareVertexAIParameterDefinitions as compareAstrskParameterDefinitions } from './vertex-ai-parameters';
