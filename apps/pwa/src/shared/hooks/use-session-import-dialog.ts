import { useState, useCallback, useRef } from "react";
import { SessionService } from "@/app/services/session-service";
import { logger } from "@/shared/lib";
import { toast } from "sonner";
import type { AgentModel } from "@/features/session/ui/session-import-dialog";

/**
 * Unified session import hook
 * Handles session file selection, parsing agent models, and dialog state management
 * Follows the same pattern as useResourceImport for consistency
 */
export function useSessionImportDialog() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [agentModels, setAgentModels] = useState<AgentModel[]>([]);

  /**
   * Parse session file and extract agent models
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".session")) {
        toast.error("Invalid file type", {
          description: "Only .session files are supported",
        });
        return;
      }

      try {
        setImportingFile(file);

        // Get agent models from file
        const modelNameOrError =
          await SessionService.getModelsFromSessionFile.execute(file);

        if (modelNameOrError.isFailure) {
          toast.error("Failed to read session file", {
            description: modelNameOrError.getError(),
          });
          setImportingFile(null);
          return;
        }

        const agentIdToModelNames = modelNameOrError.getValue();

        // Enhance with agent names
        const enhancedModels: AgentModel[] = agentIdToModelNames.map((item) => ({
          agentId: item.agentId,
          agentName: item.agentName || `Agent ${item.agentId.slice(0, 8)}`,
          modelName: item.modelName,
          modelTier: item.modelTier,
        }));

        setAgentModels(enhancedModels);
        setIsOpenImportDialog(true);
      } catch (error) {
        logger.error("Error reading session file:", error);
        toast.error("Failed to read session file", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setImportingFile(null);
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [],
  );

  /**
   * Trigger file input click
   */
  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // File input ref
    fileInputRef,
    // Dialog state
    isOpenImportDialog,
    setIsOpenImportDialog,
    importingFile,
    agentModels,
    // Handlers
    handleFileSelect,
    triggerImport,
  };
}
