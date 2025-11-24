import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import {
  SessionCloudData,
  CharacterCloudData,
  ScenarioCloudData,
  FlowCloudData,
  AgentCloudData,
  DataStoreNodeCloudData,
  IfNodeCloudData,
} from '@/shared/lib/cloud-upload-helpers';

import { Session } from '@/entities/session/domain';
import { LoadSessionRepo } from '@/entities/session/repos/load-session-repo';
import { SessionDrizzleMapper } from '@/entities/session/mappers/session-drizzle-mapper';
import { PrepareCharacterCloudData } from '@/entities/card/usecases/prepare-character-cloud-data';
import { PrepareScenarioCloudData } from '@/entities/card/usecases/prepare-scenario-cloud-data';
import { PrepareFlowCloudData } from '@/entities/flow/usecases/prepare-flow-cloud-data';
import { PrepareAgentsCloudData } from '@/entities/agent/usecases/prepare-agents-cloud-data';
import { PrepareDataStoreNodesCloudData } from '@/entities/data-store-node/usecases/prepare-data-store-nodes-cloud-data';
import { PrepareIfNodesCloudData } from '@/entities/if-node/usecases/prepare-if-nodes-cloud-data';

interface Command {
  sessionId: UniqueEntityID;
}

export interface SessionCloudDataBundle {
  session: SessionCloudData;
  characters: CharacterCloudData[];
  scenarios: ScenarioCloudData[];
  flow: FlowCloudData | null;
  agents: AgentCloudData[];
  dataStoreNodes: DataStoreNodeCloudData[];
  ifNodes: IfNodeCloudData[];
}

/**
 * Prepare session data and all its child resources for cloud upload
 * This includes: session, all cards (characters/scenarios), flow, and all flow nodes
 */
export class PrepareSessionCloudData
  implements UseCase<Command, Result<SessionCloudDataBundle>>
{
  constructor(
    private loadSessionRepo: LoadSessionRepo,
    private prepareCharacterData: PrepareCharacterCloudData,
    private prepareScenarioData: PrepareScenarioCloudData,
    private prepareFlowData: PrepareFlowCloudData,
    private prepareAgentsData: PrepareAgentsCloudData,
    private prepareDataStoreNodesData: PrepareDataStoreNodesCloudData,
    private prepareIfNodesData: PrepareIfNodesCloudData
  ) {}

  async execute({ sessionId }: Command): Promise<Result<SessionCloudDataBundle>> {
    try {
      // 1. Get session
      const sessionResult = await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionResult.isFailure) {
        return Result.fail<SessionCloudDataBundle>(sessionResult.getError());
      }

      const session = sessionResult.getValue();

      // 2. Use mapper to convert session domain → persistence format
      const persistenceData = SessionDrizzleMapper.toPersistence(session);

      // Extract only the fields we need (type-safe)
      const {
        id,
        title,
        name,
        all_cards,
        user_character_card_id,
        turn_ids,
        translation,
        chat_styles,
        flow_id,
        auto_reply,
        data_schema_order,
        widget_layout,
        tags,
        summary,
      } = persistenceData as any; // Cast only for extraction

      // 3. Build session cloud data with asset ID references (asset upload happens later)
      const sessionData: SessionCloudData = {
        id,
        title,
        name,
        all_cards,
        user_character_card_id,
        turn_ids,
        background_id: session.props.backgroundId?.toString() || null, // Use cloned asset ID
        cover_id: session.props.coverId?.toString() || null, // Use cloned asset ID
        translation,
        chat_styles,
        flow_id,
        auto_reply,
        data_schema_order,
        widget_layout,
        tags,
        summary,
        is_public: false,
        owner_id: null,
        created_at: session.props.createdAt.toISOString(),
        updated_at:
          session.props.updatedAt?.toISOString() || new Date().toISOString(),
      };

      // 4. Prepare all characters in this session
      const characters: CharacterCloudData[] = [];
      for (const card of session.props.allCards) {
        if (card.type === 'character') {
          const characterDataResult = await this.prepareCharacterData.execute({
            cardId: card.id,
            sessionId: sessionId, // Mark as belonging to this session
          });
          if (characterDataResult.isSuccess) {
            characters.push(characterDataResult.getValue());
          }
        }
      }

      // 5. Prepare all scenarios in this session
      // Note: Legacy 'plot' cards are automatically migrated to 'scenario' during export
      const scenarios: ScenarioCloudData[] = [];
      console.log(`Session has ${session.props.allCards.length} total cards`);
      console.log(`Card types:`, session.props.allCards.map(c => `${c.id.toString()}: ${c.type}`));
      for (const card of session.props.allCards) {
        if (card.type === 'scenario' || card.type === 'plot') {
          const cardType = card.type === 'plot' ? 'plot (migrating to scenario)' : 'scenario';
          console.log(`Preparing scenario data for card ${card.id.toString()} (type: ${cardType})`);
          const scenarioDataResult = await this.prepareScenarioData.execute({
            cardId: card.id,
            sessionId: sessionId, // Mark as belonging to this session
          });
          if (scenarioDataResult.isSuccess) {
            scenarios.push(scenarioDataResult.getValue());
            console.log(`Successfully prepared scenario: ${scenarioDataResult.getValue().title}`);
            if (card.type === 'plot') {
              console.log(`✓ Migrated plot card → scenario card during export`);
            }
          } else {
            console.error(`Failed to prepare scenario ${card.id.toString()}:`, scenarioDataResult.getError());
          }
        }
      }
      console.log(`Total scenarios prepared: ${scenarios.length}`);

      // 6. Prepare flow and all its nodes if session has a flow
      let flowData: FlowCloudData | null = null;
      let agents: AgentCloudData[] = [];
      let dataStoreNodes: DataStoreNodeCloudData[] = [];
      let ifNodes: IfNodeCloudData[] = [];

      if (session.props.flowId) {
        const flowDataResult = await this.prepareFlowData.execute({
          flowId: session.props.flowId,
          sessionId: sessionId, // Mark as belonging to this session
        });
        if (flowDataResult.isSuccess) {
          flowData = flowDataResult.getValue();

          // Prepare all agents for this flow
          const agentsDataResult = await this.prepareAgentsData.execute({
            flowId: session.props.flowId,
          });
          if (agentsDataResult.isSuccess) {
            agents = agentsDataResult.getValue();
          }

          // Prepare all data store nodes for this flow
          const dataStoreNodesDataResult = await this.prepareDataStoreNodesData.execute({
            flowId: session.props.flowId,
          });
          if (dataStoreNodesDataResult.isSuccess) {
            dataStoreNodes = dataStoreNodesDataResult.getValue();
          }

          // Prepare all if nodes for this flow
          const ifNodesDataResult = await this.prepareIfNodesData.execute({
            flowId: session.props.flowId,
          });
          if (ifNodesDataResult.isSuccess) {
            ifNodes = ifNodesDataResult.getValue();
          }
        }
      }

      // 8. Return complete bundle
      return Result.ok<SessionCloudDataBundle>({
        session: sessionData,
        characters,
        scenarios,
        flow: flowData,
        agents,
        dataStoreNodes,
        ifNodes,
      });
    } catch (error) {
      return Result.fail<SessionCloudDataBundle>(
        `Unexpected error preparing session data: ${error}`
      );
    }
  }
}
