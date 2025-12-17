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
import { initializeExtensions } from "@/features/extensions/bootstrap";
import { cleanupStaleGeneratingSessions } from "@/entities/session/api/cleanup-stale-sessions";
import { logger } from "@/shared/lib/logger";

export async function initServices(
  onProgress?: (service: string, status: "start" | "success" | "warning" | "error", error?: string) => void,
  options?: { skipDbOperations?: boolean },
): Promise<void> {
  const { skipDbOperations = false } = options ?? {};
  let currentService: string | undefined;
  try {
    // Common
    currentService = "asset-service";
    onProgress?.(currentService, "start");
    AssetService.init();
    onProgress?.(currentService, "success");

    // API
    currentService = "api-service";
    onProgress?.(currentService, "start");
    ApiService.init();
    onProgress?.(currentService, "success");

    // Agent
    currentService = "agent-service";
    onProgress?.(currentService, "start");
    AgentService.init();
    onProgress?.(currentService, "success");

    // Node Data Services
    currentService = "node-services";
    onProgress?.(currentService, "start");
    DataStoreNodeService.init();
    IfNodeService.init();
    onProgress?.(currentService, "success");

    // Vibe Session Service
    currentService = "vibe-service";
    onProgress?.(currentService, "start");
    VibeSessionService.init();
    onProgress?.(currentService, "success");

    // Flow
    currentService = "flow-service";
    onProgress?.(currentService, "start");
    FlowService.init(
      AgentService.agentRepo,
      AgentService.agentRepo,
      AgentService.agentRepo,
    );
    onProgress?.(currentService, "success");

    // Generated Image - Initialize BEFORE CardService since CardService depends on it
    currentService = "image-service";
    onProgress?.(currentService, "start");
    GeneratedImageService.init(
      AssetService.saveFileToAsset,
      AssetService.deleteAsset,
    );
    onProgress?.(currentService, "success");

    // Card - Now can use GeneratedImageService.generatedImageRepo
    currentService = "card-service";
    onProgress?.(currentService, "start");
    CardService.init(
      AssetService.assetRepo,
      AssetService.saveFileToAsset,
      AssetService.cloneAsset,
      GeneratedImageService.generatedImageRepo,
    );
    onProgress?.(currentService, "success");

    // Session
    currentService = "session-service";
    onProgress?.(currentService, "start");
    TurnService.init();
    BackgroundService.init(
      AssetService.saveFileToAsset,
      AssetService.deleteAsset,
    );
    SessionService.init(
      TurnService.turnRepo,
      FlowService.exportFlowWithNodes,
      CardService.exportCardToFile,
      BackgroundService.getBackground,
      AssetService.getAsset,
      TurnService.getTurn,
      FlowService.importFlowWithNodes,
      CardService.importCardFromFile,
      BackgroundService.saveFileToBackground,
      AssetService.saveFileToAsset,
      FlowService.getModelsFromFlowFile,
      FlowService.cloneFlow,
      CardService.cloneCard,
      AssetService.cloneAsset,
      BackgroundService.cloneBackground,
      AssetService.assetRepo, // LoadAssetRepo
      AssetService.assetRepo, // SaveAssetRepo
      BackgroundService.backgroundRepo,
      CardService.cardRepo,
      FlowService.flowRepo,
      AgentService.agentRepo,
      DataStoreNodeService.dataStoreNodeRepo,
      IfNodeService.ifNodeRepo,
      // Save repos for cloud import
      CardService.cardRepo,
      FlowService.flowRepo,
      AgentService.agentRepo,
      DataStoreNodeService.dataStoreNodeRepo,
      IfNodeService.ifNodeRepo,
    );
    onProgress?.(currentService, "success");

    // Cleanup stale generating sessions (sessions interrupted by page refresh)
    // Skip in fast path to avoid DB access that can hang on iOS Chrome OAuth redirects
    if (!skipDbOperations) {
      currentService = "session-cleanup";
      onProgress?.(currentService, "start");
      const cleanedCount = await cleanupStaleGeneratingSessions();
      if (cleanedCount > 0) {
        logger.info(`[init-services] Cleaned up ${cleanedCount} interrupted session(s)`);
      }
      onProgress?.(currentService, "success");
    }

    // Extensions - Initialize last, after all services are ready
    currentService = "extensions";
    onProgress?.(currentService, "start");
    await initializeExtensions();
    onProgress?.(currentService, "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Report error for the specific service that failed
    if (currentService) {
      onProgress?.(currentService, "error", errorMessage);
    }
    throw error;
  }
}
