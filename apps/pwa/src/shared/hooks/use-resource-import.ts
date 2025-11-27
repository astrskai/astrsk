import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CardService } from "@/app/services/card-service";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { FlowService } from "@/app/services/flow-service";
import { CardType } from "@/entities/card/domain";
import { characterKeys } from "@/entities/character/api";
import { scenarioKeys } from "@/entities/scenario/api";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { logger } from "@/shared/lib";
import type { AgentModel } from "@/features/flow/ui/flow-import-dialog";

/**
 * Unified resource import hook
 * Handles both PNG (cards) and JSON (flows) imports
 * Reusable across all resource pages (characters, plots, flows)
 */
export function useResourceImport() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state for flow imports
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [agentModels, setAgentModels] = useState<AgentModel[]>([]);

  /**
   * Handle file selection from file input
   * For PNG files: import cards directly
   * For JSON files: parse agent models and show dialog for overrides
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const isJSON =
        file.type === "application/json" || file.name.endsWith(".json");
      const isPNG = file.type === "image/png";

      if (!isJSON && !isPNG) {
        toastError("Invalid file type", {
          description: "Only PNG and JSON files are supported",
        });
        return;
      }

      try {
        if (isPNG) {
          // Import card from PNG directly (no dialog needed)
          const result = await CardService.importCardFromFile.execute(file);

          if (result.isFailure) {
            toastError("Failed to import card", {
              description: result.getError(),
            });
            return;
          }

          const importedCards = result.getValue();

          // Refresh card lists based on imported card types
          const hasCharacter = importedCards.some(
            (card) => card.props.type === CardType.Character,
          );
          const hasPlot = importedCards.some(
            (card) => card.props.type === CardType.Plot,
          );

          if (hasCharacter) {
            await queryClient.invalidateQueries({
              queryKey: characterKeys.lists(),
            });
          }
          if (hasPlot) {
            await queryClient.invalidateQueries({
              queryKey: scenarioKeys.lists(),
            });
          }

          toastSuccess("Card imported successfully", {
            description: `Imported ${importedCards.length} card(s)`,
          });

          // Navigate to appropriate card page
          if (hasCharacter && !hasPlot) {
            navigate({ to: "/assets/characters" });
          } else if (hasPlot && !hasCharacter) {
            navigate({ to: "/assets/scenarios" });
          } else if (hasCharacter && hasPlot) {
            navigate({ to: "/assets/characters" });
          }
        } else if (isJSON) {
          // For JSON files, try character card import first (V2/V3 format)
          // If that fails, try flow import

          // First attempt: Import as character card
          const cardResult = await CardService.importCardFromFile.execute(file);

          if (cardResult.isSuccess) {
            // Successfully imported as character card
            const importedCards = cardResult.getValue();

            // Refresh card lists based on imported card types
            const hasCharacter = importedCards.some(
              (card) => card.props.type === CardType.Character,
            );
            const hasPlot = importedCards.some(
              (card) => card.props.type === CardType.Plot,
            );

            if (hasCharacter) {
              await queryClient.invalidateQueries({
                queryKey: characterKeys.lists(),
              });
            }
            if (hasPlot) {
              await queryClient.invalidateQueries({
                queryKey: scenarioKeys.lists(),
              });
            }

            toastSuccess("Card imported successfully", {
              description: `Imported ${importedCards.length} card(s)`,
            });

            // Navigate to appropriate card page
            if (hasCharacter && !hasPlot) {
              navigate({ to: "/assets/characters" });
            } else if (hasPlot && !hasCharacter) {
              navigate({ to: "/assets/scenarios" });
            } else if (hasCharacter && hasPlot) {
              navigate({ to: "/assets/characters" });
            }
          } else {
            // Card import failed, try flow import
            setImportingFile(file);

            // Get models from file
            const modelNameOrError =
              await FlowService.getModelsFromFlowFile.execute(file);

            if (modelNameOrError.isFailure) {
              toastError("Failed to import file", {
                description: "File is not a valid character card or flow",
              });
              return;
            }

            // Parse the file to get agent names
            const text = await file.text();
            const flowJson = JSON.parse(text);
            const agentIdToModelNames = modelNameOrError.getValue();

            // Enhance with agent names
            const enhancedModels: AgentModel[] = agentIdToModelNames.map(
              (item) => ({
                ...item,
                agentName:
                  flowJson.agents[item.agentId]?.name || "Unknown Agent",
              }),
            );

            setAgentModels(enhancedModels);
            setIsOpenImportDialog(true);
          }
        }
      } catch (error) {
        logger.error(error);
        toastError("Failed to process file", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [navigate],
  );

  /**
   * Handle flow import with agent model overrides
   */
  const handleImportFlow = useCallback(
    async (
      file: File,
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
      newlyCreatedFlowIdSetter?: (id: string) => void,
    ) => {
      try {
        // Import flow from file
        const importedFlowOrError =
          await FlowService.importFlowWithNodes.execute({
            file,
            agentModelOverrides:
              agentModelOverrides && agentModelOverrides.size > 0
                ? agentModelOverrides
                : undefined,
          });

        if (importedFlowOrError.isFailure) {
          throw new Error(importedFlowOrError.getError());
        }

        const importedFlow = importedFlowOrError.getValue();

        // Refresh flow list
        await queryClient.refetchQueries({
          queryKey: flowQueries.lists(),
        });

        // Trigger animation for imported flow if setter provided
        if (newlyCreatedFlowIdSetter) {
          newlyCreatedFlowIdSetter(importedFlow.id.toString());
        }

        toastSuccess("Flow imported successfully", {
          description: importedFlow.props.name || "Untitled Flow",
        });

        // Navigate to workflows page if not already there (setter only provided from workflows page)
        if (!newlyCreatedFlowIdSetter) {
          navigate({ to: "/assets/workflows" });
        }
      } catch (error) {
        logger.error(error);
        toastError("Failed to import flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [queryClient, navigate],
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
    handleImportFlow,
    triggerImport,
  };
}
