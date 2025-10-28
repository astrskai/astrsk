export interface AgentParameters {
  enabledParameters: Map<string, boolean>;
  parameterValues: Map<string, any>;
}

export class ParameterDrizzleMapper {
  public static toPersistence(parameters: AgentParameters): any {
    return {
      enabled_parameters: Object.fromEntries(parameters.enabledParameters),
      parameter_values: Object.fromEntries(parameters.parameterValues)
    };
  }

  public static toDomain(data: any): AgentParameters {
    return {
      enabledParameters: new Map(Object.entries(data.enabled_parameters || {})),
      parameterValues: new Map(Object.entries(data.parameter_values || {}))
    };
  }
}