/**
 * Google Vertex AI Generative AI Parameters
 * Documentation Date: January 2025
 * Source: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/flow-multi/validation/types/validation-parameter-types';

/**
 * Vertex AI Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const vertexAIParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "temperature"],
    ]),
    type: "number",
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1.0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "2.0"],
      [ValidationNoteKey.AstrskSupport, "Temperature of 0 means highest probability tokens always selected"]
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "topP"],
    ]),
    type: "number",
    default: 0.95,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0.95 for gemini-2.0-flash-lite and gemini-2.0-flash"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Nucleus sampling - lower for less random, higher for more random"]
    ]),
  },
  {
    id: "candidate_count",
    label: "Candidate Count",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "candidateCount"],
    ]),
    type: "number",
    default: 1,
    min: 1,
    max: 8,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "8 for gemini-2.0-flash-lite and gemini-2.0-flash"],
      [ValidationNoteKey.AstrskSupport, "Preview feature - works with generateContent only, not streamGenerateContent"]
    ]),
  },
  {
    id: "max_output_tokens",
    label: "Max Output Tokens",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "maxOutputTokens"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "A token is approximately 4 characters. 100 tokens ≈ 60-80 words"]
    ]),
  },
  {
    id: "stop_sequences",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "stopSequences"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.ActualType, "List[string]"],
      [ValidationNoteKey.Max, "Maximum 5 items in the list"],
      [ValidationNoteKey.AstrskSupport, "Case-sensitive strings that stop generation"]
    ]),
  },
  {
    id: "presence_penalty",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "presencePenalty"],
    ]),
    type: "number",
    default: undefined,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "-2.0"],
      [ValidationNoteKey.Max, "Up to but not including 2.0"],
      [ValidationNoteKey.AstrskSupport, "Positive values increase diversity by penalizing already-used tokens"]
    ]),
  },
  {
    id: "frequency_penalty",
    label: "Frequency Penalty",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "frequencyPenalty"],
    ]),
    type: "number",
    default: undefined,
    min: -2.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Min, "-2.0"],
      [ValidationNoteKey.Max, "Up to but not including 2.0"],
      [ValidationNoteKey.AstrskSupport, "Positive values decrease probability of repeating content"]
    ]),
  },
  {
    id: "response_mime_type",
    label: "Response MIME Type",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "responseMimeType"],
    ]),
    type: "string",
    default: "text/plain",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "text/plain"],
      [ValidationNoteKey.ActualValues, "'application/json', 'text/plain', 'text/x.enum'"],
      [ValidationNoteKey.Required, "text/plain not supported with responseSchema"]
    ]),
  },
  {
    id: "response_schema",
    label: "Response Schema",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "responseSchema"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "schema object"],
      [ValidationNoteKey.Required, "Requires responseMimeType other than text/plain"]
    ]),
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "seed"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Best effort deterministic output - not guaranteed"],
      [ValidationNoteKey.Default, "Random seed value by default"]
    ]),
  },
  {
    id: "response_logprobs",
    label: "Response Logprobs",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "responseLogprobs"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "false"]
    ]),
  },
  {
    id: "logprobs",
    label: "Logprobs Count",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "logprobs"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: 20,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "20"],
      [ValidationNoteKey.Required, "Must enable responseLogprobs to use this parameter"]
    ]),
  },
  {
    id: "audio_timestamp",
    label: "Audio Timestamp",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "audioTimestamp"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Preview feature for Gemini 2.0 Flash-Lite and Flash"],
      [ValidationNoteKey.Required, "For audio-only files"]
    ]),
  },
];

/**
 * Compare Vertex AI parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareVertexAIParameterDefinitions(): Record<string, {
  vertexAI: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    vertexAI: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Vertex AI parameters by their API name
  const vertexAIParamsByName = new Map<string, ValidationParameter>();
  vertexAIParameterList.forEach(param => {
    const vertexAIName = param.nameByApiSource.get(ApiSource.GoogleGenerativeAI);
    if (vertexAIName) {
      vertexAIParamsByName.set(vertexAIName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Vertex AI parameter
    let vertexAIParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      vertexAIParam = vertexAIParamsByName.get('stopSequences');
    } else if (astrskId === 'freq_pen') {
      vertexAIParam = vertexAIParamsByName.get('frequencyPenalty');
    } else if (astrskId === 'presence_pen') {
      vertexAIParam = vertexAIParamsByName.get('presencePenalty');
    } else if (astrskId === 'max_tokens') {
      vertexAIParam = vertexAIParamsByName.get('maxOutputTokens');
    } else if (astrskId === 'top_p') {
      vertexAIParam = vertexAIParamsByName.get('topP');
    } else {
      vertexAIParam = vertexAIParamsByName.get(astrskId);
    }
    
    if (vertexAIParam) {
      // Compare properties
      if (vertexAIParam.type !== astrskParam.type) {
        differences.push(`Type: VertexAI=${vertexAIParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (vertexAIParam.default !== astrskParam.default) {
        differences.push(`Default: VertexAI=${vertexAIParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (vertexAIParam.min !== astrskParam.min) {
        differences.push(`Min: VertexAI=${vertexAIParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (vertexAIParam.max !== astrskParam.max) {
        differences.push(`Max: VertexAI=${vertexAIParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (vertexAIParam.step !== astrskParam.step) {
        differences.push(`Step: VertexAI=${vertexAIParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Vertex AI API');
    }
    
    results[astrskId] = {
      vertexAI: vertexAIParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Vertex AI parameters not in Astrsk
  vertexAIParameterList.forEach(vertexAIParam => {
    const vertexAIName = vertexAIParam.nameByApiSource.get(ApiSource.GoogleGenerativeAI);
    if (vertexAIName && !results[vertexAIParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (vertexAIName === 'stopSequences' && results['stop_sequence']) found = true;
      else if (vertexAIName === 'frequencyPenalty' && results['freq_pen']) found = true;
      else if (vertexAIName === 'presencePenalty' && results['presence_pen']) found = true;
      else if (vertexAIName === 'maxOutputTokens' && results['max_tokens']) found = true;
      else if (vertexAIName === 'topP' && results['top_p']) found = true;
      
      if (!found) {
        results[vertexAIParam.id] = {
          vertexAI: vertexAIParam,
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
  console.log('Vertex AI vs Astrsk Parameter Comparison:');
  console.log('=========================================\n');
  
  const comparisons = compareVertexAIParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both Vertex AI and Astrsk:');
  console.log('---------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.vertexAI && comparison.astrsk) {
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
    if (!comparison.vertexAI && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in Vertex AI
  console.log('\n\nParameters only in Vertex AI:');
  console.log('----------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.vertexAI && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.vertexAI.label}`);
    }
  });
}
