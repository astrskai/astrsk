/**
 * Google GenerativeAI (Google) API Parameters
 * Documentation Date: January 2025
 * Source: https://ai.google.dev/api/generate-content#v1beta.GenerationConfig
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/entities/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/validation/types/validation-parameter-types';

/**
 * Google Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const googleParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "temperature"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 2,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default value varies by model"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "2.0"]
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "topP"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: 1,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default value varies by model"]
    ]),
  },
  {
    id: "top_k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "topK"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "Default value varies by model"],
      [ValidationNoteKey.AstrskSupport, "Not all Google models support topK"]
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
      [ValidationNoteKey.Default, "Default value varies by model, see Model.output_token_limit"],
      [ValidationNoteKey.Max, "Maximum value is model-dependent"]
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
      [ValidationNoteKey.ActualType, "string[] - array of up to 5 sequences"],
      [ValidationNoteKey.Max, "Maximum 5 stop sequences"]
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
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Does not work for previous generation models (Google 1.0 family)"]
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
      [ValidationNoteKey.Default, "Uses randomly generated seed if not set"]
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
    min: undefined,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Binary on/off penalty, not dependent on token count"]
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
    min: undefined,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "Penalty multiplied by token count - negative values can cause repetition"]
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
      [ValidationNoteKey.ActualValues, "'text/plain', 'application/json', 'text/x.enum'"]
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
      [ValidationNoteKey.ActualType, "Schema object - subset of OpenAPI schema"],
      [ValidationNoteKey.Required, "Requires compatible responseMimeType to be set"]
    ]),
  },
  {
    id: "response_json_schema",
    label: "Response JSON Schema",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "responseJsonSchema"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "Value format - alternative to responseSchema"],
      [ValidationNoteKey.Required, "Requires responseMimeType, excludes responseSchema"]
    ]),
  },
  {
    id: "response_modalities",
    label: "Response Modalities",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "responseModalities"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of Modality enums"],
      [ValidationNoteKey.Default, "Empty list is equivalent to requesting only text"]
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
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Required, "Only valid if responseLogprobs=true"]
    ]),
  },
  {
    id: "enable_enhanced_civic_answers",
    label: "Enable Enhanced Civic Answers",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "enableEnhancedCivicAnswers"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.AstrskSupport, "May not be available for all models"]
    ]),
  },
  {
    id: "speech_config",
    label: "Speech Config",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "speechConfig"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "SpeechConfig object"]
    ]),
  },
  {
    id: "thinking_config",
    label: "Thinking Config",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "thinkingConfig"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "ThinkingConfig object"],
      [ValidationNoteKey.AstrskSupport, "Only supported by models with thinking features"]
    ]),
  },
  {
    id: "media_resolution",
    label: "Media Resolution",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "mediaResolution"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "MediaResolution enum"]
    ]),
  },
  // Safety settings is already defined in the base parameter list
  {
    id: "safety_settings",
    label: "Safety Settings",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "safetySettings"],
    ]),
    type: "safety_settings",
    default: "[]",
    parameterType: "provider",
    supportedInAstrsk: true,
    parsingFunction: (value: string) => {
      return JSON.parse(value);
    },
  },
];

/**
 * Compare Google parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareGoogleParameterDefinitions(): Record<string, {
  google: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    google: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Google parameters by their API name
  const googleParamsByName = new Map<string, ValidationParameter>();
  googleParameterList.forEach(param => {
    const googleName = param.nameByApiSource.get(ApiSource.GoogleGenerativeAI);
    if (googleName) {
      googleParamsByName.set(googleName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Google parameter
    let googleParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      googleParam = googleParamsByName.get('stopSequences');
    } else if (astrskId === 'freq_pen') {
      googleParam = googleParamsByName.get('frequencyPenalty');
    } else if (astrskId === 'presence_pen') {
      googleParam = googleParamsByName.get('presencePenalty');
    } else if (astrskId === 'max_tokens') {
      googleParam = googleParamsByName.get('maxOutputTokens');
    } else if (astrskId === 'top_p') {
      googleParam = googleParamsByName.get('topP');
    } else if (astrskId === 'top_k') {
      googleParam = googleParamsByName.get('topK');
    } else {
      googleParam = googleParamsByName.get(astrskId);
    }
    
    if (googleParam) {
      // Compare properties
      if (googleParam.type !== astrskParam.type) {
        differences.push(`Type: Google=${googleParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (googleParam.default !== astrskParam.default) {
        differences.push(`Default: Google=${googleParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (googleParam.min !== astrskParam.min) {
        differences.push(`Min: Google=${googleParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (googleParam.max !== astrskParam.max) {
        differences.push(`Max: Google=${googleParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (googleParam.step !== astrskParam.step) {
        differences.push(`Step: Google=${googleParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Google API');
    }
    
    results[astrskId] = {
      google: googleParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Google parameters not in Astrsk
  googleParameterList.forEach(googleParam => {
    const googleName = googleParam.nameByApiSource.get(ApiSource.GoogleGenerativeAI);
    if (googleName && !results[googleParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (googleName === 'stopSequences' && results['stop_sequence']) found = true;
      else if (googleName === 'frequencyPenalty' && results['freq_pen']) found = true;
      else if (googleName === 'presencePenalty' && results['presence_pen']) found = true;
      else if (googleName === 'maxOutputTokens' && results['max_tokens']) found = true;
      else if (googleName === 'topP' && results['top_p']) found = true;
      else if (googleName === 'topK' && results['top_k']) found = true;
      else if (googleName === 'safetySettings' && results['safety_settings']) found = true;
      
      if (!found) {
        results[googleParam.id] = {
          google: googleParam,
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
  console.log('Google vs Astrsk Parameter Comparison:');
  console.log('======================================\n');
  
  const comparisons = compareGoogleParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both Google and Astrsk:');
  console.log('------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.google && comparison.astrsk) {
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
    if (!comparison.google && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in Google
  console.log('\n\nParameters only in Google:');
  console.log('-------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.google && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.google.label}`);
    }
  });
}
