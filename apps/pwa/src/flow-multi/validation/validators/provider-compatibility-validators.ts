import { ValidationIssue, ValidationIssueCode } from "@/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/flow-multi/validation/types/functional-validation-types";
import { forEachConnectedAgent, generateIssueId } from "@/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/flow-multi/validation/utils/message-generator";
import { ProviderValidationData } from "@/flow-multi/validation/types/message-data-types";
import { ModelProviderRegistry } from "@/flow-multi/validation/model-provider-registry";
import { Agent, OutputFormat } from "@/modules/agent/domain";
import { ApiSource } from "@/modules/api/domain";
import { ValidationParameter } from "@/flow-multi/validation/types/validation-parameter-types";
import { 
  anthropicParameterList,
  openAIParameterList,
  googleParameterList,
  deepSeekParameterList,
  mistralParameterList,
  xaiParameterList,
  cohereParameterList,
  ollamaParameterList,
  koboldCppParameterList,
  astrskParameterList,
  openRouterParameterList,
  vertexAIParameterList
} from "@/flow-multi/validation/providers";

// Check if provider supports structured output
export const validateStructuredOutputSupport: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent, context) => {
    const issues: ValidationIssue[] = [];
    
    const modelName = agent.props.modelName;
    if (!modelName) return issues;
    
    // Check if structured output is enabled
    const isStructuredOutputEnabled = agent.props.enabledStructuredOutput;
    if (!isStructuredOutputEnabled) return issues;
    
    // Get the API connection to check the provider
    if (!context.apiConnectionsWithModels) return issues;
    
    const apiConnectionWithModels = context.apiConnectionsWithModels.find(conn => 
      conn.models.some(model => model.name === modelName)
    );
    
    if (!apiConnectionWithModels) return issues;
    
    const apiSource = apiConnectionWithModels.apiConnection.source;
    
    // Providers that support structured output but models are not verified
    const unverifiableProviders: ApiSource[] = [ApiSource.OpenRouter, ApiSource.OpenAICompatible];
    
    // Providers that support structured output
    const supportedProviders: ApiSource[] = [
      ApiSource.OpenAI,
      ApiSource.Anthropic,
      ApiSource.GoogleGenerativeAI,
      ApiSource.Mistral,
      ApiSource.DeepSeek,
      ApiSource.xAI,
      ApiSource.Cohere,
      ApiSource.Ollama,
      ApiSource.KoboldCPP,
      ApiSource.AstrskAi,
    ];
    
    if (unverifiableProviders.includes(apiSource)) {
      // TODO: implement unverifiable providers
      // // For unverifiable providers, check if we can detect a known model pattern
      // const providerInfo = ModelProviderRegistry.detectModelProvider(modelName);
      
      // if (!providerInfo) {
      //   // Model is not recognized, show warning about unverified support
      //   const message = generateValidationMessage(ValidationIssueCode.UNVERIFIED_MODEL, {
      //     agentName: agent.props.name,
      //     modelName: modelName,
      //     provider: apiSource
      //   });
      //   issues.push({
      //     id: generateIssueId(ValidationIssueCode.UNVERIFIED_MODEL, agentId),
      //     code: ValidationIssueCode.UNVERIFIED_MODEL,
      //     severity: 'warning',
      //     ...message,
      //     agentId,
      //     agentName: agent.props.name,
      //     metadata: {
      //       modelName,
      //       provider: apiSource,
      //       feature: 'structuredOutput',
      //     },
      //   });
      // }
      // If provider info is found, it means it's a known model, so no warning needed
    } else if (!supportedProviders.includes(apiSource)) {
      // Provider doesn't support structured output at all
      const message = generateValidationMessage(ValidationIssueCode.UNSUPPORTED_PARAMETERS, {
        agentName: agent.props.name,
        provider: apiSource,
        feature: 'structured output'
      });
      issues.push({
        id: generateIssueId(ValidationIssueCode.UNSUPPORTED_PARAMETERS, agentId),
        code: ValidationIssueCode.UNSUPPORTED_PARAMETERS,
        severity: 'warning',
        ...message,
        agentId,
        agentName: agent.props.name,
        metadata: {
          provider: apiSource,
          feature: 'structuredOutput',
        },
      });
    }
    // If it's in supportedProviders, no warning needed
    
    return issues;
  }
);

