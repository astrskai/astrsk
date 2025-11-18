import { ApiService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { fetchBackgrounds } from "@/shared/stores/background-store";
import { ApiConnection, ApiSource } from "@/entities/api/domain";

export async function initStores(): Promise<void> {
  // Init astrsk.ai provider
  const apiConnections = (await ApiService.listApiConnection.execute({}))
    .throwOnFailure()
    .getValue();
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
    const astrskaiProvider = ApiConnection.create({
      source: ApiSource.AstrskAi,
      title: "astrsk.ai free",
      apiKey: import.meta.env.VITE_ASTRSK_FREE_API_KEY,
      baseUrl: import.meta.env.VITE_ASTRSK_FREE_BASE_URL,
      updatedAt: new Date(),
    }).getValue();

    // Add astrsk.ai provider
    await ApiService.saveApiConnection.execute(astrskaiProvider);
  }

  // Init default sessions - only for new users
  const sessions = (await SessionService.listSession.execute({}))
    .throwOnFailure()
    .getValue();
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
          console.log(
            "Failed to import session:",
            path,
            importResult.getError(),
          );
          continue;
        }
      } catch (error) {
        console.log("Error fetching session file:", path, error);
        continue;
      }
    }
  }

  // Initialize backgrounds
  await fetchBackgrounds();
}
