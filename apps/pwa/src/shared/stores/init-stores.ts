import { ApiService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { fetchBackgrounds } from "@/shared/stores/background-store";
import { ApiConnection, ApiSource } from "@/entities/api/domain";

export async function initStores(
  onProgress?: (step: string, status: "start" | "success" | "warning" | "error", error?: string) => void,
): Promise<void> {
  // Init astrsk.ai provider
  onProgress?.("api-connections", "start");
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
    // Continue with background initialization even if provider setup fails
    onProgress?.("backgrounds", "start");
    try {
      await fetchBackgrounds();
      onProgress?.("backgrounds", "success");
    } catch (bgError) {
      const bgErrorMessage =
        bgError instanceof Error ? bgError.message : String(bgError);
      console.error("Failed to fetch backgrounds:", bgError);
      onProgress?.("backgrounds", "error", bgErrorMessage);
    }
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
      title: "astrsk.ai free",
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
      }
    }
  } else {
    // Mark as success when skipped (already exists or env vars not set)
    onProgress?.("free-provider", "success");
  }

  // Init default sessions - only for new users
  // Check if user has any sessions (only need to check if 1 exists, not fetch all)
  onProgress?.("check-sessions", "start");
  let sessions;
  try {
    sessions = (await SessionService.listSession.execute({ limit: 1 }))
      .throwOnFailure()
      .getValue();
    onProgress?.("check-sessions", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to check sessions:", error);
    onProgress?.("check-sessions", "error", errorMessage);
    // Continue with background initialization even if session setup fails
    onProgress?.("backgrounds", "start");
    try {
      await fetchBackgrounds();
      onProgress?.("backgrounds", "success");
    } catch (bgError) {
      const bgErrorMessage =
        bgError instanceof Error ? bgError.message : String(bgError);
      console.error("Failed to fetch backgrounds:", bgError);
      onProgress?.("backgrounds", "error", bgErrorMessage);
    }
    return;
  }

  if (sessions.length === 0) {
    onProgress?.("default-sessions", "start");
    // Import default sessions
    const sessionFilePaths = [
      "/default/session/dice_of_fate.astrsk.session",
      "/default/session/sakura_blooms,_hearts_awaken.astrsk.session",
    ];

    const errorDetails: string[] = [];
    const totalFiles = sessionFilePaths.length;

    for (const path of sessionFilePaths) {
      const fileName = path.split("/").pop() || path;
      try {
        const response = await fetch(path);
        if (!response.ok) {
          const errorMsg = `${fileName}: HTTP ${response.status} ${response.statusText}`;
          console.error(`Failed to fetch session file: ${errorMsg}`);
          errorDetails.push(errorMsg);
          continue;
        }
        const file = new File(
          [await response.blob()],
          fileName,
          {
            type: "application/octet-stream",
          },
        );

        const importResult = await SessionService.importSessionFromFile.execute(
          {
            file: file,
            includeHistory: true,
          },
        );
        if (importResult.isFailure) {
          const errorMsg = `${fileName}: ${importResult.getError()}`;
          console.error("Failed to import session:", errorMsg);
          errorDetails.push(errorMsg);
          continue;
        }
      } catch (error) {
        const errorMsg = `${fileName}: ${error instanceof Error ? error.message : String(error)}`;
        console.error("Error fetching session file:", errorMsg);
        errorDetails.push(errorMsg);
        continue;
      }
    }

    const failedCount = errorDetails.length;
    const successCount = totalFiles - failedCount;

    if (failedCount === 0) {
      // All succeeded
      onProgress?.("default-sessions", "success");
    } else if (failedCount === totalFiles) {
      // All failed (critical)
      onProgress?.(
        "default-sessions",
        "error",
        `Failed to import all ${failedCount} session(s):\n${errorDetails.join("\n")}`,
      );
    } else {
      // Partial failure (some succeeded, some failed)
      onProgress?.(
        "default-sessions",
        "warning",
        `Partially imported sessions (${successCount}/${totalFiles} succeeded):\n${errorDetails.join("\n")}`,
      );
    }
  } else {
    // Mark as success when skipped (sessions already exist)
    onProgress?.("default-sessions", "success");
  }

  // Initialize backgrounds
  onProgress?.("backgrounds", "start");
  try {
    await fetchBackgrounds();
    onProgress?.("backgrounds", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch backgrounds:", error);
    onProgress?.("backgrounds", "error", errorMessage);
  }
}
