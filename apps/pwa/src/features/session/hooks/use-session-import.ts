import { useCallback } from "react";
import { toast } from "sonner";
import { SessionService } from "@/app/services/session-service";
import { queryClient } from "@/app/queries/query-client";
import { sessionQueries } from "@/entities/session/api";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { cardQueries } from "@/app/queries/card-queries";
import { fetchBackgrounds } from "@/shared/stores/background-store";
import { logger } from "@/shared/lib";
import type { AgentModel } from "@/pages/sessions/ui/dialog/session-import-dialog";

/**
 * Hook for handling session import functionality
 * Provides handlers for importing session files and extracting model information
 */
export function useSessionImport() {
  const handleImport = useCallback(
    async (
      file: File,
      includeHistory: boolean,
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
    ) => {
      try {
        // Import session from file
        const importedSessionOrError =
          await SessionService.importSessionFromFile.execute({
            file: file,
            includeHistory: includeHistory,
            agentModelOverrides:
              agentModelOverrides && agentModelOverrides.size > 0
                ? agentModelOverrides
                : undefined,
          });
        if (importedSessionOrError.isFailure) {
          throw new Error(importedSessionOrError.getError());
        }

        // Invalidate queries
        queryClient.invalidateQueries({
          queryKey: sessionQueries.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: flowQueries.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: cardQueries.lists(),
        });

        // Refetch backgrounds
        fetchBackgrounds();
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to import session", {
            description: error.message,
          });
        }
        logger.error("Failed to import session", error);
      }
    },
    [],
  );

  const handleFileSelect = useCallback(
    async (file: File): Promise<AgentModel[] | void> => {
      if (!file) {
        return;
      }
      try {
        const modelNameOrError =
          await SessionService.getModelsFromSessionFile.execute(file);
        if (modelNameOrError.isFailure) {
          toast.error("Failed to import session", {
            description: modelNameOrError.getError(),
          });
          return;
        }
        const agentIdToModelNames = modelNameOrError.getValue();

        // TODO: Get agent names from the session file flows
        // For now, use agent ID as fallback name
        const enhancedModels = agentIdToModelNames.map((item) => ({
          agentId: item.agentId,
          agentName: item.agentName || `Agent ${item.agentId.slice(0, 8)}`,
          modelName: item.modelName,
          modelTier: item.modelTier,
        }));

        return enhancedModels;
      } catch (error) {
        console.error("Error reading session file:", error);
        toast.error("Failed to read session file");
      }
    },
    [],
  );

  return { handleImport, handleFileSelect };
}
