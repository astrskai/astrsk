import { Result } from "@/shared/core";
import { supabaseClient, ASSETS_BUCKET } from "./supabase-client";
import type {
  CharacterCloudData,
  ScenarioCloudData,
  SessionCloudData,
  FlowCloudData,
  AgentCloudData,
  DataStoreNodeCloudData,
  IfNodeCloudData,
} from "./cloud-upload-helpers";

// Re-export types for convenience
export type {
  CharacterCloudData,
  ScenarioCloudData,
  SessionCloudData,
  FlowCloudData,
  AgentCloudData,
  DataStoreNodeCloudData,
  IfNodeCloudData,
};

// Environment variables for storage URLs
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Digital Ocean Spaces URL for bot-avatars
const DIGITALOCEAN_SPACES_URL = import.meta.env.VITE_DIGITALOCEAN_SPACES_URL;

/**
 * Construct full storage URL from a file path.
 * Handles both DigitalOcean Spaces (bot-avatars/) and Supabase Storage paths.
 *
 * @param filePath - The file path (could be relative or full URL)
 * @returns Full URL to the file
 */
export function getStorageUrl(filePath: string): string {
  // If filePath is already a full URL, return it as-is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // DigitalOcean Spaces paths start with 'bot-avatars/'
  if (filePath.startsWith("bot-avatars/")) {
    if (!DIGITALOCEAN_SPACES_URL) {
      console.warn(
        "[getStorageUrl] VITE_DIGITALOCEAN_SPACES_URL is not set. " +
        "Bot avatar assets will fail to load. " +
        "Please add VITE_DIGITALOCEAN_SPACES_URL to your .env file."
      );
    }
    return `${DIGITALOCEAN_SPACES_URL}/${filePath}`;
  }

  // Default to Supabase Storage public URL
  if (!SUPABASE_URL) {
    console.warn(
      "[getStorageUrl] VITE_SUPABASE_URL is not set. " +
      "Storage assets will fail to load. " +
      "Please add VITE_SUPABASE_URL to your .env file."
    );
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${ASSETS_BUCKET}/${filePath}`;
}

/**
 * Asset data from cloud
 */
export interface AssetCloudData {
  id: string;
  hash: string;
  name: string;
  size_byte: number;
  mime_type: string;
  file_path: string;
  session_id: string | null;
  character_id: string | null;
  scenario_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Session bundle containing all related resources
 */
export interface SessionCloudBundle {
  session: SessionCloudData;
  characters: CharacterCloudData[];
  scenarios: ScenarioCloudData[];
  flow: FlowCloudData | null;
  agents: AgentCloudData[];
  dataStoreNodes: DataStoreNodeCloudData[];
  ifNodes: IfNodeCloudData[];
  assets: AssetCloudData[];
}

/**
 * Check if a resource has a valid (non-expired) expiration date
 * @deprecated Supabase RLS policies now handle access control.
 * Resources are accessible if: is_public = true OR (expiration_date IS NOT NULL AND expiration_date > NOW())
 * This function is kept for reference but is no longer used by fetch functions.
 */
export async function checkResourceAccess(
  resourceType: "session" | "flow" | "character" | "scenario",
  resourceId: string,
): Promise<Result<boolean>> {
  try {
    const tableName = `astrsk_${resourceType}s`;

    const { data, error } = await supabaseClient
      .from(tableName)
      .select("expiration_date")
      .eq("id", resourceId)
      .single();

    if (error) {
      return Result.fail(`Failed to check resource access: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Resource not found");
    }

    // Check if expiration_date is set and not expired
    if (!data.expiration_date) {
      return Result.fail("Resource is not shared (no expiration date)");
    }

    const expirationDate = new Date(data.expiration_date);
    const now = new Date();

    if (expirationDate <= now) {
      return Result.fail("Resource has expired");
    }

    return Result.ok(true);
  } catch (error) {
    return Result.fail(`Unexpected error checking resource access: ${error}`);
  }
}

/**
 * Fetch character from cloud by ID
 */
