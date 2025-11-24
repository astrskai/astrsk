import { Result } from "@/shared/core";
import {
  supabaseClient,
  DEFAULT_SHARE_EXPIRATION_DAYS,
} from "./supabase-client";
import { uploadAssetToSupabase } from "./supabase-asset-uploader";
import { Asset } from "@/entities/asset/domain/asset";
import { UniqueEntityID } from "@/shared/domain";

// Re-export for convenience
export { DEFAULT_SHARE_EXPIRATION_DAYS };

/**
 * Common types for cloud export
 */
export type ExportType = "file" | "cloud";

export interface ShareLinkResult {
  shareUrl: string;
  resourceId: string;
  expiresAt: Date;
}

export interface CharacterCloudData {
  id: string;
  title: string;
  icon_asset_id: string | null;
  tags: string[];
  creator: string | null;
  card_summary: string | null;
  version: string | null;
  conceptual_origin: string | null;
  vibe_session_id: string | null;
  image_prompt: string | null;
  name: string;
  description: string | null;
  example_dialogue: string | null;
  lorebook: any;
  token_count: number;
  session_id: string | null;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioCloudData {
  id: string;
  title: string;
  icon_asset_id: string | null;
  tags: string[];
  creator: string | null;
  card_summary: string | null;
  version: string | null;
  conceptual_origin: string | null;
  vibe_session_id: string | null;
  image_prompt: string | null;
  name: string;
  description: string | null;
  first_messages: any;
  lorebook: any;
  token_count: number;
  session_id: string | null;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionCloudData {
  id: string;
  title: string;
  name: string | null;
  all_cards: any;
  user_character_card_id: string | null;
  turn_ids: any;
  background_id: string | null;
  cover_id: string | null;
  translation: any;
  chat_styles: any;
  flow_id: string | null;
  auto_reply: string;
  data_schema_order: any;
  widget_layout: any;
  tags: string[];
  summary: string | null;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlowCloudData {
  id: string;
  name: string;
  description: string;
  nodes: any;
  edges: any;
  response_template: string;
  data_store_schema: any;
  panel_structure: any;
  viewport: any;
  vibe_session_id: string | null;
  ready_state: string;
  validation_issues: any;
  token_count: number;
  session_id: string | null;
  tags: string[];
  summary: string | null;
  version: string | null;
  conceptual_origin: string | null;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCloudData {
  id: string;
  flow_id: string;
  name: string;
  description: string;
  target_api_type: string;
  api_source: any;
  model_id: string | null;
  model_name: string | null;
  model_tier: string;
  prompt_messages: string;
  text_prompt: string;
  enabled_parameters: any;
  parameter_values: any;
  enabled_structured_output: boolean;
  output_format: string;
  output_streaming: boolean;
  schema_name: string | null;
  schema_description: string | null;
  schema_fields: any;
  token_count: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DataStoreNodeCloudData {
  id: string;
  flow_id: string;
  name: string;
  color: string;
  data_store_fields: any;
  created_at: string;
  updated_at: string;
}

export interface IfNodeCloudData {
  id: string;
  flow_id: string;
  name: string;
  color: string;
  logicOperator: string | null;
  conditions: any;
  created_at: string;
  updated_at: string;
}

/**
 * Helper: Upload asset and return asset ID
 */
export async function uploadAssetIfExists(
  assetId: UniqueEntityID | null | undefined,
  loadAssetFn: (id: UniqueEntityID) => Promise<Result<Asset>>,
): Promise<string | null> {
  if (!assetId) return null;

  const assetResult = await loadAssetFn(assetId);
  if (assetResult.isFailure) return null;

  const asset = assetResult.getValue();
  const uploadResult = await uploadAssetToSupabase(asset);
  if (uploadResult.isFailure) {
    throw new Error(`Failed to upload asset: ${uploadResult.getError()}`);
  }

  return asset.id.toString();
}

/**
 * Helper: Upload character to cloud
 */
export async function uploadCharacterToCloud(
  characterData: CharacterCloudData,
): Promise<Result<void>> {
  try {
    const { error: insertError } = await supabaseClient
      .from("astrsk_characters")
      .insert(characterData);

    if (insertError) {
      // If already exists, update instead
      if (insertError.code === "23505") {
        const { error: updateError } = await supabaseClient
          .from("astrsk_characters")
          .update(characterData)
          .eq("id", characterData.id);

        if (updateError) {
          return Result.fail(
            `Failed to update existing character: ${updateError.message}`,
          );
        }
      } else {
        return Result.fail(
          `Failed to insert character: ${insertError.message}`,
        );
      }
    }

    return Result.ok();
  } catch (error) {
    return Result.fail(`Unexpected error uploading character: ${error}`);
  }
}

/**
 * Helper: Upload session to cloud
 */
export async function uploadSessionToCloud(
  sessionData: SessionCloudData,
): Promise<Result<void>> {
  try {
    const { error: insertError } = await supabaseClient
      .from("astrsk_sessions")
      .insert(sessionData);

    if (insertError) {
      // If already exists, update instead
      if (insertError.code === "23505") {
        const { error: updateError } = await supabaseClient
          .from("astrsk_sessions")
          .update(sessionData)
          .eq("id", sessionData.id);

        if (updateError) {
          return Result.fail(
            `Failed to update existing session: ${updateError.message}`,
          );
        }
      } else {
        return Result.fail(`Failed to insert session: ${insertError.message}`);
      }
    }

    return Result.ok();
  } catch (error) {
    return Result.fail(`Unexpected error uploading session: ${error}`);
  }
}

/**
 * Helper: Upload scenario to cloud
 */
export async function uploadScenarioToCloud(
  scenarioData: ScenarioCloudData,
): Promise<Result<void>> {
  try {
    const { error: insertError } = await supabaseClient
      .from("astrsk_scenarios")
      .insert(scenarioData);

    if (insertError) {
      // If already exists, update instead
      if (insertError.code === "23505") {
        const { error: updateError } = await supabaseClient
          .from("astrsk_scenarios")
          .update(scenarioData)
          .eq("id", scenarioData.id);

        if (updateError) {
          return Result.fail(
            `Failed to update existing scenario: ${updateError.message}`,
          );
        }
      } else {
        return Result.fail(`Failed to insert scenario: ${insertError.message}`);
      }
    }

    return Result.ok();
  } catch (error) {
    return Result.fail(`Unexpected error uploading scenario: ${error}`);
  }
}

/**
 * Helper: Upload flow to cloud (with all child nodes)
 * Uses database cascade deletes for atomic behavior - if any child node fails,
 * the entire flow is rolled back via ON DELETE CASCADE
 */
export async function uploadFlowToCloud(
  flowData: FlowCloudData,
  agents: AgentCloudData[],
  dataStoreNodes: DataStoreNodeCloudData[],
  ifNodes: IfNodeCloudData[],
): Promise<Result<void>> {
  try {
    // 1. Upload flow (parent record)
    const { error: flowInsertError } = await supabaseClient
      .from("astrsk_flows")
      .insert(flowData);

    if (flowInsertError) {
      // If already exists, update instead
      if (flowInsertError.code === "23505") {
        const { error: updateError } = await supabaseClient
          .from("astrsk_flows")
          .update(flowData)
          .eq("id", flowData.id);

        if (updateError) {
          return Result.fail(
            `Failed to update existing flow: ${updateError.message}`,
          );
        }
      } else {
        return Result.fail(`Failed to insert flow: ${flowInsertError.message}`);
      }
    }

    // 2-4. Upload child nodes with automatic cleanup on failure
    try {
      // 2. Upload agents
      for (const agent of agents) {
        const { error: agentError } = await supabaseClient
          .from("astrsk_agents")
          .insert(agent);

        if (agentError) {
          throw new Error(
            `Failed to upload agent ${agent.id}: ${agentError.message}`,
          );
        }
      }

      // 3. Upload data store nodes
      for (const node of dataStoreNodes) {
        const { error: nodeError } = await supabaseClient
          .from("astrsk_data_store_nodes")
          .insert(node);

        if (nodeError) {
          throw new Error(
            `Failed to upload data store node ${node.id}: ${nodeError.message}`,
          );
        }
      }

      // 4. Upload if nodes
      for (const node of ifNodes) {
        const { error: nodeError } = await supabaseClient
          .from("astrsk_if_nodes")
          .insert(node);

        if (nodeError) {
          throw new Error(
            `Failed to upload if node ${node.id}: ${nodeError.message}`,
          );
        }
      }

      return Result.ok();
    } catch (childError) {
      // Cleanup: Delete flow (cascades to all children via ON DELETE CASCADE)
      await supabaseClient.from("astrsk_flows").delete().eq("id", flowData.id);

      return Result.fail(`${childError}`);
    }
  } catch (error) {
    return Result.fail(`Unexpected error uploading flow: ${error}`);
  }
}

/**
 * Helper: Create shared resource entry
 *
 * Gets database time via raw SQL query and adds expiration delta on client side.
 */
export async function createSharedResource(
  resourceType: "session" | "flow" | "character" | "scenario",
  resourceId: string,
  expirationDays: number = DEFAULT_SHARE_EXPIRATION_DAYS,
): Promise<Result<ShareLinkResult>> {
  try {
    // 1. Get database time using RPC function
    const { data: timeData, error: timeError } = await supabaseClient
      .rpc('get_current_timestamp');

    if (timeError) {
      return Result.fail(`Failed to get database time: ${timeError.message}`);
    }

    const dbTime = new Date(timeData);
    const expiresAt = new Date(dbTime.getTime() + expirationDays * 24 * 60 * 60 * 1000);

    // 2. Insert shared resource with calculated expiration
    const { data: insertData, error: shareError } = await supabaseClient
      .from("astrsk_shared_resources")
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        expires_at: expiresAt.toISOString(),
        claimed_by: null,
      })
      .select('id, expires_at')
      .single();

    if (shareError) {
      return Result.fail(`Failed to create share link: ${shareError.message}`);
    }

    // Generate share URL
    // TODO: Replace with actual harpy.chat domain
    const shareUrl = `https://harpy.chat/shared/${resourceType}/${resourceId}`;

    return Result.ok({
      shareUrl,
      resourceId: insertData?.id || resourceId,
      expiresAt: new Date(insertData?.expires_at || expiresAt),
    });
  } catch (error) {
    return Result.fail(`Unexpected error creating shared resource: ${error}`);
  }
}
