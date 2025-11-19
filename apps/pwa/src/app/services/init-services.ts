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

export async function initServices(
  onProgress?: (service: string, status: "start" | "success" | "error", error?: string) => void,
): Promise<void> {
  try {
    // Common
    onProgress?.("asset-service", "start");
    AssetService.init();
    onProgress?.("asset-service", "success");

    // API
    onProgress?.("api-service", "start");
    ApiService.init();
    onProgress?.("api-service", "success");

    // Agent
    onProgress?.("agent-service", "start");
    AgentService.init();
    onProgress?.("agent-service", "success");

    // Node Data Services
    onProgress?.("node-services", "start");
    DataStoreNodeService.init();
    IfNodeService.init();
    onProgress?.("node-services", "success");

    // Vibe Session Service
    onProgress?.("vibe-service", "start");
    VibeSessionService.init();
    onProgress?.("vibe-service", "success");

    // Flow
    onProgress?.("flow-service", "start");
    FlowService.init(
      AgentService.agentRepo,
      AgentService.agentRepo,
      AgentService.agentRepo,
    );
    onProgress?.("flow-service", "success");

    // Generated Image - Initialize BEFORE CardService since CardService depends on it
    onProgress?.("image-service", "start");
    GeneratedImageService.init(
      AssetService.saveFileToAsset,
      AssetService.deleteAsset,
    );
    onProgress?.("image-service", "success");

    // Card - Now can use GeneratedImageService.generatedImageRepo
    onProgress?.("card-service", "start");
    CardService.init(
      AssetService.assetRepo,
      AssetService.saveFileToAsset,
      AssetService.cloneAsset,
      GeneratedImageService.generatedImageRepo,
    );
    onProgress?.("card-service", "success");

    // Session
    onProgress?.("session-service", "start");
    TurnService.init();
    BackgroundService.init(
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
    onProgress?.("session-service", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Report error for the current service being initialized
    onProgress?.("services-init", "error", errorMessage);
    throw error;
  }
}
