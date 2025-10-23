/**
 * Anthropic Messages API Parameters
 * Documentation Date: January 2025
 * Source: https://docs.anthropic.com/claude/reference/messages_post
 */

import { parameterMap, Parameter } from '@/shared/task/domain/parameter';
import { ApiSource } from '@/modules/api/domain';
import { ValidationParameter, ValidationNoteKey } from '@/features/flow/flow-multi/validation/types/validation-parameter-types';

/**
 * Anthropic Parameters in Astrsk ValidationParameter format
 * Updated: January 2025
 */
export const anthropicParameterList: ValidationParameter[] = [
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "temperature"],
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
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "top_p"],
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
    id: "top_k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "top_k"],
    ]),
    type: "number",
    default: undefined,
    min: 0,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "max_tokens",
    label: "Max Tokens",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "max_tokens"],
    ]),
    type: "number",
    default: undefined,
    min: 1,
    max: undefined,
    step: 1,
    parameterType: "core",
    supportedInAstrsk: true,
    notes: new Map([
      [ValidationNoteKey.Required, "Required field in Anthropic API"],
      [ValidationNoteKey.AiSdkDefault, "When using AI SDK, defaults to 4096 if not specified"]
    ]),
  },
  {
    id: "stop_sequences",
    label: "Stop Sequences",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "stop_sequences"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string[] in API"]
    ]),
    parameterType: "core",
    supportedInAstrsk: true, // via stop_sequence
  },
  {
    id: "stream",
    label: "Stream",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "stream"],
    ]),
    type: "boolean",
    default: false,
    parameterType: "core",
    supportedInAstrsk: true, // via agent.props.outputStreaming
  },
  {
    id: "system",
    label: "System Prompt",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "system"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "string or array of text content blocks"]
    ]),
    parameterType: "core",
    supportedInAstrsk: true,
  },
  {
    id: "metadata",
    label: "Metadata",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "metadata"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object in API"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "tools",
    label: "Tools",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "tools"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of tool objects in API"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "tool_choice",
    label: "Tool Choice",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "tool_choice"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'auto', 'any', specific tool name, or object"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  // Claude-specific extensions
  {
    id: "thinking",
    label: "Extended Thinking",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "thinking"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "object with 'enabled' and 'budget' properties"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
    documentation: {
      requiredFor: ["claude-4-opus-20250514"]
    },
  },
  {
    id: "container",
    label: "Container ID",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "container"],
    ]),
    type: "string",
    default: undefined,
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "mcp_servers",
    label: "MCP Servers",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "mcp_servers"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualType, "array of MCP server objects in API"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
  },
  {
    id: "service_tier",
    label: "Service Tier",
    nameByApiSource: new Map([
      [ApiSource.Anthropic, "service_tier"],
    ]),
    type: "string",
    default: undefined,
    notes: new Map([
      [ValidationNoteKey.ActualValues, "'auto' or 'standard_only'"]
    ]),
    parameterType: "provider",
    supportedInAstrsk: false,
  },
];

/**
 * Compare Anthropic parameter definitions with Astrsk parameters
 * Returns differences for each parameter
 */
export function compareAnthropicParameterDefinitions(): Record<string, {
  anthropic: ValidationParameter | undefined;
  astrsk: Parameter | undefined;
  differences: string[];
}> {
  const results: Record<string, {
    anthropic: ValidationParameter | undefined;
    astrsk: Parameter | undefined;
    differences: string[];
  }> = {};
  
  // Create a map of Anthropic parameters by their API name
  const anthropicParamsByName = new Map<string, ValidationParameter>();
  anthropicParameterList.forEach(param => {
    const anthropicName = param.nameByApiSource.get(ApiSource.Anthropic);
    if (anthropicName) {
      anthropicParamsByName.set(anthropicName, param);
    }
  });
  
  // Check each Astrsk parameter
  parameterMap.forEach((astrskParam, astrskId) => {
    const differences: string[] = [];
    
    // Try to find matching Anthropic parameter
    let anthropicParam: ValidationParameter | undefined;
    if (astrskId === 'stop_sequence') {
      anthropicParam = anthropicParamsByName.get('stop_sequences');
    } else {
      anthropicParam = anthropicParamsByName.get(astrskId);
    }
    
    if (anthropicParam) {
      // Compare properties
      if (anthropicParam.type !== astrskParam.type) {
        differences.push(`Type: Anthropic=${anthropicParam.type}, Astrsk=${astrskParam.type}`);
      }
      if (anthropicParam.default !== astrskParam.default) {
        differences.push(`Default: Anthropic=${anthropicParam.default}, Astrsk=${astrskParam.default}`);
      }
      if (anthropicParam.min !== astrskParam.min) {
        differences.push(`Min: Anthropic=${anthropicParam.min}, Astrsk=${astrskParam.min}`);
      }
      if (anthropicParam.max !== astrskParam.max) {
        differences.push(`Max: Anthropic=${anthropicParam.max}, Astrsk=${astrskParam.max}`);
      }
      if (anthropicParam.step !== astrskParam.step) {
        differences.push(`Step: Anthropic=${anthropicParam.step}, Astrsk=${astrskParam.step}`);
      }
    } else {
      differences.push('Not available in Anthropic API');
    }
    
    results[astrskId] = {
      anthropic: anthropicParam,
      astrsk: astrskParam,
      differences
    };
  });
  
  // Also check Anthropic parameters not in Astrsk
  anthropicParameterList.forEach(anthropicParam => {
    const anthropicName = anthropicParam.nameByApiSource.get(ApiSource.Anthropic);
    if (anthropicName && !results[anthropicParam.id]) {
      // Check if it's mapped to a different Astrsk ID
      let found = false;
      if (anthropicName === 'stop_sequences' && results['stop_sequence']) found = true;
      
      if (!found) {
        results[anthropicParam.id] = {
          anthropic: anthropicParam,
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
  console.log('Anthropic vs Astrsk Parameter Comparison:');
  console.log('==========================================\n');
  
  const comparisons = compareAnthropicParameterDefinitions();
  
  // First show parameters that exist in both
  console.log('Parameters in both Anthropic and Astrsk:');
  console.log('----------------------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.anthropic && comparison.astrsk) {
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
  console.log('---------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (!comparison.anthropic && comparison.astrsk) {
      console.log(`- ${id}: ${comparison.astrsk.label}`);
    }
  });
  
  // Show parameters only in Anthropic
  console.log('\n\nParameters only in Anthropic:');
  console.log('-----------------------------');
  Object.entries(comparisons).forEach(([id, comparison]) => {
    if (comparison.anthropic && !comparison.astrsk) {
      console.log(`- ${id}: ${comparison.anthropic.label}`);
    }
  });
}