// Map of provider parameters
const providerParameterMap: Partial<Record<ApiSource, ValidationParameter[]>> = {
  [ApiSource.OpenAI]: openAIParameterList,
  [ApiSource.Anthropic]: anthropicParameterList,
  [ApiSource.GoogleGenerativeAI]: googleParameterList,
  [ApiSource.DeepSeek]: deepSeekParameterList,
  [ApiSource.Mistral]: mistralParameterList,
  [ApiSource.xAI]: xaiParameterList,
  [ApiSource.Cohere]: cohereParameterList,
  [ApiSource.Ollama]: ollamaParameterList,
  [ApiSource.KoboldCPP]: koboldCppParameterList,
  [ApiSource.AstrskAi]: astrskParameterList,
  [ApiSource.OpenRouter]: openRouterParameterList,
  [ApiSource.OpenAICompatible]: [], // No specific parameters defined
  [ApiSource.Wllama]: [], // No specific parameters defined
  [ApiSource.AIHorde]: [], // No specific parameters defined
  [ApiSource.Dummy]: [], // No specific parameters defined
};

// Check provider-specific parameter constraints
export const validateProviderParameters: ValidatorFunction = forEachConnectedAgent(
  (agentId, agent: Agent, context) => {
    const issues: ValidationIssue[] = [];
    
    const modelName = agent.props.modelName;
    if (!modelName || !context.apiConnectionsWithModels) return issues;
    
    // Get the API connection for this model
    const apiConnectionWithModels = context.apiConnectionsWithModels.find(conn => 
      conn.models.some(model => model.name === modelName)
    );
    
    if (!apiConnectionWithModels) return issues;
    
    const apiSource = apiConnectionWithModels.apiConnection.source;
    const providerParams = providerParameterMap[apiSource] || [];
    
    // Create a map of provider parameters by ID for quick lookup
    const providerParamMap = new Map<string, ValidationParameter>();
    providerParams.forEach(param => {
      providerParamMap.set(param.id, param);
    });
    
    // Check each enabled parameter
    agent.props.enabledParameters.forEach((enabled, parameterId) => {
      if (!enabled) return;
      
      const value = agent.props.parameterValues.get(parameterId);
      if (value === undefined || value === null) return;
      
      const providerParam = providerParamMap.get(parameterId);
      
      if (!providerParam) {
        // Parameter not defined for this provider
        if (modelName) {
          // If we have a model name, show warning
          const message = generateValidationMessage(ValidationIssueCode.UNDEFINED_PROVIDER_PARAMETER, {
            agentName: agent.props.name,
            parameter: parameterId,
            provider: apiSource,
            modelName: modelName
          });
          issues.push({
            id: generateIssueId(ValidationIssueCode.UNDEFINED_PROVIDER_PARAMETER, agentId),
            code: ValidationIssueCode.UNDEFINED_PROVIDER_PARAMETER,
            severity: 'warning',
            ...message,
            agentId,
            agentName: agent.props.name,
            metadata: {
              parameter: parameterId,
              provider: apiSource,
              modelName: modelName
            }
          });
        }
      } else {
        // Check parameter constraints
        if (providerParam.type === 'number' && typeof value === 'number') {
          // Check min constraint
          if (providerParam.min !== undefined && value < providerParam.min) {
            const message = generateValidationMessage(ValidationIssueCode.PARAMETER_OUT_OF_RANGE, {
              agentName: agent.props.name,
              parameter: parameterId,
              value: value.toString(),
              min: providerParam.min.toString(),
              max: providerParam.max?.toString(),
              provider: apiSource
            });
            issues.push({
              id: generateIssueId(ValidationIssueCode.PARAMETER_OUT_OF_RANGE, agentId),
              code: ValidationIssueCode.PARAMETER_OUT_OF_RANGE,
              severity: 'warning',
              ...message,
              agentId,
              agentName: agent.props.name,
              metadata: {
                parameter: parameterId,
                value,
                min: providerParam.min,
                max: providerParam.max
              }
            });
          }
          
          // Check max constraint
          if (providerParam.max !== undefined && value > providerParam.max) {
            const message = generateValidationMessage(ValidationIssueCode.PARAMETER_OUT_OF_RANGE, {
              agentName: agent.props.name,
              parameter: parameterId,
              value: value.toString(),
              min: providerParam.min?.toString(),
              max: providerParam.max.toString(),
              provider: apiSource
            });
            issues.push({
              id: generateIssueId(ValidationIssueCode.PARAMETER_OUT_OF_RANGE, agentId),
              code: ValidationIssueCode.PARAMETER_OUT_OF_RANGE,
              severity: 'warning',
              ...message,
              agentId,
              agentName: agent.props.name,
              metadata: {
                parameter: parameterId,
                value,
                min: providerParam.min,
                max: providerParam.max
              }
            });
          }
        }
      }
    });
    
    return issues;
  }
);