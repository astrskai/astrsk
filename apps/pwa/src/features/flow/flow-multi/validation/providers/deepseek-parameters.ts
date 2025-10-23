/**
 * DeepSeek Chat API Parameters
 * Documentation Date: January 2025
 * Source: https://api-docs.deepseek.com/api/create-chat-completion
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/flow-multi/validation/types/validation-parameter-types';

/**
 * DeepSeek Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const deepSeekParameterList: ValidationParameter[] = [
  {
    id: "model",
    label: "Model",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "model"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.ActualValues, "'deepseek-chat', 'deepseek-reasoner'"]
    ]),
  },
  {
    id: "messages",
    label: "Messages",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "messages"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.ActualType, "array of message objects"]
    ]),
  },
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "temperature"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Max, "2"],
      [ValidationNoteKey.AstrskSupport, "Recommend altering this or top_p but not both"]
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "top_p"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Max, "1"],
      [ValidationNoteKey.AstrskSupport, "Recommend altering this or temperature but not both"]
    ]),
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "max_tokens"],
    ]),
    type: "number",
    default: 4096,
    min: 1,
    max: 8192,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "4096 if not specified"],
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "8192"],
      [ValidationNoteKey.AstrskSupport, "Total input + output limited by model context length"]
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "frequency_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "-2.0"],
      [ValidationNoteKey.Max, "2.0"]
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "presence_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "-2.0"],
      [ValidationNoteKey.Max, "2.0"]
    ]),
  },
  {
    id: "stop",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "stop"],
    ]),
    type: "string",
    default: null,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string, array of strings, or null"],
      [ValidationNoteKey.Default, "null"]
    ]),
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "false"],
      [ValidationNoteKey.AstrskSupport, "SSE stream when enabled, terminated by data: [DONE]"]
    ]),
  },
  {
    id: "stream_options",
    label: "Stream Options",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "stream_options"],
    ]),
    type: "string",
    default: null,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object"],
      [ValidationNoteKey.Default, "null"]
    ]),
  },
  {
    id: "response_format",
    label: "Response Format",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "response_format"],
    ]),
    type: "string",
    default: null,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object"],
      [ValidationNoteKey.Default, "null"]
    ]),
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "tools"],
    ]),
    type: "string",
    default: null,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool objects"],
      [ValidationNoteKey.Default, "null"]
    ]),
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "tool_choice"],
    ]),
    type: "string",
    default: null,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string or object"],
      [ValidationNoteKey.Default, "null"]
    ]),
  },
  {
    id: "logprobs",
    label: "Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "logprobs"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "false"],
      [ValidationNoteKey.AstrskSupport, "Returns log probabilities of output tokens when true"]
    ]),
  },
  {
    id: "top_logprobs",
    label: "Top Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.DeepSeek, "top_logprobs"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 20,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Max, "20"],
      [ValidationNoteKey.Required, "logprobs must be true to use this parameter"]
    ]),
  },
];

/**
 * Compare DeepSeek parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareDeepSeekParameterDefinitions(): Record<string, {
  deepSeek: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    deepSeek: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of DeepSeek parameters by their API name
  const deepSeekParamsByName = new Map<string, ValidationParameter>();
  deepSeekParameterList.forEach(param => {
    const deepSeekName = param.nameByApiSource.get(ApiSource.DeepSeek);
    if (deepSeekName) {
      deepSeekParamsByName.set(deepSeekName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching DeepSeek parameter
    let deepSeekParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      deepSeekParam = deepSeekParamsByName.get('stop');
    } else if (astrskId === 'freq_pen') {
      deepSeekParam = deepSeekParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      deepSeekParam = deepSeekParamsByName.get('presence_penalty');
    } else {
      deepSeekParam = deepSeekParamsByName.get(astrskId);
    }
    
    if (deepSeekParam) {
      // Compare properties
      if (deepSeekParam.type !== astrskParam.type) {
        differences.push(`Type: DeepSeek=${deepSeekParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (deepSeekParam.default !== astrskParam.default) {
        differences.push(`Default: DeepSeek=${deepSeekParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (deepSeekParam.min !== astrskParam.min) {
        differences.push(`Min: DeepSeek=${deepSeekParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (deepSeekParam.max !== astrskParam.max) {
        differences.push(`Max: DeepSeek=${deepSeekParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (deepSeekParam.step !== astrskParam.step) {
        differences.push(`Step: DeepSeek=${deepSeekParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in DeepSeek API');
    }
    
    results[astrskId] = {
      deepSeek: deepSeekParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check DeepSeek parameters not in Astrsk
  deepSeekParameterList.forEach(deepSeekParam => {
    const deepSeekName = deepSeekParam.nameByApiSource.get(ApiSource.DeepSeek);
    if (deepSeekName && !results[deepSeekParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (deepSeekName === 'stop' && results['stop_sequence']) found = true;
      else if (deepSeekName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (deepSeekName === 'presence_penalty' && results['presence_pen']) found = true;
      
      if (!found) {
        results[deepSeekParam.id] = {
          deepSeek: deepSeekParam,
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
  console.log('DeepSeek vs Astrsk Parameter Comparison:');
  console.log('========================================\n');
  
  const comparisons = compareDeepSeekParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both DeepSeek and Astrsk:');
  console.log('--------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.deepSeek && comparison.astrsk) {
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
    if (!comparison.deepSeek && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in DeepSeek
  console.log('\n\nParameters only in DeepSeek:');
  console.log('---------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.deepSeek && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.deepSeek.label}`);
    }
  });
}