export async function fetchCharacterFromCloud(
  characterId: string,
): Promise<Result<CharacterCloudData>> {
  try {
    // Note: Supabase RLS handles access control (is_public or non-expired expiration_date)
    const { data, error } = await supabaseClient
      .from("astrsk_characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (error) {
      return Result.fail(`Failed to fetch character: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Character not found");
    }

    return Result.ok(data as CharacterCloudData);
  } catch (error) {
    return Result.fail(`Unexpected error fetching character: ${error}`);
  }
}

/**
 * Fetch scenario from cloud by ID
 */
export async function fetchScenarioFromCloud(
  scenarioId: string,
): Promise<Result<ScenarioCloudData>> {
  try {
    // Note: Supabase RLS handles access control (is_public or non-expired expiration_date)
    const { data, error } = await supabaseClient
      .from("astrsk_scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();

    if (error) {
      return Result.fail(`Failed to fetch scenario: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Scenario not found");
    }

    return Result.ok(data as ScenarioCloudData);
  } catch (error) {
    return Result.fail(`Unexpected error fetching scenario: ${error}`);
  }
}

/**
 * Fetch flow from cloud by ID (with all child nodes)
 */
export async function fetchFlowFromCloud(
  flowId: string,
): Promise<Result<{
  flow: FlowCloudData;
  agents: AgentCloudData[];
  dataStoreNodes: DataStoreNodeCloudData[];
  ifNodes: IfNodeCloudData[];
}>> {
  try {
    // Note: Supabase RLS handles access control (is_public or non-expired expiration_date)
    // Fetch flow
    const { data: flowData, error: flowError } = await supabaseClient
      .from("astrsk_flows")
      .select("*")
      .eq("id", flowId)
      .single();

    if (flowError) {
      return Result.fail(`Failed to fetch flow: ${flowError.message}`);
    }

    if (!flowData) {
      return Result.fail("Flow not found");
    }

    // Fetch agents for this flow
    const { data: agentsData, error: agentsError } = await supabaseClient
      .from("astrsk_agents")
      .select("*")
      .eq("flow_id", flowId);

    if (agentsError) {
      return Result.fail(`Failed to fetch agents: ${agentsError.message}`);
    }

    // Fetch data store nodes for this flow
    const { data: dataStoreNodesData, error: dataStoreError } = await supabaseClient
      .from("astrsk_data_store_nodes")
      .select("*")
      .eq("flow_id", flowId);

    if (dataStoreError) {
      return Result.fail(`Failed to fetch data store nodes: ${dataStoreError.message}`);
    }

    // Fetch if nodes for this flow
    const { data: ifNodesData, error: ifNodesError } = await supabaseClient
      .from("astrsk_if_nodes")
      .select("*")
      .eq("flow_id", flowId);

    if (ifNodesError) {
      return Result.fail(`Failed to fetch if nodes: ${ifNodesError.message}`);
    }

    return Result.ok({
      flow: flowData as FlowCloudData,
      agents: (agentsData ?? []) as AgentCloudData[],
      dataStoreNodes: (dataStoreNodesData ?? []) as DataStoreNodeCloudData[],
      ifNodes: (ifNodesData ?? []) as IfNodeCloudData[],
    });
  } catch (error) {
    return Result.fail(`Unexpected error fetching flow: ${error}`);
  }
}

/**
 * Fetch session from cloud by ID (with all related resources)
 */
export async function fetchSessionFromCloud(
  sessionId: string,
): Promise<Result<SessionCloudBundle>> {
  try {
    // Note: Supabase RLS handles access control (is_public or non-expired expiration_date)
    // Fetch session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("astrsk_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      return Result.fail(`Failed to fetch session: ${sessionError.message}`);
    }

    if (!sessionData) {
      return Result.fail("Session not found");
    }

    // Fetch characters belonging to this session
    const { data: charactersData, error: charactersError } = await supabaseClient
      .from("astrsk_characters")
      .select("*")
      .eq("session_id", sessionId);

    if (charactersError) {
      return Result.fail(`Failed to fetch characters: ${charactersError.message}`);
    }

    // Fetch scenarios belonging to this session
    const { data: scenariosData, error: scenariosError } = await supabaseClient
      .from("astrsk_scenarios")
      .select("*")
      .eq("session_id", sessionId);

    if (scenariosError) {
      return Result.fail(`Failed to fetch scenarios: ${scenariosError.message}`);
    }

    // Fetch assets belonging to this session
    const { data: assetsData, error: assetsError } = await supabaseClient
      .from("astrsk_assets")
      .select("*")
      .eq("session_id", sessionId);

    if (assetsError) {
      return Result.fail(`Failed to fetch assets: ${assetsError.message}`);
    }

    // Initialize flow-related data
    let flow: FlowCloudData | null = null;
    let agents: AgentCloudData[] = [];
    let dataStoreNodes: DataStoreNodeCloudData[] = [];
    let ifNodes: IfNodeCloudData[] = [];

    // Fetch flow if session has one
    if (sessionData.flow_id) {
      const { data: flowData, error: flowError } = await supabaseClient
        .from("astrsk_flows")
        .select("*")
        .eq("id", sessionData.flow_id)
        .single();

      if (flowError) {
        console.warn(`Failed to fetch flow ${sessionData.flow_id}: ${flowError.message}`);
      } else if (flowData) {
        flow = flowData as FlowCloudData;

        // Fetch agents for this flow
        const { data: agentsResult } = await supabaseClient
          .from("astrsk_agents")
          .select("*")
          .eq("flow_id", sessionData.flow_id);
        agents = (agentsResult ?? []) as AgentCloudData[];

        // Fetch data store nodes for this flow
        const { data: dataStoreResult } = await supabaseClient
          .from("astrsk_data_store_nodes")
          .select("*")
          .eq("flow_id", sessionData.flow_id);
        dataStoreNodes = (dataStoreResult ?? []) as DataStoreNodeCloudData[];

        // Fetch if nodes for this flow
        const { data: ifNodesResult } = await supabaseClient
          .from("astrsk_if_nodes")
          .select("*")
          .eq("flow_id", sessionData.flow_id);
        ifNodes = (ifNodesResult ?? []) as IfNodeCloudData[];
      }
    }

    return Result.ok({
      session: sessionData as SessionCloudData,
      characters: (charactersData ?? []) as CharacterCloudData[],
      scenarios: (scenariosData ?? []) as ScenarioCloudData[],
      flow,
      agents,
      dataStoreNodes,
      ifNodes,
      assets: (assetsData ?? []) as AssetCloudData[],
    });
  } catch (error) {
    return Result.fail(`Unexpected error fetching session: ${error}`);
  }
}

