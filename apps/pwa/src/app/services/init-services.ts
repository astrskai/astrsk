import { ApiService, CardService } from "@/app/services";
import { AgentService } from "@/app/services/agent-service";
import { AssetService } from "@/app/services/asset-service";
import { BackgroundService } from "@/app/services/background-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";

export async function initServices(): Promise<void> {
  // Common
  AssetService.init();

  // API
  ApiService.init();

  // Agent
  AgentService.init();

  // Flow
  FlowService.init(
    AgentService.agentRepo,
    AgentService.agentRepo,
    AgentService.agentRepo,
  );

  // Card
  CardService.init(
    AssetService.assetRepo,
    AssetService.deleteAsset,
    AssetService.saveFileToAsset,
    AssetService.cloneAsset,
  );

  // Session
  TurnService.init();
  BackgroundService.init(
    AssetService.saveFileToAsset,
    AssetService.deleteAsset,
  );
  SessionService.init(
    TurnService.turnRepo,
    CardService.getCard,
    FlowService.exportFlowToFile,
    CardService.exportCardToFile,
    BackgroundService.getBackground,
    AssetService.getAsset,
    TurnService.getTurn,
    FlowService.importFlowFromFile,
    CardService.importCardFromFile,
    BackgroundService.saveFileToBackground,
    FlowService.flowRepo,
    FlowService.getModelsFromFlowFile,
  );
}
