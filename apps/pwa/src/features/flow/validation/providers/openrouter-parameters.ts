/**
 * OpenRouter API Parameters
 * Documentation Date: January 2025
 * Source: OpenRouter API Documentation
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/validation/types/validation-parameter-types';

/**
 * OpenRouter Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const openRouterParameterList: ValidationParameter[] = [
  {
    id: "model",
    label: "Model",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "model"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.AstrskSupport, "Model ID to use, defaults to user's default if unspecified"]
    ]),
  },
  {
    id: "messages",
    label: "Messages",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "messages"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.ActualType, "array of message objects"],
      [ValidationNoteKey.ActualValues, "roles: system, developer, user, assistant, tool"]
    ]),
  },
  {
    id: "models",
    label: "Models List",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "models"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of strings"],
      [ValidationNoteKey.AstrskSupport, "Alternate list of models for routing overrides"]
    ]),
  },
  {
    id: "provider",
    label: "Provider Preferences",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "provider"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'sort' property"],
      [ValidationNoteKey.AstrskSupport, "Sort preference (e.g., price, throughput)"]
    ]),
  },
  {
    id: "reasoning",
    label: "Reasoning Configuration",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "reasoning"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with effort, max_tokens, exclude properties"],
      [ValidationNoteKey.ActualValues, "effort: high, medium, low"],
      [ValidationNoteKey.AstrskSupport, "Configuration for model reasoning/thinking tokens"]
    ]),
  },
  {
    id: "usage",
    label: "Usage Information",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "usage"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'include' boolean property"]
    ]),
  },
  {
    id: "transforms",
    label: "Prompt Transforms",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "transforms"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of strings"],
      [ValidationNoteKey.AstrskSupport, "OpenRouter-only prompt transforms"]
    ]),
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "false"]
    ]),
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "context_length"]
    ]),
  },
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "temperature"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "2"]
    ]),
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: true,
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "top_p"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "0 (exclusive)"],
      [ValidationNoteKey.Max, "1"]
    ]),
  },
  {
    id: "top_k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "top_k"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "Infinity"]
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "frequency_penalty"],
    ]),
    type: "number",
    default: undefined,
    min: -2,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "-2"],
      [ValidationNoteKey.Max, "2"]
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "presence_penalty"],
    ]),
    type: "number",
    default: undefined,
    min: -2,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "-2"],
      [ValidationNoteKey.Max, "2"]
    ]),
  },
  {
    id: "repetition_penalty",
    label: "Repetition Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "repetition_penalty"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "0 (exclusive)"],
      [ValidationNoteKey.Max, "2"]
    ]),
  },
  {
    id: "logit_bias",
    label: "Logit Bias",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "logit_bias"],
    ]),
    type: "logit_bias",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "map from strings to doubles"]
    ]),
  },
  {
    id: "top_logprobs",
    label: "Top Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "top_logprobs"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "min_p",
    label: "Min P",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "min_p"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 1,
    step: 0.001,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "1"]
    ]),
  },
  {
    id: "top_a",
    label: "Top A",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "top_a"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "1"]
    ]),
  },
  {
    id: "user",
    label: "User ID",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "user"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Stable identifier for end-users to detect/prevent abuse"]
    ]),
  },
];

/**
 * Compare OpenRouter parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareOpenRouterParameterDefinitions(): Record<string, {
  openRouter: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    openRouter: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of OpenRouter parameters by their API name
  const openRouterParamsByName = new Map<string, ValidationParameter>();
  openRouterParameterList.forEach(param => {
    const openRouterName = param.nameByApiSource.get(ApiSource.OpenRouter);
    if (openRouterName) {
      openRouterParamsByName.set(openRouterName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching OpenRouter parameter
    let openRouterParam: ValidationParameter | undefined;
    if (astrskId === 'freq_pen') {
      openRouterParam = openRouterParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      openRouterParam = openRouterParamsByName.get('presence_penalty');
    } else if (astrskId === 'rep_pen') {
      openRouterParam = openRouterParamsByName.get('repetition_penalty');
    } else {
      openRouterParam = openRouterParamsByName.get(astrskId);
    }
    
    if (openRouterParam) {
      // Compare properties
      if (openRouterParam.type !== astrskParam.type) {
        differences.push(`Type: OpenRouter=${openRouterParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (openRouterParam.default !== astrskParam.default) {
        differences.push(`Default: OpenRouter=${openRouterParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (openRouterParam.min !== astrskParam.min) {
        differences.push(`Min: OpenRouter=${openRouterParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (openRouterParam.max !== astrskParam.max) {
        differences.push(`Max: OpenRouter=${openRouterParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (openRouterParam.step !== astrskParam.step) {
        differences.push(`Step: OpenRouter=${openRouterParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in OpenRouter API');
    }
    
    results[astrskId] = {
      openRouter: openRouterParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check OpenRouter parameters not in Astrsk
  openRouterParameterList.forEach(openRouterParam => {
    const openRouterName = openRouterParam.nameByApiSource.get(ApiSource.OpenRouter);
    if (openRouterName && !results[openRouterParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (openRouterName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (openRouterName === 'presence_penalty' && results['presence_pen']) found = true;
      else if (openRouterName === 'repetition_penalty' && results['rep_pen']) found = true;
      
      if (!found) {
        results[openRouterParam.id] = {
          openRouter: openRouterParam,
          astrsk: undefined,
          differences: ['Not supported in Astrsk']
        };
      }
    }
  });
  
  return results;
}

// Run this file with Node.js to see the comparison results
if (typeof process !== 'undefined' && process.argv[1] === __filename) {
  console.log('OpenRouter vs Astrsk Parameter Comparison:');
  console.log('==========================================\n');
  
  const comparisons = compareOpenRouterParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both OpenRouter and Astrsk:');
  console.log('----------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.openRouter && comparison.astrsk) {
      console.log(`\n${id}:`);
      console.log(`  Label: ${comparison.astrsk.label}`);
      if (comparison.differences.length === 0) {
        console.log(`  ✓ All properties match`);
      } else {
        console.log(`  ✗ Differences:`);
        comparison.differences.forEach(diff => console.log(`    - ${diff}`));
      }
    }
  });
  
  // Show parameters only in Astrsk
  console.log('\n\nParameters only in Astrsk:');
  console.log('-------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (!comparison.openRouter && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in OpenRouter
  console.log('\n\nParameters only in OpenRouter:');
  console.log('-----------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.openRouter && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.openRouter.label}`);
    }
  });
}