/**
 * Fetch asset by ID from cloud
 */
export async function fetchAssetFromCloud(
  assetId: string,
): Promise<Result<AssetCloudData>> {
  try {
    const { data, error } = await supabaseClient
      .from("astrsk_assets")
      .select("*")
      .eq("id", assetId)
      .single();

    if (error) {
      return Result.fail(`Failed to fetch asset: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Asset not found");
    }

    return Result.ok(data as AssetCloudData);
  } catch (error) {
    return Result.fail(`Unexpected error fetching asset: ${error}`);
  }
}

/**
 * Download asset file from Supabase Storage
 * @param assetId - Asset ID (used as folder name in storage)
 * @param fileName - File name within the asset folder
 * @returns Blob of the file
 */
export async function downloadAssetFile(
  assetId: string,
  fileName: string,
): Promise<Result<Blob>> {
  try {
    const storagePath = `${assetId}/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from(ASSETS_BUCKET)
      .download(storagePath);

    if (error) {
      return Result.fail(`Failed to download asset file: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Asset file not found");
    }

    return Result.ok(data);
  } catch (error) {
    return Result.fail(`Unexpected error downloading asset file: ${error}`);
  }
}

/**
 * Download asset file from URL (for public URLs)
 */
export async function downloadAssetFromUrl(
  url: string,
): Promise<Result<Blob>> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return Result.fail(`Failed to download asset: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    return Result.ok(blob);
  } catch (error) {
    return Result.fail(`Unexpected error downloading asset from URL: ${error}`);
  }
}
