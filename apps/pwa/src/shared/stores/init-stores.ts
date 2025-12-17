import { ApiService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { ApiConnection, ApiSource } from "@/entities/api/domain";
import { useModelStore } from "@/shared/stores/model-store";

export async function initStores(
  onProgress: (step: string, status: "start" | "success" | "warning" | "error", error?: string) => void,
): Promise<void> {
  // Init astrsk.ai provider
  onProgress("api-connections", "start");
  let apiConnections;
  try {
    apiConnections = (await ApiService.listApiConnection.execute({}))
      .throwOnFailure()
      .getValue();
    onProgress?.("api-connections", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to list API connections:", error);
    onProgress?.("api-connections", "error", errorMessage);
    return;
  }

  let addAstrskaiProvider = false;

  if (apiConnections && apiConnections.length === 0) {
    addAstrskaiProvider = true;
  } else if (apiConnections) {
    // Check if astrsk.ai provider already exists
    const astrskaiProvider = apiConnections.find(
      (connection) => connection.source === ApiSource.AstrskAi,
    );
    if (!astrskaiProvider) {
      addAstrskaiProvider = true;
    }
  }

  if (
    addAstrskaiProvider &&
    import.meta.env.VITE_ASTRSK_FREE_API_KEY &&
    import.meta.env.VITE_ASTRSK_FREE_BASE_URL
  ) {
    onProgress?.("free-provider", "start");
    // Create astrsk.ai provider
    const astrskaiProviderResult = ApiConnection.create({
      source: ApiSource.AstrskAi,
      title: "astrsk.ai",
      apiKey: import.meta.env.VITE_ASTRSK_FREE_API_KEY,
      baseUrl: import.meta.env.VITE_ASTRSK_FREE_BASE_URL,
      updatedAt: new Date(),
    });

    if (astrskaiProviderResult.isFailure) {
      const errorMessage = astrskaiProviderResult.getError();
      console.error(
        "Failed to create astrsk.ai provider:",
        errorMessage,
      );
      onProgress?.("free-provider", "error", errorMessage);
      // Continue with other initialization steps
    } else {
      const astrskaiProvider = astrskaiProviderResult.getValue();
      // Add astrsk.ai provider
      const saveResult = await ApiService.saveApiConnection.execute(
        astrskaiProvider,
      );
      if (saveResult.isFailure) {
        const errorMessage = saveResult.getError();
        console.error(
          "Failed to save astrsk.ai provider:",
          errorMessage,
        );
        onProgress?.("free-provider", "error", errorMessage);
      } else {
        onProgress?.("free-provider", "success");

        // Set default models if not already configured
        onProgress?.("default-models", "start");
        try {
          const modelStore = useModelStore.getState();

          // Only set defaults if not already configured
          if (!modelStore.defaultLiteModel || !modelStore.defaultStrongModel) {
            // Get available models from the provider
            const modelsResult = await ApiService.listApiModel.execute({
              apiConnectionId: astrskaiProvider.id,
            });

            if (modelsResult.isSuccess) {
              const models = modelsResult.getValue();

              // Find Gemini 2.5 Flash for lite model (if not already set)
              if (!modelStore.defaultLiteModel) {
                const geminiFlash = models.find(
                  (m) => m.id === "openai-compatible:google/gemini-2.5-flash"
                );
                if (geminiFlash) {
                  modelStore.setDefaultLiteModel({
                    apiConnectionId: astrskaiProvider.id.toString(),
                    apiSource: ApiSource.AstrskAi,
                    modelId: geminiFlash.id,
                    modelName: geminiFlash.name,
                  });
                }
              }

              // Find DeepSeek for strong model (if not already set)
              if (!modelStore.defaultStrongModel) {
                const deepseek = models.find(
                  (m) => m.id === "openai-compatible:deepseek/deepseek-chat"
                );
                if (deepseek) {
                  modelStore.setDefaultStrongModel({
                    apiConnectionId: astrskaiProvider.id.toString(),
                    apiSource: ApiSource.AstrskAi,
                    modelId: deepseek.id,
                    modelName: deepseek.name,
                  });
                }
              }

              onProgress?.("default-models", "success");
            } else {
              onProgress?.("default-models", "warning", "Could not fetch models from provider");
            }
          } else {
            // Already configured, skip
            onProgress?.("default-models", "success");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Failed to set default models:", error);
          onProgress?.("default-models", "warning", errorMessage);
        }
      }
    }
  } else {
    // Mark as success when skipped (already exists or env vars not set)
    onProgress?.("free-provider", "success");
    onProgress?.("default-models", "success");
  }

  // Check sessions step (kept for future use when default sessions are re-enabled)
  onProgress?.("check-sessions", "start");
  onProgress?.("check-sessions", "success");

  // Migrate sessions with messages to play sessions
  onProgress?.("migrate-play-sessions", "start");
  try {
    await SessionService.migrateSessionsWithMessagesToPlaySessions.execute({});
    onProgress?.("migrate-play-sessions", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to migrate sessions to play sessions:", error);
    // This is not critical, just log warning and continue
    onProgress?.("migrate-play-sessions", "warning", errorMessage);
  }

  // Default session import is currently disabled (no default session files available)
  // Skip this step and mark as success
  onProgress?.("default-sessions", "start");
  onProgress?.("default-sessions", "success");

  // Note: Background initialization removed - backgrounds are now fetched via TanStack Query
  // when a session is opened. Default backgrounds are static constants that don't need initialization.
}
