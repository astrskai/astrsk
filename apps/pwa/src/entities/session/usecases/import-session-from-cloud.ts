import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import {
  fetchSessionFromCloud,
  fetchAssetFromCloud,
  downloadAssetFromUrl,
  type SessionCloudBundle,
  type CharacterCloudData,
  type ScenarioCloudData,
  type AssetCloudData,
} from "@/shared/lib/cloud-download-helpers";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
import { CharacterCard, ScenarioCard, Lorebook, CardType } from "@/entities/card/domain";
import { SaveCardRepo } from "@/entities/card/repos";
import { Flow } from "@/entities/flow/domain/flow";
import { SaveFlowRepo } from "@/entities/flow/repos/save-flow-repo";
import { Agent } from "@/entities/agent/domain";
import { SaveAgentRepo } from "@/entities/agent/repos";
import { DataStoreNode } from "@/entities/data-store-node/domain";
import { SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { IfNode } from "@/entities/if-node/domain";
import { SaveIfNodeRepo } from "@/entities/if-node/repos";
import { Session } from "@/entities/session/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { SaveSessionRepo } from "@/entities/session/repos";
import { NodeType } from "@/entities/flow/model/node-types";
import { AutoReply } from "@/shared/stores/session-store";

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
      // Find asset in the fetched data
      let assetData = assetsData.find((a) => a.id === assetId);

      // If not in session assets, fetch it directly
      if (!assetData) {
        const assetResult = await fetchAssetFromCloud(assetId);
        if (assetResult.isFailure) {
          console.warn(`Failed to fetch asset ${assetId}: ${assetResult.getError()}`);
          return undefined;
        }
        assetData = assetResult.getValue();
      }

      // Download asset file from URL
      const blobResult = await downloadAssetFromUrl(assetData.file_path);
      if (blobResult.isFailure) {
        console.warn(`Failed to download asset file: ${blobResult.getError()}`);
        return undefined;
      }

      // Convert blob to File
      const file = new File([blobResult.getValue()], assetData.name, {
        type: assetData.mime_type,
      });

      // Save to local storage
      const savedAssetResult = await this.saveFileToAsset.execute({ file });
      if (savedAssetResult.isFailure) {
        console.warn(`Failed to save asset locally: ${savedAssetResult.getError()}`);
        return undefined;
      }

      return savedAssetResult.getValue().id;
    } catch (error) {
      console.warn(`Error importing asset ${assetId}: ${error}`);
      return undefined;
    }
  }

  private async importCharacterCard(
    data: CharacterCloudData,
    iconAssetId: UniqueEntityID | undefined,
    sessionId: UniqueEntityID,
  ): Promise<Result<CharacterCard>> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    const cardResult = CharacterCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Character,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        description: data.description ?? undefined,
        exampleDialogue: data.example_dialogue ?? undefined,
        lorebook,
        sessionId, // Session-local card
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Generate new ID
    );

    if (cardResult.isFailure) {
      return Result.fail(cardResult.getError());
    }

    const card = cardResult.getValue();
    const tokenCount = CharacterCard.calculateTokenSize(
      card.props,
      await getTokenizer(),
    );
    card.update({ tokenCount });

    return Result.ok(card);
  }

  private async importScenarioCard(
    data: ScenarioCloudData,
    iconAssetId: UniqueEntityID | undefined,
    sessionId: UniqueEntityID,
  ): Promise<Result<ScenarioCard>> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    const cardResult = ScenarioCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Scenario,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        description: data.description ?? undefined,
        firstMessages: data.first_messages ?? [],
        lorebook,
        sessionId, // Session-local card
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Generate new ID
    );

    if (cardResult.isFailure) {
      return Result.fail(cardResult.getError());
    }

    const card = cardResult.getValue();
    const tokenCount = ScenarioCard.calculateTokenSize(
      card.props,
      await getTokenizer(),
    );
    card.update({ tokenCount });

    return Result.ok(card);
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

    // Create ID mappings for all nodes
    for (const agent of bundle.agents) {
      const newNodeId = new UniqueEntityID().toString();
      nodeIdMap.set(agent.id, newNodeId);
    }

    for (const node of bundle.dataStoreNodes) {
      const newNodeId = new UniqueEntityID().toString();
      nodeIdMap.set(node.id, newNodeId);
    }

    for (const node of bundle.ifNodes) {
      const newNodeId = new UniqueEntityID().toString();
      nodeIdMap.set(node.id, newNodeId);
    }

    // Map special nodes
    const flowNodes = flowData.nodes as any[];
    for (const node of flowNodes) {
      if (!nodeIdMap.has(node.id)) {
        if (node.type === NodeType.START || node.type === NodeType.END) {
          nodeIdMap.set(node.id, node.id);
        } else {
          nodeIdMap.set(node.id, new UniqueEntityID().toString());
        }
      }
    }

    // Remap flow nodes
    const newNodes = flowNodes.map((node: any) => {
      const newId = nodeIdMap.get(node.id) || node.id;
      let nodeData = {};

      if (node.type === NodeType.DATA_STORE && node.data?.flowId) {
        nodeData = { flowId: newFlowId.toString() };
      }

      return {
        ...node,
        id: newId,
        data: nodeData,
      };
    });

    // Remap edges
    const newEdges = (flowData.edges as any[]).map((edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      const newEdgeId = new UniqueEntityID().toString();

      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });

    // Create and save flow
    const flowResult = Flow.create(
      {
        name: flowData.name,
        description: flowData.description,
        nodes: newNodes,
        edges: newEdges,
        responseTemplate: flowData.response_template,
        dataStoreSchema: flowData.data_store_schema,
        sessionId, // UniqueEntityID
        tags: flowData.tags ?? [],
        summary: flowData.summary ?? undefined,
        version: flowData.version ?? undefined,
        conceptualOrigin: flowData.conceptual_origin ?? undefined,
      },
      newFlowId,
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

    // Save agents
    for (const agentData of bundle.agents) {
      const newNodeId = nodeIdMap.get(agentData.id);
      if (!newNodeId) continue;

      const modelOverride = agentModelOverrides?.get(agentData.id);
      const agentJson = {
        name: agentData.name,
        description: agentData.description,
        targetApiType: agentData.target_api_type,
        apiSource: modelOverride?.apiSource ?? agentData.api_source,
        modelId: modelOverride?.modelId ?? agentData.model_id,
        modelName: modelOverride?.modelName ?? agentData.model_name,
        modelTier: agentData.model_tier,
        promptMessages:
          typeof agentData.prompt_messages === "string"
            ? JSON.parse(agentData.prompt_messages)
            : agentData.prompt_messages,
        textPrompt: agentData.text_prompt,
        enabledParameters: agentData.enabled_parameters,
        parameterValues: agentData.parameter_values,
        enabledStructuredOutput: agentData.enabled_structured_output,
        outputFormat: agentData.output_format,
        outputStreaming: agentData.output_streaming,
        schemaName: agentData.schema_name,
        schemaDescription: agentData.schema_description,
        schemaFields: agentData.schema_fields,
        tokenCount: agentData.token_count,
        color: agentData.color,
        flowId: newFlowId.toString(),
      };

      const agentResult = Agent.fromJSON(agentJson);
      if (agentResult.isSuccess) {
        const agentWithNewId = Agent.create(
          agentResult.getValue().props,
          new UniqueEntityID(newNodeId),
        );
        if (agentWithNewId.isSuccess) {
          await this.saveAgentRepo.saveAgent(agentWithNewId.getValue());
        }
      }
    }

    // Save data store nodes
    for (const nodeData of bundle.dataStoreNodes) {
      const newNodeId = nodeIdMap.get(nodeData.id);
      if (!newNodeId) continue;

      const nodeResult = DataStoreNode.create(
        {
          flowId: newFlowId.toString(),
          name: nodeData.name,
          color: nodeData.color,
          dataStoreFields: nodeData.data_store_fields ?? [],
        },
        new UniqueEntityID(newNodeId),
      );

      if (nodeResult.isSuccess) {
        await this.saveDataStoreNodeRepo.saveDataStoreNode(nodeResult.getValue());
      }
    }

    // Save if nodes
    for (const nodeData of bundle.ifNodes) {
      const newNodeId = nodeIdMap.get(nodeData.id);
      if (!newNodeId) continue;

      // Convert cloud logicOperator (lowercase) to domain format (uppercase)
      const logicOperator = (nodeData.logicOperator?.toUpperCase() ?? "AND") as "AND" | "OR";

      const nodeResult = IfNode.create(
        {
          flowId: newFlowId.toString(),
          name: nodeData.name,
          color: nodeData.color,
          logicOperator,
          conditions: nodeData.conditions ?? [],
        },
        new UniqueEntityID(newNodeId),
      );

      if (nodeResult.isSuccess) {
        await this.saveIfNodeRepo.saveIfNode(nodeResult.getValue());
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

      // 3. Create initial session (without references - so it exists in DB for FK constraints)
      let translationConfig;
      if (sessionData.translation) {
        const translationResult = TranslationConfig.fromJSON(sessionData.translation);
        if (translationResult.isSuccess) {
          translationConfig = translationResult.getValue();
        }
      }

      const sessionResult = Session.create(
        {
          title: sessionData.title,
          name: sessionData.name ?? undefined,
          tags: sessionData.tags ?? [],
          summary: sessionData.summary ?? undefined,
          allCards: [],
          turnIds: [],
          translation: translationConfig,
          chatStyles: sessionData.chat_styles ?? undefined,
          autoReply: (sessionData.auto_reply as AutoReply) ?? AutoReply.Off,
          dataSchemaOrder: sessionData.data_schema_order ?? [],
          widgetLayout: sessionData.widget_layout ?? undefined,
        },
        newSessionId,
      );

      if (sessionResult.isFailure) {
        return Result.fail(sessionResult.getError());
      }

      let session = sessionResult.getValue();

      // Save session first (so FK constraints work)
      const savedSessionResult = await this.saveSessionRepo.saveSession(session);
      if (savedSessionResult.isFailure) {
        return Result.fail(savedSessionResult.getError());
      }
      session = savedSessionResult.getValue();

      // 4. Create ID mappings
      const cardIdMap = new Map<string, string>();

      // 5. Import characters
      for (const characterData of bundle.characters) {
        const iconAssetId = await this.importAsset(
          characterData.icon_asset_id,
          bundle.assets,
        );

        const cardResult = await this.importCharacterCard(
          characterData,
          iconAssetId,
          newSessionId,
        );

        if (cardResult.isSuccess) {
          const savedCardResult = await this.saveCardRepo.saveCard(cardResult.getValue());
          if (savedCardResult.isSuccess) {
            cardIdMap.set(characterData.id, savedCardResult.getValue().id.toString());
          }
        }
      }

      // 6. Import scenarios
      for (const scenarioData of bundle.scenarios) {
        const iconAssetId = await this.importAsset(
          scenarioData.icon_asset_id,
          bundle.assets,
        );

        const cardResult = await this.importScenarioCard(
          scenarioData,
          iconAssetId,
          newSessionId,
        );

        if (cardResult.isSuccess) {
          const savedCardResult = await this.saveCardRepo.saveCard(cardResult.getValue());
          if (savedCardResult.isSuccess) {
            cardIdMap.set(scenarioData.id, savedCardResult.getValue().id.toString());
          }
        }
      }

      // 7. Import background
      let backgroundId: UniqueEntityID | undefined;
      if (sessionData.background_id) {
        const bgAssetData = bundle.assets.find((a) => a.id === sessionData.background_id);
        if (bgAssetData) {
          const blobResult = await downloadAssetFromUrl(bgAssetData.file_path);
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
            }
          }
        }
      }

      // 8. Import cover (as asset)
      let coverId: UniqueEntityID | undefined;
      if (sessionData.cover_id) {
        coverId = await this.importAsset(sessionData.cover_id, bundle.assets);
      }

      // 9. Import flow
      const { flowId } = await this.importFlow(bundle, newSessionId, agentModelOverrides);

      // 10. Remap card references in session
      const allCardsData = sessionData.all_cards as any[] | null;
      const remappedCards = (allCardsData ?? [])
        .map((cardJson: any) => {
          const newCardId = cardIdMap.get(cardJson.id);
          if (!newCardId) {
            console.warn(`Card ID ${cardJson.id} not found in imported cards`);
            return null;
          }
          return {
            id: new UniqueEntityID(newCardId),
            type: cardJson.type as CardType,
            enabled: cardJson.enabled,
          };
        })
        .filter(Boolean);

      let userCharacterCardId: UniqueEntityID | undefined;
      if (sessionData.user_character_card_id) {
        const newUserId = cardIdMap.get(sessionData.user_character_card_id);
        if (newUserId) {
          userCharacterCardId = new UniqueEntityID(newUserId);
        }
      }

      // 11. Update session with all imported references
      const updateResult = session.update({
        allCards: remappedCards as any,
        userCharacterCardId,
        backgroundId,
        coverId,
        flowId,
      });

      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      // 12. Save final session
      const finalSaveResult = await this.saveSessionRepo.saveSession(session);
      if (finalSaveResult.isFailure) {
        return Result.fail(finalSaveResult.getError());
      }

      return Result.ok(finalSaveResult.getValue());
    } catch (error) {
      return formatFail("Failed to import session from cloud", error);
    }
  }
}
