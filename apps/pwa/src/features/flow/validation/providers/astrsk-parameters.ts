/**
 * Astrsk AI Parameters
 * Astrsk serves both OpenAI (GPT-5) and Google (Gemini) models
 * Updated: January 2025
 */

import { vertexAIParameterList } from './vertex-ai-parameters';
import { openAIParameterList } from './openai-parameters';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter } from '@/features/flow/validation/types/validation-parameter-types';

/**
 * Default Astrsk Parameters - Re-exported from Vertex AI for Gemini models
 */
const geminiParameterList: ValidationParameter[] = vertexAIParameterList.map(param => ({
  ...param,
  // Update the nameByApiSource to use AstrskAi instead of GoogleGenerativeAI
  nameByApiSource: new Map([
    [ApiSource.AstrskAi, param.nameByApiSource.get(ApiSource.GoogleGenerativeAI) || param.id],
  ]),
}));

/**
 * Get appropriate parameter list based on the model name
 * @param modelName The name of the model being used
 * @returns The appropriate validation parameters for the model
 */
export function getAstrskParameterList(modelName?: string): ValidationParameter[] {
  if (!modelName) {
    // Default to Gemini parameters if no model name provided
    return geminiParameterList;
  }
  
  // Check if it's a GPT-5 model
  if (modelName.toLowerCase().startsWith('gpt-5')) {
    // Return OpenAI parameters for GPT-5 models
    return openAIParameterList.map(param => ({
      ...param,
      // Update the nameByApiSource to use AstrskAi
      nameByApiSource: new Map([
        [ApiSource.AstrskAi, param.nameByApiSource.get(ApiSource.OpenAI) || param.id],
      ]),
    }));
  }
  
  // Default to Gemini parameters for other models
  return geminiParameterList;
}

/**
 * Default export for backward compatibility
 */
export const astrskParameterList = geminiParameterList;

/**
 * Export the same comparison function for consistency
 */
export { compareVertexAIParameterDefinitions as compareAstrskParameterDefinitions } from './vertex-ai-parameters';
