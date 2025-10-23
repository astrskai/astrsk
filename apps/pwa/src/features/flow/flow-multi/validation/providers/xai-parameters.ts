/**
 * xAI Chat Completions API Parameters
 * Documentation Date: August 4, 2025
 * Source: https://docs.x.ai/docs/api-reference#chat-completions
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/flow-multi/validation/types/validation-parameter-types';

/**
 * xAI Parameters in Astrsk ValidationParameter format
 * Updated: August 4, 2025
 */
export const xaiParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.xAI, "temperature"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 1"],
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.xAI, "top_p"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 1"],
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.xAI, "frequency_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 0"],
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.xAI, "presence_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 0"],
    ]),
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.xAI, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Optional parameter, no default value"],
      [ValidationNoteKey.Type, "Integer type in API docs"],
      [ValidationNoteKey.Max, "Maximum value is model-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "n",
    label: "Number of Completions",
    nameByApiSource: new Map([
      [ApiSource.xAI, "n"],
    ]),
    type: "number",
    default: 1,
    min: 1,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is 1"],
      [ValidationNoteKey.Max, "Maximum value is API-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.xAI, "seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Optional parameter for deterministic output"],
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
      [ApiSource.xAI, "stop"],
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
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.xAI, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is false"],
      [ValidationNoteKey.AstrskSupport, "Supported in Astrsk via agent.props.outputStreaming"]
    ]),
  },
  {
    id: "stream_options",
    label: "Stream Options",
    nameByApiSource: new Map([
      [ApiSource.xAI, "stream_options"],
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
    id: "response_format",
    label: "Response Format",
    nameByApiSource: new Map([
      [ApiSource.xAI, "response_format"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'type' property ('text' or 'json_object')"],
      [ValidationNoteKey.AstrskSupport, "Supported in Astrsk via enabledStructuredOutput and schemaFields"]
    ]),
  },
  {
    id: "logprobs",
    label: "Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.xAI, "logprobs"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is false"]
    ]),
  },
  {
    id: "top_logprobs",
    label: "Top Log Probabilities",
    nameByApiSource: new Map([
      [ApiSource.xAI, "top_logprobs"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 20,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Required when logprobs is true"]
    ]),
  },
  {
    id: "logit_bias",
    label: "Logit Bias",
    nameByApiSource: new Map([
      [ApiSource.xAI, "logit_bias"],
    ]),
    type: "logit_bias",
    default: null,
    min: -100,
    max: 100,
    step: 0.01,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Defaults to null according to docs"],
      [ValidationNoteKey.ActualType, "map from token ID to bias value"]
    ]),
  },
  {
    id: "max_completion_tokens",
    label: "Max Completion Tokens",
    nameByApiSource: new Map([
      [ApiSource.xAI, "max_completion_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    notes: new Map([
      [ValidationNoteKey.Default, "Optional parameter, no default value"],
      [ValidationNoteKey.Type, "Integer type in API docs"],
      [ValidationNoteKey.Max, "Maximum value is model-dependent"]
    ]),
    parameterType: "core",
    supportedInAstrsk: false,
  },
  {
    id: "prediction",
    label: "Predicted Output",
    nameByApiSource: new Map([
      [ApiSource.xAI, "prediction"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'type' and 'content' properties"],
    ]),
  },
  {
    id: "reasoning_output",
    label: "Reasoning Output",
    nameByApiSource: new Map([
      [ApiSource.xAI, "reasoning_output"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is false"],
    ]),
  },
  {
    id: "search",
    label: "Web Search",
    nameByApiSource: new Map([
      [ApiSource.xAI, "search"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is false"],
    ]),
  },
  {
    id: "user",
    label: "User ID",
    nameByApiSource: new Map([
      [ApiSource.xAI, "user"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
    ]),
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.xAI, "tool_choice"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'none', 'auto', 'required', or tool-specific object"],
    ]),
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.xAI, "tools"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool objects"],
    ]),
  },
  {
    id: "parallel_tool_calls",
    label: "Parallel Tool Calls",
    nameByApiSource: new Map([
      [ApiSource.xAI, "parallel_tool_calls"],
    ]),
    type: "boolean",
    default: true,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Default is true"],
    ]),
  },
];

/**
 * Compare xAI parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareXaiParameterDefinitions(): Record<string, {
  xai: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    xai: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of xAI parameters by their API name
  const xaiParamsByName = new Map<string, ValidationParameter>();
  xaiParameterList.forEach(param => {
    const xaiName = param.nameByApiSource.get(ApiSource.xAI);
    if (xaiName) {
      xaiParamsByName.set(xaiName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching xAI parameter
    let xaiParam: ValidationParameter | undefined;
    if (astrskId === 'freq_pen') {
      xaiParam = xaiParamsByName.get('frequency_penalty');
    } else if (astrskId === 'presence_pen') {
      xaiParam = xaiParamsByName.get('presence_penalty');
    } else if (astrskId === 'stop_sequence') {
      xaiParam = xaiParamsByName.get('stop');
    } else {
      xaiParam = xaiParamsByName.get(astrskId);
    }
    
    if (xaiParam) {
      // Compare properties
      if (xaiParam.type !== astrskParam.type) {
        differences.push(`Type: xAI=${xaiParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (xaiParam.default !== astrskParam.default) {
        differences.push(`Default: xAI=${xaiParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (xaiParam.min !== astrskParam.min) {
        differences.push(`Min: xAI=${xaiParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (xaiParam.max !== astrskParam.max) {
        differences.push(`Max: xAI=${xaiParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (xaiParam.step !== astrskParam.step) {
        differences.push(`Step: xAI=${xaiParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in xAI API');
    }
    
    results[astrskId] = {
      xai: xaiParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check xAI parameters not in Astrsk
  xaiParameterList.forEach(xaiParam => {
    const xaiName = xaiParam.nameByApiSource.get(ApiSource.xAI);
    if (xaiName && !results[xaiParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (xaiName === 'frequency_penalty' && results['freq_pen']) found = true;
      else if (xaiName === 'presence_penalty' && results['presence_pen']) found = true;
      else if (xaiName === 'stop' && results['stop_sequence']) found = true;
      
      if (!found) {
        results[xaiParam.id] = {
          xai: xaiParam,
          astrsk: undefined,
          differences: ['Not supported in Astrsk']
        };
      }
    }
  });
  
  return results;
}