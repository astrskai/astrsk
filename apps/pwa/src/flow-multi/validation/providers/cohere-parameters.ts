/**
 * Cohere Chat API Parameters
 * Documentation Date: January 2025
 * Source: https://docs.cohere.com/reference/chat
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/flow-multi/validation/types/validation-parameter-types';

/**
 * Cohere Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const cohereParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "temperature"],
    ]),
    type: "number",
    default: 0.3,
    min: 0,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0.3"],
      [ValidationNoteKey.Min, "0 (non-negative)"]
    ]),
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Setting a low value may result in incomplete generations"]
    ]),
  },
  {
    id: "stop_sequences",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "stop_sequences"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string[] - array of up to 5 strings"],
      [ValidationNoteKey.Max, "Maximum 5 stop sequences"]
    ]),
  },
  {
    id: "k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "k"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 500,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0 (k-sampling disabled)"],
      [ValidationNoteKey.AstrskSupport, "When k is 0, k-sampling is disabled"]
    ]),
  },
  {
    id: "p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "p"],
    ]),
    type: "number",
    default: 0.75,
    min: 0.01,
    max: 0.99,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0.75"],
      [ValidationNoteKey.AstrskSupport, "If both k and p are enabled, p acts after k"]
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "frequency_penalty"],
    ]),
    type: "number",
    default: 0.0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Penalty proportional to token frequency"]
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "presence_penalty"],
    ]),
    type: "number",
    default: 0.0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Penalty applied equally to all tokens that have appeared"]
    ]),
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Best effort determinism, not totally guaranteed"]
    ]),
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.AstrskSupport, "SSE stream of events when enabled"]
    ]),
  },
  {
    id: "model",
    label: "Model",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "model"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.AstrskSupport, "Compatible Cohere model name or fine-tuned model ID"]
    ]),
  },
  {
    id: "messages",
    label: "Messages",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "messages"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.ActualType, "array of message objects"],
      [ValidationNoteKey.AstrskSupport, "User, Assistant, Tool and System roles supported"]
    ]),
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "tools"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool (function) objects"]
    ]),
  },
  {
    id: "documents",
    label: "Documents",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "documents"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of strings or document objects"]
    ]),
  },
  {
    id: "citation_options",
    label: "Citation Options",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "citation_options"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object for controlling citation generation"]
    ]),
  },
  {
    id: "response_format",
    label: "Response Format",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "response_format"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'type' and optional 'json_schema'"],
      [ValidationNoteKey.AstrskSupport, "Supported on Command R, Command R+ and newer models"],
      [ValidationNoteKey.Max, "Up to 5 layers of nesting when json_schema not specified"],
      [ValidationNoteKey.Required, "Not supported with documents or tools parameters"]
    ]),
  },
  {
    id: "safety_mode",
    label: "Safety Mode",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "safety_mode"],
    ]),
    type: "string",
    default: "CONTEXTUAL",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'CONTEXTUAL', 'STRICT', 'OFF'"],
      [ValidationNoteKey.Default, "CONTEXTUAL"],
      [ValidationNoteKey.AstrskSupport, "Not configurable with tools and documents"],
      [ValidationNoteKey.Required, "Only compatible with Command R 08-2024 and newer"]
    ]),
  },
  {
    id: "logprobs",
    label: "Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "logprobs"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "tool_choice"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'REQUIRED', 'NONE'"],
      [ValidationNoteKey.AstrskSupport, "Only compatible with Command-r7b and newer"],
      [ValidationNoteKey.Required, "When REQUIRED, tools parameter must be passed"]
    ]),
  },
  {
    id: "strict_tools",
    label: "Strict Tools",
    nameByApiSource: new Map([
      [ApiSource.Cohere, "strict_tools"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Beta feature - forces tool calls to follow definition strictly"],
      [ValidationNoteKey.Required, "First few requests with new tools take longer"]
    ]),
  },
];

/**
 * Compare Cohere parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareCohereParameterDefinitions(): Record<string, {
  cohere: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    cohere: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Cohere parameters by their API name
  const cohereParamsByName = new Map<string, ValidationParameter>();
  cohereParameterList.forEach(param => {
    const cohereName = param.nameByApiSource.get(ApiSource.Cohere);
    if (cohereName) {
      cohereParamsByName.set(cohereName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Cohere parameter
    let cohereParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      cohereParam = cohereParamsByName.get('stop_sequences');
    } else if (astrskId === 'freq_pen') {
      cohereParam = cohereParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      cohereParam = cohereParamsByName.get('presence_penalty');
    } else if (astrskId === 'top_k') {
      cohereParam = cohereParamsByName.get('k');
    } else if (astrskId === 'top_p') {
      cohereParam = cohereParamsByName.get('p');
    } else {
      cohereParam = cohereParamsByName.get(astrskId);
    }
    
    if (cohereParam) {
      // Compare properties
      if (cohereParam.type !== astrskParam.type) {
        differences.push(`Type: Cohere=${cohereParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (cohereParam.default !== astrskParam.default) {
        differences.push(`Default: Cohere=${cohereParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (cohereParam.min !== astrskParam.min) {
        differences.push(`Min: Cohere=${cohereParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (cohereParam.max !== astrskParam.max) {
        differences.push(`Max: Cohere=${cohereParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (cohereParam.step !== astrskParam.step) {
        differences.push(`Step: Cohere=${cohereParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Cohere API');
    }
    
    results[astrskId] = {
      cohere: cohereParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Cohere parameters not in Astrsk
  cohereParameterList.forEach(cohereParam => {
    const cohereName = cohereParam.nameByApiSource.get(ApiSource.Cohere);
    if (cohereName && !results[cohereParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (cohereName === 'stop_sequences' && results['stop_sequence']) found = true;
      else if (cohereName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (cohereName === 'presence_penalty' && results['presence_pen']) found = true;
      else if (cohereName === 'k' && results['top_k']) found = true;
      else if (cohereName === 'p' && results['top_p']) found = true;
      
      if (!found) {
        results[cohereParam.id] = {
          cohere: cohereParam,
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
  console.log('Cohere vs Astrsk Parameter Comparison:');
  console.log('======================================\n');
  
  const comparisons = compareCohereParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both Cohere and Astrsk:');
  console.log('------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.cohere && comparison.astrsk) {
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
    if (!comparison.cohere && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in Cohere
  console.log('\n\nParameters only in Cohere:');
  console.log('-------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.cohere && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.cohere.label}`);
    }
  });
}
