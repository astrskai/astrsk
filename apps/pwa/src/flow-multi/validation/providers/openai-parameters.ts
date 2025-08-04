/**
 * OpenAI Chat Completions API Parameters
 * Documentation Date: August 2, 2025
 * Source: https://platform.openai.com/docs/api-reference/chat/create
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/flow-multi/validation/types/validation-parameter-types';

/**
 * OpenAI Parameters in Astrsk ValidationParameter format
 * Updated: August 2, 2025
 */
export const openAIParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "temperature"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "top_p"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "frequency_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "presence_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "max_tokens",
    label: "Max Tokens (Deprecated)",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Optional parameter, no default value"],
      [ValidationNoteKey.Type, "Integer type in API docs, no min specified"],
      [ValidationNoteKey.Max, "Maximum value is model-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: true,
    documentation: {
      deprecated: true,
      replacedBy: "max_completion_tokens",
      notSupportedIn: ["o-series"]
    },
  },
  {
    id: "max_completion_tokens",
    label: "Max Completion Tokens",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "max_completion_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Optional parameter, no default value"],
      [ValidationNoteKey.Type, "Integer type in API docs, no min specified"],
      [ValidationNoteKey.Max, "Maximum value is model-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "n",
    label: "Number of Completions",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "n"],
    ]),
    type: "number",
    default: 1,
    min: 1,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Max, "Maximum value is API-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Min, "No minimum limit"],
      [ValidationNoteKey.Max, "No maximum limit"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: true,
  },
  {
    id: "stop",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "stop"],
    ]),
    type: "string",
    default: null,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string | string[] | null in API"],
      [ValidationNoteKey.Default, "Defaults to null according to docs"],
      [ValidationNoteKey.AstrskSupport, "Supported in Astrsk via stop_sequence parameter"]
    ]),
    documentation: {
      notSupportedIn: ["o3", "o4-mini"]
    },
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Supported in Astrsk via agent.props.outputStreaming"]
    ]),
  },
  {
    id: "logprobs",
    label: "Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "logprobs"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "top_logprobs",
    label: "Top Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "top_logprobs"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 20,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "logit_bias",
    label: "Logit Bias",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "logit_bias"],
    ]),
    type: "logit_bias",
    default: null,
    min: -100,
    max: 100,
    step: 0.01,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Defaults to null according to docs"]
    ]),
  },
  {
    id: "user",
    label: "User ID (Deprecated)",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "user"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    documentation: {
      deprecated: true,
      replacedBy: "safety_identifier and prompt_cache_key"
    },
  },
  {
    id: "parallel_tool_calls",
    label: "Parallel Tool Calls",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "parallel_tool_calls"],
    ]),
    type: "boolean",
    default: true,
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "store",
    label: "Store Output",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "store"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  // Parameters specific to o-series models
  {
    id: "reasoning_effort",
    label: "Reasoning Effort",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "reasoning_effort"],
    ]),
    type: "string",
    default: "medium",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'low', 'medium', or 'high'"]
    ]),
    documentation: {
      requiredFor: ["o-series"]
    },
  },
  // Additional parameters from documentation
  {
    id: "audio",
    label: "Audio Output Parameters",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "audio"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'voice' and 'format' properties"]
    ]),
    documentation: {
      requiredFor: ["modalities: ['audio']"]
    },
  },
  {
    id: "metadata", 
    label: "Metadata",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "metadata"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "map/object with maximum 16 key-value pairs"]
    ]),
  },
  {
    id: "modalities",
    label: "Output Modalities",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "modalities"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of strings: ['text'] or ['text', 'audio']"]
    ]),
  },
  {
    id: "prediction",
    label: "Predicted Output",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "prediction"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'type' and 'content' properties"]
    ]),
  },
  {
    id: "prompt_cache_key",
    label: "Prompt Cache Key",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "prompt_cache_key"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "response_format",
    label: "Response Format",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "response_format"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'type' and 'json_schema' properties"],
      [ValidationNoteKey.AstrskSupport, "Supported in Astrsk via enabledStructuredOutput and schemaFields"]
    ]),
  },
  {
    id: "safety_identifier",
    label: "Safety Identifier",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "safety_identifier"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "service_tier",
    label: "Service Tier",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "service_tier"],
    ]),
    type: "string",
    default: "auto",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'auto', 'default', 'flex', or 'priority'"]
    ]),
  },
  {
    id: "stream_options",
    label: "Stream Options",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "stream_options"],
    ]),
    type: "string",
    default: null,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'include_usage' property"],
      [ValidationNoteKey.Default, "Defaults to null according to docs"]
    ]),
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "tool_choice"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'none', 'auto', 'required', or tool-specific object"]
    ]),
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "tools"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool objects"]
    ]),
  },
  {
    id: "web_search_options",
    label: "Web Search Options",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "web_search_options"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object in API"]
    ]),
  },
  // Deprecated parameters
  {
    id: "function_call",
    label: "Function Call (Deprecated)",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "function_call"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string or object in API"]
    ]),
    documentation: {
      deprecated: true,
      replacedBy: "tool_choice"
    },
  },
  {
    id: "functions",
    label: "Functions (Deprecated)",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "functions"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array in API"]
    ]),
    documentation: {
      deprecated: true,
      replacedBy: "tools"
    },
  },
];

