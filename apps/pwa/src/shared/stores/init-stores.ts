import { ApiService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { fetchBackgrounds } from "@/shared/stores/background-store";
import { ApiConnection, ApiSource } from "@/entities/api/domain";

export async function initStores(): Promise<void> {
  // Init astrsk.ai provider
  let apiConnections;
  try {
    apiConnections = (await ApiService.listApiConnection.execute({}))
      .throwOnFailure()
      .getValue();
  } catch (error) {
    console.error("Failed to list API connections:", error);
    // Continue with background initialization even if provider setup fails
    await fetchBackgrounds();
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
    // Create astrsk.ai provider
    const astrskaiProviderResult = ApiConnection.create({
      source: ApiSource.AstrskAi,
      title: "astrsk.ai free",
      apiKey: import.meta.env.VITE_ASTRSK_FREE_API_KEY,
      baseUrl: import.meta.env.VITE_ASTRSK_FREE_BASE_URL,
      updatedAt: new Date(),
    });

    if (astrskaiProviderResult.isFailure) {
      console.error(
        "Failed to create astrsk.ai provider:",
        astrskaiProviderResult.getError(),
      );
      // Continue with other initialization steps
    } else {
      const astrskaiProvider = astrskaiProviderResult.getValue();
      // Add astrsk.ai provider
      await ApiService.saveApiConnection.execute(astrskaiProvider);
    }
  }

  // Init default sessions - only for new users
  let sessions;
  try {
    sessions = (await SessionService.listSession.execute({}))
      .throwOnFailure()
      .getValue();
  } catch (error) {
    console.error("Failed to list sessions:", error);
    // Continue with background initialization even if session setup fails
    await fetchBackgrounds();
    return;
  }

  if (sessions && sessions.length === 0) {
    // Import default sessions
    const sessionFilePaths = [
      "/default/session/dice_of_fate.astrsk.session",
      "/default/session/sakura_blooms,_hearts_awaken.astrsk.session",
    ];

    for (const path of sessionFilePaths) {
      try {
        const response = await fetch(path);
        const file = new File(
          [await response.blob()],
          path.split("/").pop() || path,
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
          console.error(
            "Failed to import session:",
            path,
            importResult.getError(),
          );
          continue;
        }
      } catch (error) {
        console.error("Error fetching session file:", path, error);
        continue;
      }
    }
  }

  // Initialize backgrounds
  await fetchBackgrounds();
}
