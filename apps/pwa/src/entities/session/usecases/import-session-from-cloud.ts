import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import {
  fetchSessionFromCloud,
  fetchAssetFromCloud,
  downloadAssetFromUrl,
  getStorageUrl,
  type SessionCloudBundle,
  type AssetCloudData,
} from "@/shared/lib/cloud-download-helpers";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
import { CharacterCard, ScenarioCard, CardType } from "@/entities/card/domain";
import { SaveCardRepo } from "@/entities/card/repos";
import { CardSupabaseMapper } from "@/entities/card/mappers/card-supabase-mapper";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { FlowSupabaseMapper } from "@/entities/flow/mappers/flow-supabase-mapper";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { AgentSupabaseMapper } from "@/entities/agent/mappers/agent-supabase-mapper";
import { SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { DataStoreNodeSupabaseMapper } from "@/entities/data-store-node/mappers/data-store-node-supabase-mapper";
import { SaveIfNodeRepo } from "@/entities/if-node/repos";
import { IfNodeSupabaseMapper } from "@/entities/if-node/mappers/if-node-supabase-mapper";
import { Session } from "@/entities/session/domain";
import { SaveSessionRepo } from "@/entities/session/repos";

interface Command {
  sessionId: string;
  agentModelOverrides?: Map<
    string,
    {
      apiSource: string;
      modelId: string;
      modelName: string;
    }
  >;
}

/**
 * Import a session from cloud storage by ID
 *
 * This usecase:
 * 1. Fetches session data and all related resources from Supabase (checking expiration_date)
 * 2. Downloads all assets (icons, backgrounds)
 * 3. Creates new local entities with new IDs for all resources
 * 4. Remaps all references to use new IDs
 * 5. Saves everything to local database
 */
export class ImportSessionFromCloud implements UseCase<Command, Result<Session>> {
  constructor(
    private saveSessionRepo: SaveSessionRepo,
    private saveCardRepo: SaveCardRepo,
    private saveFlowRepo: SaveFlowRepo,
    private saveAgentRepo: SaveAgentRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    private saveIfNodeRepo: SaveIfNodeRepo,
    private saveFileToAsset: SaveFileToAsset,
    private saveFileToBackground: SaveFileToBackground,
  ) {}

  private async importAsset(
    assetId: string | null,
    assetsData: AssetCloudData[],
  ): Promise<UniqueEntityID | undefined> {
    if (!assetId) {
      return undefined;
    }

    try {
      console.log(`[importAsset] Starting import for asset: ${assetId}`);

      // Find asset in the fetched data
      let assetData = assetsData.find((a) => a.id === assetId);

      // If not in session assets, fetch it directly
      if (!assetData) {
        console.log(`[importAsset] Asset not in bundle, fetching from cloud...`);
        const assetResult = await fetchAssetFromCloud(assetId);
        if (assetResult.isFailure) {
          console.warn(`[importAsset] Failed to fetch asset ${assetId}: ${assetResult.getError()}`);
          return undefined;
        }
        assetData = assetResult.getValue();
      }

      console.log(`[importAsset] Asset metadata:`, {
        id: assetData.id,
        name: assetData.name,
        file_path: assetData.file_path,
        mime_type: assetData.mime_type,
      });

      // Construct full URL from file_path and download
      const fullUrl = getStorageUrl(assetData.file_path);
      console.log(`[importAsset] Converted file_path to full URL: ${fullUrl}`);

      const blobResult = await downloadAssetFromUrl(fullUrl);
      if (blobResult.isFailure) {
        console.warn(`[importAsset] Failed to download asset file: ${blobResult.getError()}`);
        return undefined;
      }

      const blob = blobResult.getValue();
      console.log(`[importAsset] Downloaded blob: size=${blob.size}, type=${blob.type}`);

      // Convert blob to File
      const file = new File([blob], assetData.name, {
        type: assetData.mime_type,
      });

      // Save to local storage
      const savedAssetResult = await this.saveFileToAsset.execute({ file });
      if (savedAssetResult.isFailure) {
        console.warn(`[importAsset] Failed to save asset locally: ${savedAssetResult.getError()}`);
        return undefined;
      }

      const savedAsset = savedAssetResult.getValue();
      console.log(`[importAsset] ✓ Asset saved successfully:`, {
        newAssetId: savedAsset.id.toString(),
        localFilePath: savedAsset.filePath,
        name: savedAsset.name,
        sizeByte: savedAsset.sizeByte,
      });

      return savedAsset.id;
    } catch (error) {
      console.warn(`[importAsset] Error importing asset ${assetId}: ${error}`);
      return undefined;
    }
  }

  private async importFlow(
    bundle: SessionCloudBundle,
    sessionId: UniqueEntityID,
    agentModelOverrides?: Command["agentModelOverrides"],
  ): Promise<{ flowId: UniqueEntityID | undefined; nodeIdMap: Map<string, string> }> {
    const nodeIdMap = new Map<string, string>();

    if (!bundle.flow) {
      return { flowId: undefined, nodeIdMap };
    }

    const flowData = bundle.flow;
    const newFlowId = new UniqueEntityID();

    // Debug logging to understand ID mappings
    console.log(`[importFlow] Flow nodes:`, (flowData.nodes as any[]).map((n: any) => ({ id: n.id, type: n.type })));
    console.log(`[importFlow] Bundle agents:`, bundle.agents.map((a) => ({ id: a.id, name: a.name })));
    console.log(`[importFlow] Bundle data store nodes:`, bundle.dataStoreNodes.map((n) => ({ id: n.id, name: n.name })));
    console.log(`[importFlow] Bundle if nodes:`, bundle.ifNodes.map((n) => ({ id: n.id, name: n.name })));

    // Create ID mappings using mapper helper
    const nodeIdMapResult = FlowSupabaseMapper.createNodeIdMap(
      flowData.nodes as any[],
      bundle.agents.map((a) => a.id),
      bundle.dataStoreNodes.map((n) => n.id),
      bundle.ifNodes.map((n) => n.id),
    );

    console.log(`[importFlow] Node ID map entries:`);
    nodeIdMapResult.forEach((newId, oldId) => {
      console.log(`  ${oldId} -> ${newId}`);
    });

    // Copy to our local map
    nodeIdMapResult.forEach((value, key) => nodeIdMap.set(key, value));

    // Create flow using mapper
    const flowResult = FlowSupabaseMapper.fromCloud(
      flowData,
      nodeIdMap,
      newFlowId.toString(),
      sessionId,
    );

    if (flowResult.isFailure) {
      console.error(`Failed to create flow: ${flowResult.getError()}`);
      return { flowId: undefined, nodeIdMap };
    }

    const savedFlowResult = await this.saveFlowRepo.saveFlow(flowResult.getValue());
    if (savedFlowResult.isFailure) {
      console.error(`Failed to save flow: ${savedFlowResult.getError()}`);
      return { flowId: undefined, nodeIdMap };
    }

    // Save agents using mapper
    for (const agentData of bundle.agents) {
      const newNodeId = nodeIdMap.get(agentData.id);
      if (!newNodeId) {
        console.warn(`[importFlow] No node ID mapping found for agent: ${agentData.id}`);
        continue;
      }

      console.log(`[importFlow] Creating agent from cloud data:`, {
        originalId: agentData.id,
        newNodeId,
        newFlowId: newFlowId.toString(),
        name: agentData.name,
      });

      try {
        const modelOverride = agentModelOverrides?.get(agentData.id);

        const agentResult = AgentSupabaseMapper.fromCloud(
          agentData,
          newFlowId.toString(),
          newNodeId,
          modelOverride,
        );

        if (agentResult.isFailure) {
          console.error(`[importFlow] Failed to create agent ${agentData.id}: ${agentResult.getError()}`);
          continue;
        }

        const savedAgentResult = await this.saveAgentRepo.saveAgent(agentResult.getValue());
        if (savedAgentResult.isFailure) {
          console.error(`[importFlow] Failed to save agent ${agentData.id}: ${savedAgentResult.getError()}`);
        } else {
          console.log(`[importFlow] ✓ Agent saved successfully: ${savedAgentResult.getValue().id.toString()}`);
        }
      } catch (error) {
        console.error(`[importFlow] Failed to create agent from cloud data: ${error}`);
      }
    }

    // Save data store nodes using mapper
    for (const nodeData of bundle.dataStoreNodes) {
      const newNodeId = nodeIdMap.get(nodeData.id);
      if (!newNodeId) {
        console.warn(`[importFlow] No node ID mapping found for data store node: ${nodeData.id}`);
        continue;
      }

      console.log(`[importFlow] Creating data store node from cloud data:`, {
        originalId: nodeData.id,
        newNodeId,
        newFlowId: newFlowId.toString(),
        name: nodeData.name,
        fieldsCount: nodeData.data_store_fields?.length ?? 0,
      });

      try {
        const nodeResult = DataStoreNodeSupabaseMapper.fromCloud(
          nodeData,
          newFlowId.toString(),
          newNodeId,
        );

        if (nodeResult.isFailure) {
          console.error(`[importFlow] Failed to create data store node ${nodeData.id}: ${nodeResult.getError()}`);
          continue;
        }

        const savedNodeResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(nodeResult.getValue());
        if (savedNodeResult.isFailure) {
          console.error(`[importFlow] Failed to save data store node ${nodeData.id}: ${savedNodeResult.getError()}`);
        } else {
          console.log(`[importFlow] ✓ Data store node saved successfully: ${savedNodeResult.getValue().id.toString()}`);
        }
      } catch (error) {
        console.error(`[importFlow] Failed to create data store node from cloud data: ${error}`);
      }
    }

    // Save if nodes using mapper
    for (const nodeData of bundle.ifNodes) {
      const newNodeId = nodeIdMap.get(nodeData.id);
      if (!newNodeId) {
        console.warn(`[importFlow] No node ID mapping found for if node: ${nodeData.id}`);
        continue;
      }

      console.log(`[importFlow] Creating if node from cloud data:`, {
        originalId: nodeData.id,
        newNodeId,
        newFlowId: newFlowId.toString(),
        name: nodeData.name,
      });

      try {
        const nodeResult = IfNodeSupabaseMapper.fromCloud(
          nodeData,
          newFlowId.toString(),
          newNodeId,
        );

        if (nodeResult.isFailure) {
          console.error(`[importFlow] Failed to create if node ${nodeData.id}: ${nodeResult.getError()}`);
          continue;
        }

        const savedNodeResult = await this.saveIfNodeRepo.saveIfNode(nodeResult.getValue());
        if (savedNodeResult.isFailure) {
          console.error(`[importFlow] Failed to save if node ${nodeData.id}: ${savedNodeResult.getError()}`);
        } else {
          console.log(`[importFlow] ✓ If node saved successfully: ${savedNodeResult.getValue().id.toString()}`);
        }
      } catch (error) {
        console.error(`[importFlow] Failed to create if node from cloud data: ${error}`);
      }
    }

    return { flowId: newFlowId, nodeIdMap };
  }

  async execute({
    sessionId,
    agentModelOverrides,
  }: Command): Promise<Result<Session>> {
    try {
      // 1. Fetch session and all related resources from cloud
      const fetchResult = await fetchSessionFromCloud(sessionId);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      const bundle = fetchResult.getValue();
      const sessionData = bundle.session;

      // 2. Create new session ID
      const newSessionId = new UniqueEntityID();

      // 3. Create session FIRST (required for foreign key constraints on cards, flows, etc.)
      // We'll create a minimal session now and update it later with all references
      const initialSessionResult = Session.create(
        {
          title: sessionData.title,
          name: sessionData.name ?? undefined,
          tags: sessionData.tags ?? [],
          summary: sessionData.summary ?? undefined,
          allCards: [], // Will be updated later
          turnIds: [], // Turns are not imported - start fresh
          chatStyles: sessionData.chat_styles ?? undefined,
          dataSchemaOrder: sessionData.data_schema_order ?? [],
          widgetLayout: sessionData.widget_layout ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        newSessionId,
      );

      if (initialSessionResult.isFailure) {
        return Result.fail(initialSessionResult.getError());
      }

      const savedInitialSessionResult = await this.saveSessionRepo.saveSession(
        initialSessionResult.getValue(),
      );
      if (savedInitialSessionResult.isFailure) {
        return Result.fail(savedInitialSessionResult.getError());
      }

      // 4. Create ID mappings for cards
      const cardIdMap = new Map<string, UniqueEntityID>();

      // 5. Import characters using mapper
      for (const characterData of bundle.characters) {
        const iconAssetId = await this.importAsset(
          characterData.icon_asset_id,
          bundle.assets,
        );

        const cardResult = CardSupabaseMapper.characterFromCloud(
          characterData,
          iconAssetId,
          newSessionId,
        );

        if (cardResult.isFailure) {
          console.error(`[ImportSession] Failed to create character ${characterData.id}:`, cardResult.getError());
          continue;
        }

        const card = cardResult.getValue();
        const tokenCount = CharacterCard.calculateTokenSize(
          card.props,
          getTokenizer(),
        );
        card.update({ tokenCount });

        const savedCardResult = await this.saveCardRepo.saveCard(card);
        if (savedCardResult.isFailure) {
          console.error(`[ImportSession] Failed to save character ${characterData.id}:`, savedCardResult.getError());
        } else {
          cardIdMap.set(characterData.id, savedCardResult.getValue().id);
        }
      }

      // 6. Import scenarios using mapper
      for (const scenarioData of bundle.scenarios) {
        const iconAssetId = await this.importAsset(
          scenarioData.icon_asset_id,
          bundle.assets,
        );

        const cardResult = CardSupabaseMapper.scenarioFromCloud(
          scenarioData,
          iconAssetId,
          newSessionId,
        );

        if (cardResult.isFailure) {
          console.error(`[ImportSession] Failed to create scenario ${scenarioData.id}:`, cardResult.getError());
          continue;
        }

        const card = cardResult.getValue();
        const tokenCount = ScenarioCard.calculateTokenSize(
          card.props,
          getTokenizer(),
        );
        card.update({ tokenCount });

        const savedCardResult = await this.saveCardRepo.saveCard(card);
        if (savedCardResult.isFailure) {
          console.error(`[ImportSession] Failed to save scenario ${scenarioData.id}:`, savedCardResult.getError());
        } else {
          cardIdMap.set(scenarioData.id, savedCardResult.getValue().id);
        }
      }

      // 7. Import background
      let backgroundId: UniqueEntityID | undefined;
      if (sessionData.background_id) {
        console.log(`[ImportSession] Importing background: ${sessionData.background_id}`);

        // Try to find in bundle first
        let bgAssetData = bundle.assets.find((a) => a.id === sessionData.background_id);

        // If not in bundle, fetch directly from cloud
        if (!bgAssetData) {
          console.log(`[ImportSession] Background not in bundle, fetching from cloud...`);
          const bgAssetResult = await fetchAssetFromCloud(sessionData.background_id);
          if (bgAssetResult.isSuccess) {
            bgAssetData = bgAssetResult.getValue();
          } else {
            console.warn(`[ImportSession] Failed to fetch background asset: ${bgAssetResult.getError()}`);
          }
        }

        if (bgAssetData) {
          const bgFullUrl = getStorageUrl(bgAssetData.file_path);
          console.log(`[ImportSession] Downloading background from: ${bgFullUrl}`);
          const blobResult = await downloadAssetFromUrl(bgFullUrl);
          if (blobResult.isSuccess) {
            const file = new File([blobResult.getValue()], bgAssetData.name, {
              type: bgAssetData.mime_type,
            });
            const bgResult = await this.saveFileToBackground.execute({
              file,
              sessionId: newSessionId,
            });
            if (bgResult.isSuccess) {
              backgroundId = bgResult.getValue().id;
              console.log(`[ImportSession] ✓ Background saved successfully: ${backgroundId.toString()}`);
            } else {
              console.warn(`[ImportSession] Failed to save background: ${bgResult.getError()}`);
            }
          } else {
            console.warn(`[ImportSession] Failed to download background: ${blobResult.getError()}`);
          }
        } else {
          console.warn(`[ImportSession] Background asset not found: ${sessionData.background_id}`);
        }
      }

      // 8. Import cover (as asset)
      let coverId: UniqueEntityID | undefined;
      if (sessionData.cover_id) {
        coverId = await this.importAsset(sessionData.cover_id, bundle.assets);
      }

      // 9. Import flow (session already exists, so foreign key constraint is satisfied)
      const { flowId } = await this.importFlow(bundle, newSessionId, agentModelOverrides);

      // 10. Update session with all references (cards, flow, background, cover)
      const finalSessionResult = Session.create(
        {
          title: sessionData.title,
          name: sessionData.name ?? undefined,
          tags: sessionData.tags ?? [],
          summary: sessionData.summary ?? undefined,
          allCards: (sessionData.all_cards as any[] ?? [])
            .map((cardJson: any) => {
              const newCardId = cardIdMap.get(cardJson.id);
              if (!newCardId) {
                console.warn(`Card ID ${cardJson.id} not found in imported cards`);
                return null;
              }
              return {
                id: newCardId,
                type: cardJson.type as CardType,
                enabled: cardJson.enabled,
              };
            })
            .filter(Boolean) as any,
          userCharacterCardId: sessionData.user_character_card_id
            ? cardIdMap.get(sessionData.user_character_card_id)
            : undefined,
          turnIds: [], // Turns are not imported - start fresh
          backgroundId,
          coverId,
          flowId,
          chatStyles: sessionData.chat_styles ?? undefined,
          dataSchemaOrder: sessionData.data_schema_order ?? [],
          widgetLayout: sessionData.widget_layout ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        newSessionId,
      );

      if (finalSessionResult.isFailure) {
        return Result.fail(finalSessionResult.getError());
      }

      // 11. Save updated session
      const savedSessionResult = await this.saveSessionRepo.saveSession(finalSessionResult.getValue());
      if (savedSessionResult.isFailure) {
        return Result.fail(savedSessionResult.getError());
      }

      return Result.ok(savedSessionResult.getValue());
    } catch (error) {
      return formatFail("Failed to import session from cloud", error);
    }
  }
}
