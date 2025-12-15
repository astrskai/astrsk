import { and, asc, desc, eq, gt, inArray, like, SQL } from "drizzle-orm";
import { stringify, parse } from "superjson";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { agents } from "@/db/schema/agents";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Agent, ApiType } from "@/entities/agent/domain";
import { AgentDrizzleMapper } from "@/entities/agent/mappers/agent-drizzle-mapper";
import {
  DeleteAgentRepo,
  LoadAgentRepo,
  SaveAgentRepo,
  SearchAgentQuery,
} from "@/entities/agent/repos";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleAgentRepo
  implements SaveAgentRepo, LoadAgentRepo, DeleteAgentRepo {
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}
  constructor() { }

  async saveAgent(agent: Agent, tx?: Transaction): Promise<Result<Agent>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = AgentDrizzleMapper.toPersistence(agent);

      // Insert or update agent
      const savedRow = await db
        .insert(agents)
        .values(row)
        .onConflictDoUpdate({
          target: agents.id,
          set: row,
        })
        .returning()
        .then(getOneOrThrow);

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Agents,
      //   entityId: savedRow.id,
      //   updatedAt: savedRow.updated_at,
      // });

      // Return saved agent
      return Result.ok(AgentDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to save agent: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getAgentById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Agent>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select agent by id
      const row = await db
        .select()
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then(getOneOrThrow);

      // Return agent
      return Result.ok(AgentDrizzleMapper.toDomain(row));
    } catch (error) {
      return Result.fail<Agent>(
        `Failed to get agent: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async searchAgents(
    query: SearchAgentQuery,
    tx?: Transaction,
  ): Promise<Result<Agent[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Make filters
      const filters = [
        query.targetApiType
          ? eq(agents.target_api_type, query.targetApiType)
          : undefined,
        query.keyword ? like(agents.name, `%${query.keyword}%`) : undefined,
      ].filter(Boolean) as SQL<unknown>[];

      // if (query.targetApiType) {
      //   filters.push(eq(agents.target_api_type, query.targetApiType));
      // }

      // if (query.targetModel) {
      //   filters.push(like(agents.target_model, `%${query.targetModel}%`));
      // }

      // if (query.keyword) {
      //   filters.push(like(agents.name, `%${query.keyword}%`));
      // }

      // Select agents
      const rows = await db
        .select()
        .from(agents)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(desc(agents.created_at));

      // Convert rows to entities
      const entities = rows.map((row) => AgentDrizzleMapper.toDomain(row));

      // Return agents
      return Result.ok(entities);
    } catch (error) {
      return Result.fail<Agent[]>(
        `Failed to search agent: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async canUseAgentName(
    name: string,
    tx?: Transaction,
  ): Promise<Result<boolean>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Check if agent with same name exists
      const row = await db
        .select()
        .from(agents)
        .where(eq(agents.name, name))
        .limit(1);

      // Return true if no agent with same name exists
      return Result.ok(row.length === 0);
    } catch (error) {
      return Result.fail<boolean>(
        `Failed to check agent name: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getAgentsByFlowId(
    flowId: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Agent[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select agents by flow_id
      const rows = await db
        .select()
        .from(agents)
        .where(eq(agents.flow_id, flowId.toString()));

      // Convert rows to entities
      const entities = rows.map((row) => AgentDrizzleMapper.toDomain(row));

      // Return agents
      return Result.ok(entities);
    } catch (error) {
      return Result.fail<Agent[]>(
        `Failed to get agents by flow ID: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getAgentParameters(
    agentId: string,
    tx?: Transaction,
  ): Promise<Result<{ enabledParameters: Map<string, boolean>; parameterValues: Map<string, any> }>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only parameter fields
      const row = await db
        .select({
          enabled_parameters: agents.enabled_parameters,
          parameter_values: agents.parameter_values,
        })
        .from(agents)
        .where(eq(agents.id, agentId))
        .then(getOneOrThrow);

      // Convert objects to Maps
      const enabledParameters = new Map(Object.entries(row.enabled_parameters || {}));
      const parameterValues = new Map(Object.entries(row.parameter_values || {}));

      const result = { enabledParameters, parameterValues };

      return Result.ok(result);
    } catch (error) {
      return Result.fail(
        `Failed to get agent parameters: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateAgentParameters(
    agentId: string,
    enabledParameters: Map<string, boolean>,
    parameterValues: Map<string, any>,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert Maps to objects for JSON storage
      const enabledParamsObj = Object.fromEntries(enabledParameters);
      const parameterValuesObj = Object.fromEntries(parameterValues);

      // Update only the parameter fields
      await db
        .update(agents)
        .set({
          enabled_parameters: enabledParamsObj,
          parameter_values: parameterValuesObj,
        })
        .where(eq(agents.id, agentId));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update agent parameters: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get only output-related fields from an agent
   * Used by the output panel to avoid loading the entire agent
   */
  async getAgentOutputFields(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<{
    enabledStructuredOutput: boolean;
    outputFormat?: any;
    outputStreaming?: boolean;
    schemaName?: string;
    schemaDescription?: string;
    schemaFields: any[];
    name: string;
  } | null> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only output-related fields
      const row = await db
        .select({
          name: agents.name,
          enabled_structured_output: agents.enabled_structured_output,
          output_format: agents.output_format,
          output_streaming: agents.output_streaming,
          schema_name: agents.schema_name,
          schema_description: agents.schema_description,
          schema_fields: agents.schema_fields,
        })
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then((rows) => rows[0] || null);

      if (!row) {
        return null;
      }

      // Return the output fields
      return {
        name: row.name,
        enabledStructuredOutput: row.enabled_structured_output,
        outputFormat: row.output_format,
        outputStreaming: row.output_streaming ?? undefined,
        schemaName: row.schema_name || undefined,
        schemaDescription: row.schema_description || undefined,
        schemaFields: row.schema_fields || [],
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update only output-related fields of an agent
   * Used by the output panel for efficient updates
   */
  async updateAgentOutputFields(
    agentId: string,
    outputData: {
      enabledStructuredOutput?: boolean;
      outputFormat?: any;
      outputStreaming?: boolean;
      schemaName?: string;
      schemaDescription?: string;
      schemaFields?: any[];
    },
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Build update object with only provided fields
      const updateObj: any = {};

      if (outputData.enabledStructuredOutput !== undefined) {
        updateObj.enabled_structured_output = outputData.enabledStructuredOutput;
      }
      if (outputData.outputFormat !== undefined) {
        updateObj.output_format = outputData.outputFormat;
      }
      if (outputData.outputStreaming !== undefined) {
        updateObj.output_streaming = outputData.outputStreaming;
      }
      if (outputData.schemaName !== undefined) {
        updateObj.schema_name = outputData.schemaName;
      }
      if (outputData.schemaDescription !== undefined) {
        updateObj.schema_description = outputData.schemaDescription;
      }
      if (outputData.schemaFields !== undefined) {
        updateObj.schema_fields = outputData.schemaFields;
      }

      // Update only the output fields
      await db
        .update(agents)
        .set(updateObj)
        .where(eq(agents.id, agentId));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update agent output: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get only prompt-related fields from the agent
   * Used by the prompt panel to avoid loading the entire agent
   */
  async getAgentPromptFields(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<{
    name: string;
    targetApiType: ApiType; // API type stored as string in DB
    promptMessages: Record<string, unknown>[] | null; // JSON objects from database
    textPrompt: string | null;
  } | null> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only prompt-related fields
      const row = await db
        .select({
          name: agents.name,
          target_api_type: agents.target_api_type,
          prompt_messages: agents.prompt_messages,
          text_prompt: agents.text_prompt,
        })
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then((rows) => rows[0] || null);

      if (!row) {
        return null;
      }

      // Parse prompt messages from superjson string
      let promptMessages: Record<string, unknown>[] | null = null;
      if (row.prompt_messages) {
        try {
          const parsed = parse(row.prompt_messages);
          // Ensure it's an array or null
          promptMessages = Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          promptMessages = null;
        }
      }

      return {
        name: row.name,
        targetApiType: row.target_api_type as ApiType,
        promptMessages,
        textPrompt: row.text_prompt,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch agent prompt fields: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Update only prompt-related fields of an agent
   * Used for efficient prompt panel updates
   * Note: promptMessages should already be plain JSON objects (from toJSON())
   */
  async updateAgentPromptFields(
    agentId: string,
    promptData: {
      targetApiType?: any;
      promptMessages?: any[]; // Plain JSON objects, not PromptMessage instances
      textPrompt?: string;
    },
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const updateObj: any = {
        updated_at: new Date(),
      };

      // Build update object with only provided fields
      if (promptData.targetApiType !== undefined) {
        updateObj.target_api_type = promptData.targetApiType;
      }
      if (promptData.promptMessages !== undefined) {
        // Stringify the prompt messages for database storage using superjson
        updateObj.prompt_messages = stringify(promptData.promptMessages || []);
      }
      if (promptData.textPrompt !== undefined) {
        updateObj.text_prompt = promptData.textPrompt;
      }

      // Update only the prompt fields
      await db
        .update(agents)
        .set(updateObj)
        .where(eq(agents.id, agentId));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update agent prompt: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get only the agent name field
   * Used by the agent node for efficient name display
   */
  async getAgentName(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<{ name: string } | null> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only name field
      const row = await db
        .select({
          name: agents.name,
        })
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then((rows) => rows[0] || null);

      if (!row) {
        return null;
      }

      return {
        name: row.name,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update only the agent name field
   * Used for efficient name updates from agent node
   */
  async updateAgentName(
    agentId: string,
    name: string,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Update only the name field
      await db
        .update(agents)
        .set({
          name,
          updated_at: new Date(),
        })
        .where(eq(agents.id, agentId));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update agent name: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get only model-related fields from the agent
   * Used by the agent node for efficient model display
   */
  async getAgentModel(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<{
    modelName: string | null;
    apiSource: string | null;
    modelId: string | null;
  } | null> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select only model-related fields
      const row = await db
        .select({
          model_name: agents.model_name,
          api_source: agents.api_source,
          model_id: agents.model_id,
        })
        .from(agents)
        .where(eq(agents.id, id.toString()))
        .then((rows) => rows[0] || null);

      if (!row) {
        return null;
      }

      return {
        modelName: row.model_name,
        apiSource: row.api_source,
        modelId: row.model_id,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update only model-related fields of an agent
   * Used for efficient model updates from agent node
   */
  async updateAgentModel(
    agentId: string,
    modelData: {
      modelName?: string;
      apiSource?: string;
      modelId?: string;
    },
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      const updateObj: any = {
        updated_at: new Date(),
      };

      // Build update object with only provided fields
      if (modelData.modelName !== undefined) {
        updateObj.model_name = modelData.modelName;
      }
      if (modelData.apiSource !== undefined) {
        updateObj.api_source = modelData.apiSource;
      }
      if (modelData.modelId !== undefined) {
        updateObj.model_id = modelData.modelId;
      }

      // Update only the model fields
      await db
        .update(agents)
        .set(updateObj)
        .where(eq(agents.id, agentId));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update agent model: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deleteAgent(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete agent by id
      await db.delete(agents).where(eq(agents.id, id.toString()));

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Agents,
      //   entityId: id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok();
    } catch (error) {
      return Result.fail<void>(
        `Failed to delete agent: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
