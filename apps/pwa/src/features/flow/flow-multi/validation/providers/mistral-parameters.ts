/**
 * Mistral Chat Completion API Parameters
 * Documentation Date: January 2025
 * Source: Mistral AI API Documentation
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/flow-multi/validation/types/validation-parameter-types';

/**
 * Mistral Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const mistralParameterList: ValidationParameter[] = [
  {
    id: "model",
    label: "Model",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "model"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.AstrskSupport, "Use List Available Models API to see available models"]
    ]),
  },
  {
    id: "messages",
    label: "Messages",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "messages"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.ActualType, "array of message objects with role and content"]
    ]),
  },
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "temperature"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Varies by model - call /models endpoint for value"],
      [ValidationNoteKey.AstrskSupport, "Recommended between 0.0 and 0.7"],
      [ValidationNoteKey.ActualType, "number or null"]
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "top_p"],
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
      [ValidationNoteKey.AstrskSupport, "Recommend altering this or temperature but not both"]
    ]),
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "integer or null"],
      [ValidationNoteKey.Max, "Prompt + max_tokens cannot exceed model's context length"]
    ]),
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "false"],
      [ValidationNoteKey.AstrskSupport, "SSE stream terminated by data: [DONE] message"]
    ]),
  },
  {
    id: "stop",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "stop"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string or array of strings"]
    ]),
  },
  {
    id: "random_seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "random_seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "integer or null"],
      [ValidationNoteKey.AstrskSupport, "For deterministic results"]
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "presence_penalty"],
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
      [ValidationNoteKey.AstrskSupport, "Encourages wider variety of words and phrases"]
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "frequency_penalty"],
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
      [ValidationNoteKey.AstrskSupport, "Penalizes repetition based on frequency in generated text"]
    ]),
  },
  {
    id: "n",
    label: "Number of Completions",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "n"],
    ]),
    type: "number",
    default: 1,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "integer or null"],
      [ValidationNoteKey.AstrskSupport, "Input tokens only billed once"]
    ]),
  },
  {
    id: "response_format",
    label: "Response Format",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "response_format"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object"]
    ]),
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "tools"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool objects or null"]
    ]),
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "tool_choice"],
    ]),
    type: "string",
    default: "auto",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "auto"],
      [ValidationNoteKey.ActualType, "object or string enum"]
    ]),
  },
  {
    id: "prediction",
    label: "Prediction",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "prediction"],
    ]),
    type: "string",
    default: '{"type":"content","content":""}',
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object"],
      [ValidationNoteKey.Default, '{"type":"content","content":""}'],
      [ValidationNoteKey.AstrskSupport, "For optimizing response times with predictable content"]
    ]),
  },
  {
    id: "parallel_tool_calls",
    label: "Parallel Tool Calls",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "parallel_tool_calls"],
    ]),
    type: "boolean",
    default: true,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "true"]
    ]),
  },
  {
    id: "prompt_mode",
    label: "Prompt Mode",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "prompt_mode"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string or null"],
      [ValidationNoteKey.AstrskSupport, "Toggle between reasoning mode and no system prompt"]
    ]),
  },
  {
    id: "safe_prompt",
    label: "Safe Prompt",
    nameByApiSource: new Map([
      [ApiSource.Mistral, "safe_prompt"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "false"],
      [ValidationNoteKey.AstrskSupport, "Injects safety prompt before all conversations"]
    ]),
  },
];

/**
 * Compare Mistral parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareMistralParameterDefinitions(): Record<string, {
  mistral: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    mistral: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Mistral parameters by their API name
  const mistralParamsByName = new Map<string, ValidationParameter>();
  mistralParameterList.forEach(param => {
    const mistralName = param.nameByApiSource.get(ApiSource.Mistral);
    if (mistralName) {
      mistralParamsByName.set(mistralName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Mistral parameter
    let mistralParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      mistralParam = mistralParamsByName.get('stop');
    } else if (astrskId === 'freq_pen') {
      mistralParam = mistralParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      mistralParam = mistralParamsByName.get('presence_penalty');
    } else if (astrskId === 'seed') {
      mistralParam = mistralParamsByName.get('random_seed');
    } else {
      mistralParam = mistralParamsByName.get(astrskId);
    }
    
    if (mistralParam) {
      // Compare properties
      if (mistralParam.type !== astrskParam.type) {
        differences.push(`Type: Mistral=${mistralParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (mistralParam.default !== astrskParam.default) {
        differences.push(`Default: Mistral=${mistralParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (mistralParam.min !== astrskParam.min) {
        differences.push(`Min: Mistral=${mistralParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (mistralParam.max !== astrskParam.max) {
        differences.push(`Max: Mistral=${mistralParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (mistralParam.step !== astrskParam.step) {
        differences.push(`Step: Mistral=${mistralParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Mistral API');
    }
    
    results[astrskId] = {
      mistral: mistralParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Mistral parameters not in Astrsk
  mistralParameterList.forEach(mistralParam => {
    const mistralName = mistralParam.nameByApiSource.get(ApiSource.Mistral);
    if (mistralName && !results[mistralParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (mistralName === 'stop' && results['stop_sequence']) found = true;
      else if (mistralName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (mistralName === 'presence_penalty' && results['presence_pen']) found = true;
      else if (mistralName === 'random_seed' && results['seed']) found = true;
      
      if (!found) {
        results[mistralParam.id] = {
          mistral: mistralParam,
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
  console.log('Mistral vs Astrsk Parameter Comparison:');
  console.log('=======================================\n');
  
  const comparisons = compareMistralParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both Mistral and Astrsk:');
  console.log('-------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.mistral && comparison.astrsk) {
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
    if (!comparison.mistral && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in Mistral
  console.log('\n\nParameters only in Mistral:');
  console.log('--------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.mistral && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.mistral.label}`);
    }
  });
}
