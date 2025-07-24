import { ApiService } from "@/app/services";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { ApiConnection, ApiSource } from "@/modules/api/domain";
import { useQuery } from "@tanstack/react-query";

export const characterFilePath = [
  "/default/card/Victor, the professional leader.png",
  "/default/card/Evelyne, the CEO.png",
  "/default/card/Leo, the junior secretary.png",
  "/default/card/Raphy, your kind secretary.png",
];

export const plotFilePath = [
  "/default/card/Isekai Truck Crash.png",
  "/default/card/Romantic Moments.png",
  "/default/card/Zombie Apocalypse.png",
];

export const useDefaultInitialized = () => {
  const { data } = useQuery({
    queryKey: ["init-default"],
    queryFn: async () => {
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

      // Init default flows
      const flows = (await FlowService.searchFlow.execute({}))
        .throwOnFailure()
        .getValue();
      if (flows && flows.length === 0) {
        // Will display in reverse to this order (order by updateAt desc)
        const filePath = [
          "/default/flow/SAGA (Sequential Analysis and Gaming Agent).json",
        ];
        for (const path of filePath) {
          const response = await fetch(path);
          const file = new File([await response.blob()], path);
          const importResult = await FlowService.importFlowFromFile.execute({
            file: file,
            // preserveOriginalModels: true, // Preserve models from the imported flow for default initialization
          });
          if (importResult.isFailure) {
            console.log(importResult.getError());
            continue;
          }
        }
      }

      // Init default cards
      const cards = (await CardService.searchCard.execute({}))
        .throwOnFailure()
        .getValue();
      if (cards && cards.length === 0) {
        // Will display in reverse to this order (order by updateAt desc)
        for (const path of characterFilePath) {
          // Import json
          const response = await fetch(path);
          const file = new File([await response.blob()], path, {
            type: "image/png",
          });
          await CardService.importCardFromFile.execute(file);
        }

        for (const path of plotFilePath) {
          // Import json
          const response = await fetch(path);
          const file = new File([await response.blob()], path, {
            type: "image/png",
          });
          await CardService.importCardFromFile.execute(file);
        }
      }

      return true;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return data ?? false;
};
