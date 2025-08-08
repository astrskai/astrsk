import { ApiSource } from "@/modules/api/domain";

export interface Parameter {
  id: string;
  label: string;
  nameByApiSource: Map<ApiSource, string>;
  type:
    | "number"
    | "boolean"
    | "string"
    | "enum"
    | "logit_bias"
    | "safety_settings";
  default: any;
  min?: number;
  max?: number;
  step?: number;
  enums?: string[];
  parsingFunction?: (value: string, apiSource?: ApiSource) => any;
}

// TODO: parameter groups
export const parameterList: Parameter[] = [
  {
    id: "context",
    label: "Context (tokens)",
    nameByApiSource: new Map([]),
    type: "number",
    default: 1024 * 4,
    min: 1,
    max: Infinity,
    step: 1,
  },
  {
    id: "max_tokens",
    label: "Response (tokens)",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "max_tokens"],
      [ApiSource.KoboldCPP, "max_length"],
    ]),
    type: "number",
    default: 300,
    min: 1,
    max: Infinity,
    step: 1,
  },
  {
    id: "thinking_budget",
    label: "Thinking Budget",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "thinkingConfig"],
      [ApiSource.Anthropic, "thinking"],
    ]),
    type: "number",
    default: 300,
    min: 0,
    max: Infinity,
    step: 1,
    parsingFunction: (value: string, apiSource?: ApiSource) => {
      const budget = Number.parseInt(value);
      switch (apiSource) {
        case ApiSource.GoogleGenerativeAI:
          return {
            thinkingBudget: budget,
          };
        case ApiSource.Anthropic:
          return {
            type: "enabled",
            budgetTokens: budget,
          };
        default:
          return {};
      }
    },
  },
  {
    id: "temperature",
    label: "Temperature",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "temp"],
      [ApiSource.KoboldCPP, "temperature"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    id: "top_k",
    label: "Top K",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "top_k"],
      [ApiSource.KoboldCPP, "top_k"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 200,
    step: 1,
  },
  {
    id: "top_p",
    label: "Top P",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "top_p"],
      [ApiSource.KoboldCPP, "top_p"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "typical_p",
    label: "Typical P",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "typical_p"],
      [ApiSource.KoboldCPP, "typical_p"],
    ]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "min_p",
    label: "Min P",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "min_p"],
      [ApiSource.Wllama, "min_p"],
      [ApiSource.KoboldCPP, "min_p"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    id: "top_a",
    label: "Top A",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "min_p"],
      [ApiSource.KoboldCPP, "top_a"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "presence_pen",
    label: "Presence Penalty",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "penalty_present"],
      [ApiSource.KoboldCPP, "presence_penalty"],
    ]),
    type: "number",
    default: 0,
    min: -2,
    max: 2,
    step: 0.01,
  },
  {
    id: "freq_pen",
    label: "Frequency Penalty",
    nameByApiSource: new Map([[ApiSource.Wllama, "penalty_freq"]]),
    type: "number",
    default: 0,
    min: -2,
    max: 2,
    step: 0.01,
  },
  {
    id: "rep_pen",
    label: "Repetition Penalty",
    nameByApiSource: new Map([
      [ApiSource.OpenRouter, "rep_pen"],
      [ApiSource.Wllama, "penalty_repeat"],
      [ApiSource.KoboldCPP, "rep_pen"],
    ]),
    type: "number",
    default: 1,
    min: 1,
    max: 3,
    step: 0.01,
  },
  {
    id: "penalty_last_n",
    label: "Repetition Penalty > Last N",
    nameByApiSource: new Map([[ApiSource.Wllama, "penalty_last_n"]]),
    type: "number",
    default: 0,
    min: -1,
    max: Infinity,
    step: 1,
  },
  {
    id: "penalize_nl",
    label: "Repetition Penalty > Penalize Newline",
    nameByApiSource: new Map([[ApiSource.Wllama, "penalize_nl"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "dynatemp_range",
    label: "Dynamic Temperature > Range",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "dynatemp_range"],
      [ApiSource.KoboldCPP, "dynatemp_range"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "dynatemp_exponent",
    label: "Dynamic Temperature > Exponent",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "dynatemp_exponent"],
      [ApiSource.KoboldCPP, "dynatemp_exponent"],
    ]),
    type: "number",
    default: 1,
    min: 0.01,
    max: 10,
    step: 0.01,
  },
  {
    id: "mirostat",
    label: "Mirostat > Mode",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "mirostat"],
      [ApiSource.KoboldCPP, "mirostat"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 2,
    step: 1,
  },
  {
    id: "mirostat_tau",
    label: "Mirostat > Tau",
    nameByApiSource: new Map([
      [ApiSource.Wllama, "mirostat_tau"],
      [ApiSource.KoboldCPP, "mirostat_tau"],
    ]),
    type: "number",
    default: 5,
    min: 0,
    max: 20,
    step: 0.01,
  },
  {
    id: "seed",
    label: "Random Seed",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "seed"]]),
    type: "number",
    default: -1,
    min: -1,
    max: 999999,
    step: 1,
  },
  {
    id: "max_context_length",
    label: "Maximum Context Length",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "max_context_length"]]),
    type: "number",
    default: 2048,
    min: 8,
    max: 999999,
    step: 1,
  },
  {
    id: "logit_bias",
    label: "Logit Bias",
    nameByApiSource: new Map([
      [ApiSource.OpenAI, "logit_bias"],
      [ApiSource.OpenRouter, "logit_bias"],
      [ApiSource.Wllama, "logit_bias"],
      [ApiSource.KoboldCPP, "logit_bias"],
    ]),
    type: "logit_bias",
    default: "[]",
    min: -100,
    max: 100,
    step: 0.01,
  },
  {
    id: "n_prev",
    label: "Number of Previous Tokens",
    nameByApiSource: new Map([[ApiSource.Wllama, "n_prev"]]),
    type: "number",
    default: 64,
    min: 0,
    max: Infinity,
    step: 1,
  },
  {
    id: "tfs",
    label: "Tail Free Sampling",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "tfs"]]),
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    id: "rep_pen_range",
    label: "Repetition Penalty Range",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "rep_pen_range"]]),
    type: "number",
    default: 360,
    min: 0,
    max: 4096,
    step: 1,
  },
  {
    id: "rep_pen_slope",
    label: "Repetition Penalty Slope",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "rep_pen_slope"]]),
    type: "number",
    default: 0.7,
    min: 0,
    max: 20,
    step: 0.01,
  },
  {
    id: "smoothing_factor",
    label: "Temperature Smoothing Factor",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "smoothing_factor"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 10,
    step: 0.01,
  },
  {
    id: "mirostat_eta",
    label: "Mirostat Eta",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "mirostat_eta"]]),
    type: "number",
    default: 0.1,
    min: 0,
    max: 10,
    step: 0.01,
  },
  {
    id: "allow_eos_token",
    label: "Allow EOS Token",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "allow_eos_token"]]),
    type: "boolean",
    default: true,
  },
  {
    id: "bypass_eos_token",
    label: "Bypass EOS Token",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "bypass_eos_token"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "xtc_threshold",
    label: "Cross-Attention Threshold",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "xtc_threshold"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "xtc_probability",
    label: "Cross-Attention Probability",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "xtc_probability"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "sampler_order",
    label: "Sampler Order (comma-sep.)",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "sampler_order"]]),
    type: "string",
    default: "6,0,1,3,4,2,5",
    parsingFunction: (value: string): number[] => {
      const trimmedValue = value.trim();
      const cleanedValue =
        trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
          ? trimmedValue.slice(1, -1)
          : trimmedValue;
      const parsedValues = cleanedValue
        .split(",")
        .map((v) => parseInt(v.trim(), 10));
      if (parsedValues.some(isNaN)) {
        throw new Error("All values must be valid integers");
      }
      return parsedValues;
    },
  },
  {
    id: "sampler_len",
    label: "Length of Sampler Order Array",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "sampler_len"]]),
    type: "number",
    default: 7,
    min: 1,
    max: 7,
    step: 1,
  },
  {
    id: "render_special",
    label: "Render Special Tokens",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "render_special"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "grammar",
    label: "Grammar String",
    nameByApiSource: new Map([[ApiSource.Wllama, "grammar"]]),
    type: "string",
    default: "",
  },
  {
    id: "grammar_retain_state",
    label: "Retain Grammar State",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "grammar_retain_state"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "dry_multiplier",
    label: "Dry Run Multiplier",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "dry_multiplier"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 100,
    step: 0.1,
  },
  {
    id: "dry_base",
    label: "Dry Run Base",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "dry_base"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 8,
    step: 0.1,
  },
  {
    id: "dry_allowed_length",
    label: "Dry Run Allowed Length",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "dry_allowed_length"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "dry_penalty_last_n",
    label: "Dry Run Penalty Last N",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "dry_penalty_last_n"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 1000,
    step: 1,
  },
  {
    id: "dry_sequence_breakers_len",
    label: "Dry Sequence Breakers Length",
    nameByApiSource: new Map([
      [ApiSource.KoboldCPP, "dry_sequence_breakers_len"],
    ]),
    type: "number",
    default: 0,
    min: 0,
    max: 1000,
    step: 1,
  },
  {
    id: "dry_sequence_breakers",
    label: "Dry Sequence Breakers (comma-sep.)",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "dry_sequence_breakers"]]),
    type: "string",
    default: "",
    parsingFunction: (value: string): string[] => {
      const trimmedValue = value.trim();
      const cleanedValue =
        trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
          ? trimmedValue.slice(1, -1)
          : trimmedValue;
      return cleanedValue.split(",").map((v) => v.trim());
    },
  },
  {
    id: "stream_sse",
    label: "Enable SSE Streaming",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "stream_sse"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "quiet",
    label: "Quiet Mode",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "quiet"]]),
    type: "boolean",
    default: false,
  },
  {
    id: "stop_sequence_len",
    label: "Stop Sequence Length",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "stop_sequence_len"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "stop_sequence",
    label: "Stop Sequences (comma-sep.)",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "stop_sequence"]]),
    type: "string",
    default: "",
    parsingFunction: (value: string): string[] => {
      const trimmedValue = value.trim();
      const cleanedValue =
        trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
          ? trimmedValue.slice(1, -1)
          : trimmedValue;
      return cleanedValue.split(",").map((v) => v.trim());
    },
  },
  {
    id: "banned_tokens_len",
    label: "Banned Tokens Length",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "banned_tokens_len"]]),
    type: "number",
    default: 0,
    min: 0,
    max: 1000,
    step: 1,
  },
  {
    id: "banned_tokens",
    label: "Banned Tokens (comma-sep.)",
    nameByApiSource: new Map([[ApiSource.KoboldCPP, "banned_tokens"]]),
    type: "string",
    default: "",
    parsingFunction: (value: string): string[] => {
      const trimmedValue = value.trim();
      const cleanedValue =
        trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
          ? trimmedValue.slice(1, -1)
          : trimmedValue;
      return cleanedValue.split(",").map((v) => v.trim());
    },
  },
  {
    id: "safety_settings",
    label: "Safety Settings",
    nameByApiSource: new Map([
      [ApiSource.GoogleGenerativeAI, "safetySettings"],
    ]),
    type: "safety_settings",
    default: "[]",
    parsingFunction: (value: string) => {
      return JSON.parse(value);
    },
  },
];

export const parameterMap = new Map<string, Parameter>(
  parameterList.map((parameter) => [parameter.id, parameter]),
);
