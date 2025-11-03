/**
 * Ollama API Parameters
 * Documentation Date: August 4, 2025
 * Note: Available parameters depend on the specific model file being used
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/validation/types/validation-parameter-types';

/**
 * Ollama Parameters in Astrsk ValidationParameter format
 * Updated: August 4, 2025
 * 
 * Note: Ollama's available parameters depend on the model file being used.
 * Different models may support different parameters and ranges.
 * Temperature is the most commonly supported parameter across models.
 */
export const ollamaParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.Ollama, "temperature"],
    ]),
    type: "number",
    default: 0.8,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 0.8, but varies by model"],
      [ValidationNoteKey.Min, "Minimum varies by model, typically 0"],
      [ValidationNoteKey.Max, "Maximum varies by model, typically 1 or 2"]
    ]),
  },
];

/**
 * Compare Ollama parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareOllamaParameterDefinitions(): Record<string, {
  ollama: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    ollama: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Ollama parameters by their API name
  const ollamaParamsByName = new Map<string, ValidationParameter>();
  ollamaParameterList.forEach(param => {
    const ollamaName = param.nameByApiSource.get(ApiSource.Ollama);
    if (ollamaName) {
      ollamaParamsByName.set(ollamaName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Ollama parameter
    let ollamaParam: ValidationParameter | undefined;
    ollamaParam = ollamaParamsByName.get(astrskId);
    
    if (ollamaParam) {
      // Compare properties
      if (ollamaParam.type !== astrskParam.type) {
        differences.push(`Type: Ollama=${ollamaParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (ollamaParam.default !== astrskParam.default) {
        differences.push(`Default: Ollama=${ollamaParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (ollamaParam.min !== astrskParam.min) {
        differences.push(`Min: Ollama=${ollamaParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (ollamaParam.max !== astrskParam.max) {
        differences.push(`Max: Ollama=${ollamaParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (ollamaParam.step !== astrskParam.step) {
        differences.push(`Step: Ollama=${ollamaParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Ollama API (availability depends on model file)');
    }
    
    results[astrskId] = {
      ollama: ollamaParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Ollama parameters not in Astrsk
  ollamaParameterList.forEach(ollamaParam => {
    const ollamaName = ollamaParam.nameByApiSource.get(ApiSource.Ollama);
    if (ollamaName && !results[ollamaParam.id]) {
      results[ollamaParam.id] = {
        ollama: ollamaParam,
        astrsk: undefined,
        differences: ['Not supported in Astrsk']
      };
    }
  });
  
  return results;
}