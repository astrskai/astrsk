import { ApiService, CardService } from "@/app/services";
import { AgentService } from "@/app/services/agent-service";
import { AssetService } from "@/app/services/asset-service";
import { BackgroundService } from "@/app/services/background-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { VibeSessionService } from "@/app/services/vibe-session-service";

export async function initServices(): Promise<void> {
  // Common
  AssetService.init();

  // API
  ApiService.init();

  // Agent
  AgentService.init();

  // Node Data Services
  DataStoreNodeService.init();
  IfNodeService.init();

  // Vibe Session Service
  VibeSessionService.init();

  // Flow
  FlowService.init(
    AgentService.agentRepo,
    AgentService.agentRepo,
    AgentService.agentRepo,
  );

  // Card
  CardService.init(
    AssetService.assetRepo,
    AssetService.saveFileToAsset,
    AssetService.cloneAsset,
  );

  // Session
  TurnService.init();
  BackgroundService.init(
    AssetService.saveFileToAsset,
    AssetService.deleteAsset,
  );
  GeneratedImageService.init(
    AssetService.saveFileToAsset,
    AssetService.deleteAsset,
  );
  SessionService.init(
    TurnService.turnRepo,
    CardService.getCard,
    FlowService.exportFlowWithNodes,
    CardService.exportCardToFile,
    BackgroundService.getBackground,
    AssetService.getAsset,
    TurnService.getTurn,
    FlowService.importFlowWithNodes,
    CardService.importCardFromFile,
    BackgroundService.saveFileToBackground,
    FlowService.flowRepo,
    FlowService.getModelsFromFlowFile,
  );
}
