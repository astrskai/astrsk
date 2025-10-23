/**
 * KoboldCPP API Parameters
 * Documentation Date: January 2025
 * Sources: 
 * - https://github.com/LostRuins/koboldcpp/wiki
 * - https://lite.koboldai.net/koboldcpp_api#/v1/post_v1_chat_completions
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/flow-multi/validation/types/validation-parameter-types';

/**
 * KoboldCPP Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const koboldCppParameterList: ValidationParameter[] = [
  {
    id: "prompt",
    label: "Prompt",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "prompt"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field"],
      [ValidationNoteKey.AstrskSupport, "The prompt text to generate from"]
    ]),
  },
  {
    id: "max_context_length",
    label: "Max Context Length",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "max_context_length"],
    ]),
    type: "number",
    default: 2048,
    min: 512,
    max: 32768,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "2048"],
      [ValidationNoteKey.AstrskSupport, "Maximum number of tokens in context"]
    ]),
  },
  {
    id: "max_length",
    label: "Max Length",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "max_length"],
    ]),
    type: "number",
    default: 100,
    min: 1,
    max: 2048,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "100"],
      [ValidationNoteKey.AstrskSupport, "Maximum number of tokens to generate"]
    ]),
  },
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "temperature"],
    ]),
    type: "number", 
    default: 0.7,
    min: 0.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0.7"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "2.0"],
      [ValidationNoteKey.AstrskSupport, "Controls randomness - lower values are more logical, higher values are more creative"]
    ]),
  },
  {
    id: "top_k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "top_k"],
    ]),
    type: "number",
    default: 100,
    min: 0,
    max: 1000,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "100"],
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "1000"],
      [ValidationNoteKey.AstrskSupport, "Limits to top K most likely tokens - set to 0 to disable"]
    ]),
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "top_p"],
    ]),
    type: "number",
    default: 0.92,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0.92"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Nucleus sampling - set to 1 to disable"]
    ]),
  },
  {
    id: "top_a",
    label: "Top A",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "top_a"],
    ]),
    type: "number",
    default: 0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Alternative to Top-P - set to 0 to disable"]
    ]),
  },
  {
    id: "typical",
    label: "Typical",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "typical"],
    ]),
    type: "number",
    default: 1,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Typical sampling - set to 1 to disable"]
    ]),
  },
  {
    id: "tfs",
    label: "TFS (Tail Free Sampling)",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "tfs"],
    ]),
    type: "number",
    default: 1,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Alternative to Top-P using second order derivatives"]
    ]),
  },
  {
    id: "rep_pen",
    label: "Repetition Penalty",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "rep_pen"],
    ]),
    type: "number",
    default: 1.1,
    min: 1.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1.1"],
      [ValidationNoteKey.Min, "1.0"],
      [ValidationNoteKey.Max, "2.0"],
      [ValidationNoteKey.AstrskSupport, "Penalty for repeating tokens"]
    ]),
  },
  {
    id: "rep_pen_range",
    label: "Repetition Penalty Range",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "rep_pen_range"],
    ]),
    type: "number",
    default: 256,
    min: 0,
    max: 2048,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "256"],
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "2048"],
      [ValidationNoteKey.AstrskSupport, "Number of tokens to apply repetition penalty to"]
    ]),
  },
  {
    id: "rep_pen_slope",
    label: "Repetition Penalty Slope",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "rep_pen_slope"],
    ]),
    type: "number",
    default: 1,
    min: 0.0,
    max: 10.0,
    step: 0.1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "1"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "10.0"],
      [ValidationNoteKey.AstrskSupport, "How the penalty degrades over distance"]
    ]),
  },
  {
    id: "mirostat",
    label: "Mirostat",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "mirostat"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "2"],
      [ValidationNoteKey.AstrskSupport, "Alternative sampling method (0=disabled, 1=v1, 2=v2)"]
    ]),
  },
  {
    id: "mirostat_tau",
    label: "Mirostat Tau",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "mirostat_tau"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "Not specified in documentation - typically 5.0"],
      [ValidationNoteKey.Min, "Not specified in documentation"],
      [ValidationNoteKey.Max, "Not specified in documentation"],
      [ValidationNoteKey.AstrskSupport, "Target entropy for Mirostat"]
    ]),
  },
  {
    id: "mirostat_eta",
    label: "Mirostat Eta",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "mirostat_eta"],
    ]),
    type: "number",
    default: undefined,
    min: undefined,
    max: undefined,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0.1"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Learning rate for Mirostat"]
    ]),
  },
  {
    id: "min_p",
    label: "Min P",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "min_p"],
    ]),
    type: "number",
    default: 0,
    min: 0.0,
    max: 1.0,
    step: 0.001,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Experimental alternative to Top-P - set to 0 to disable"]
    ]),
  },
  {
    id: "dynatemp",
    label: "Dynamic Temperature",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dynatemp"],
    ]),
    type: "number",
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "1.0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "2.0"],
      [ValidationNoteKey.AstrskSupport, "Base temperature for dynamic temperature sampling"]
    ]),
  },
  {
    id: "dynatemp_range",
    label: "Dynamic Temperature Range",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dynatemp_range"],
    ]),
    type: "number",
    default: 0,
    min: 0.0,
    max: 2.0,
    step: 0.01,
    parameterType: "core",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "2.0"],
      [ValidationNoteKey.AstrskSupport, "Temperature varies between dynatemp ± range - set to 0 to disable"]
    ]),
  },
  {
    id: "dry_multiplier",
    label: "DRY Multiplier",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_multiplier"],
    ]),
    type: "number",
    default: 0,
    min: 0.0,
    max: 5.0,
    step: 0.1,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "5.0"],
      [ValidationNoteKey.AstrskSupport, "DRY penalty multiplier - set to 0 to disable"]
    ]),
  },
  {
    id: "dry_base",
    label: "DRY Base",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_base"],
    ]),
    type: "number",
    default: 1.75,
    min: 1.0,
    max: 10.0,
    step: 0.01,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "1.75"],
      [ValidationNoteKey.Min, "1.0"],
      [ValidationNoteKey.Max, "10.0"],
      [ValidationNoteKey.AstrskSupport, "DRY penalty base value"]
    ]),
  },
  {
    id: "dry_allowed_length",
    label: "DRY Allowed Length",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_allowed_length"],
    ]),
    type: "number",
    default: 2,
    min: 1,
    max: 100,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "2"],
      [ValidationNoteKey.Min, "1"],
      [ValidationNoteKey.Max, "100"],
      [ValidationNoteKey.AstrskSupport, "Minimum length before DRY penalty applies"]
    ]),
  },
  {
    id: "dry_penalty_last_n",
    label: "DRY Penalty Last N",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_penalty_last_n"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 2048,
    step: 1,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0"],
      [ValidationNoteKey.Max, "2048"],
      [ValidationNoteKey.AstrskSupport, "Number of tokens to check for DRY penalty"]
    ]),
  },
  {
    id: "dry_sequence_breakers",
    label: "DRY Sequence Breakers",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_sequence_breakers"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of strings"],
      [ValidationNoteKey.AstrskSupport, "Tokens that reset DRY penalty"]
    ]),
  },
  {
    id: "xtc_threshold",
    label: "XTC Threshold",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "xtc_threshold"],
    ]),
    type: "number",
    default: 0.15,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0.15"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Exclude Top Choices threshold"]
    ]),
  },
  {
    id: "xtc_probability",
    label: "XTC Probability",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "xtc_probability"],
    ]),
    type: "number",
    default: 0,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "0"],
      [ValidationNoteKey.Min, "0.0"],
      [ValidationNoteKey.Max, "1.0"],
      [ValidationNoteKey.AstrskSupport, "Probability of applying XTC - set above 0 to enable (recommended 0.5)"]
    ]),
  },
  {
    id: "sampler_order",
    label: "Sampler Order",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "sampler_order"],
    ]),
    type: "string",
    default: "[6,0,1,3,4,2,5]",
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "[6,0,1,3,4,2,5]"],
      [ValidationNoteKey.ActualType, "array of integers"],
      [ValidationNoteKey.AstrskSupport, "Order in which samplers are applied"]
    ]),
  },
  {
    id: "quiet",
    label: "Quiet Mode",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "quiet"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "provider",
    supportedInAstrsk: false,
    notes: new Map([
      [ValidationNoteKey.Default, "false"],
      [ValidationNoteKey.AstrskSupport, "Suppress verbose output"]
    ]),
  },
];

/**
 * Compare KoboldCPP parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareKoboldCppParameterDefinitions(): Record<string, {
  koboldCpp: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    koboldCpp: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of KoboldCPP parameters by their API name
  const koboldCppParamsByName = new Map<string, ValidationParameter>();
  koboldCppParameterList.forEach(param => {
    const koboldCppName = param.nameByApiSource.get(ApiSource.KoboldCPP);
    if (koboldCppName) {
      koboldCppParamsByName.set(koboldCppName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching KoboldCPP parameter
    let koboldCppParam: ValidationParameter | undefined;
    if (astrskId === 'rep_pen') {
      koboldCppParam = koboldCppParamsByName.get('rep_pen');
    } else if (astrskId === 'max_tokens') {
      koboldCppParam = koboldCppParamsByName.get('max_length');
    } else {
      koboldCppParam = koboldCppParamsByName.get(astrskId);
    }
    
    if (koboldCppParam) {
      // Compare properties
      if (koboldCppParam.type !== astrskParam.type) {
        differences.push(`Type: KoboldCPP=${koboldCppParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (koboldCppParam.default !== astrskParam.default) {
        differences.push(`Default: KoboldCPP=${koboldCppParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (koboldCppParam.min !== astrskParam.min) {
        differences.push(`Min: KoboldCPP=${koboldCppParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (koboldCppParam.max !== astrskParam.max) {
        differences.push(`Max: KoboldCPP=${koboldCppParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (koboldCppParam.step !== astrskParam.step) {
        differences.push(`Step: KoboldCPP=${koboldCppParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in KoboldCPP API');
    }
    
    results[astrskId] = {
      koboldCpp: koboldCppParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check KoboldCPP parameters not in Astrsk
  koboldCppParameterList.forEach(koboldCppParam => {
    const koboldCppName = koboldCppParam.nameByApiSource.get(ApiSource.KoboldCPP);
    if (koboldCppName && !results[koboldCppParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (koboldCppName === 'max_length' && results['max_tokens']) found = true;
      
      if (!found) {
        results[koboldCppParam.id] = {
          koboldCpp: koboldCppParam,
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
  console.log('KoboldCPP vs Astrsk Parameter Comparison:');
  console.log('=========================================\n');
  
  const comparisons = compareKoboldCppParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both KoboldCPP and Astrsk:');
  console.log('---------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.koboldCpp && comparison.astrsk) {
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
    if (!comparison.koboldCpp && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in KoboldCPP
  console.log('\n\nParameters only in KoboldCPP:');
  console.log('----------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.koboldCpp && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.koboldCpp.label}`);
    }
  });
}