/**
 * Compare OpenAI parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareOpenAIParameterDefinitions(): Record<string, {
  openAI: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    openAI: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of OpenAI parameters by their API name
  const openAIParamsByName = new Map<string, ValidationParameter>();
  openAIParameterList.forEach(param => {
    const openAIName = param.nameByApiSource.get(ApiSource.OpenAI);
    if (openAIName) {
      openAIParamsByName.set(openAIName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching OpenAI parameter
    let openAIParam: ValidationParameter | undefined;
    if (astrskId === 'freq_pen') {
      openAIParam = openAIParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      openAIParam = openAIParamsByName.get('presence_penalty');
    } else if (astrskId === 'stop_sequence') {
      openAIParam = openAIParamsByName.get('stop');
    } else {
      openAIParam = openAIParamsByName.get(astrskId);
    }
    
    if (openAIParam) {
      // Compare properties
      if (openAIParam.type !== astrskParam.type) {
        differences.push(`Type: OpenAI=${openAIParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (openAIParam.default !== astrskParam.default) {
        differences.push(`Default: OpenAI=${openAIParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (openAIParam.min !== astrskParam.min) {
        differences.push(`Min: OpenAI=${openAIParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (openAIParam.max !== astrskParam.max) {
        differences.push(`Max: OpenAI=${openAIParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (openAIParam.step !== astrskParam.step) {
        differences.push(`Step: OpenAI=${openAIParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in OpenAI API');
    }
    
    results[astrskId] = {
      openAI: openAIParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check OpenAI parameters not in Astrsk
  openAIParameterList.forEach(openAIParam => {
    const openAIName = openAIParam.nameByApiSource.get(ApiSource.OpenAI);
    if (openAIName && !results[openAIParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (openAIName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (openAIName === 'presence_penalty' && results['presence_pen']) found = true;
      else if (openAIName === 'stop' && results['stop_sequence']) found = true;
      
      if (!found) {
        results[openAIParam.id] = {
          openAI: openAIParam,
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
  console.log('OpenAI vs Astrsk Parameter Comparison:');
  console.log('=====================================\n');
  
  const comparisons = compareOpenAIParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both OpenAI and Astrsk:');
  console.log('------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.openAI && comparison.astrsk) {
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
    if (!comparison.openAI && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in OpenAI
  console.log('\n\nParameters only in OpenAI:');
  console.log('-------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.openAI && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.openAI.label}`);
    }
  });
}