import { OutputFormat } from "@/modules/agent/domain/agent";
import { AgentOutputResult } from "@/modules/agent/usecases/get-agent-output";

export class OutputDrizzleMapper {
  public static toPersistence(output: AgentOutputResult): any {
    return {
      name: output.name,
      enabled_structured_output: output.enabledStructuredOutput,
      output_format: output.outputFormat,
      output_streaming: output.outputStreaming,
      schema_name: output.schemaName,
      schema_description: output.schemaDescription,
      schema_fields: output.schemaFields,
    };
  }

  public static toDomain(data: any): AgentOutputResult {
    return {
      name: data.name,
      enabledStructuredOutput: data.enabled_structured_output,
      outputFormat: (data.output_format as OutputFormat) ?? OutputFormat.StructuredOutput,
      outputStreaming: data.output_streaming ?? true,
      schemaName: data.schema_name ?? undefined,
      schemaDescription: data.schema_description ?? undefined,
      schemaFields: data.schema_fields ?? undefined,
    };
  }
}