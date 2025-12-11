/**
 * Hook for creating a new session with background workflow generation
 *
 * This hook handles:
 * - Creating asset session with Simple workflow upfront
 * - Creating all characters and scenario cards immediately
 * - Marking session as "generating" (workflow replacement in background)
 * - Background workflow generation (replaces Simple with AI-generated)
 * - Preventing page unload during generation
 * - Success toast notification when workflow generation completes
 * - User must manually start play session when ready
 */

import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Session, type SessionConfig } from "@/entities/session/domain/session";
import { SessionService } from "@/app/services/session-service";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType, Entry, Lorebook } from "@/entities/card/domain";
import { AutoReply } from "@/shared/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { TableName } from "@/db/schema/table-name";
import { executeBackgroundGeneration } from "./use-create-session-background";

import type { WorkflowState } from "@/app/services/system-agents/workflow-builder/types";
import type { ChatStyles } from "@/entities/session/domain/chat-styles";
import type { Flow } from "@/entities/flow/domain";
import type { DraftCharacter } from "@/pages/sessions/ui/create/draft-character";

export interface CreateSessionInput {
  sessionName: string;
  workflow: WorkflowState | null;
  workflowPromise?: Promise<{ state: WorkflowState; sessionName: string } | null> | null;
  characters: DraftCharacter[];
  playerCharacterId?: string;
  scenarioBackground: string;
  scenarioFirstMessages: Array<{ title: string; content: string }>;
  scenarioLorebook: Array<{ id: string; title: string; keys: string; desc: string; range: number }>;
  chatStyles: ChatStyles;
  defaultFlow?: Flow;
  flowResponseTemplate: string;
  defaultLiteModel: any;
  defaultStrongModel: any;
  createCharacterMutation: any;
}

export interface CreateSessionResult {
  sessionId: string;
  sessionName: string;
}

export function useCreateSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Prevent page unload during session creation/generation
  useEffect(() => {
    if (!isCreating && !isGenerating) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Session creation is in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isCreating, isGenerating]);

  const createSession = useCallback(
    async (input: CreateSessionInput): Promise<CreateSessionResult | null> => {
      setIsCreating(true);

      try {
        const {
          sessionName,
          workflow,
          workflowPromise,
          characters,
          playerCharacterId,
          scenarioBackground,
          scenarioFirstMessages,
          scenarioLorebook,
          chatStyles,
          defaultFlow,
          flowResponseTemplate,
          defaultLiteModel,
          defaultStrongModel,
          createCharacterMutation,
        } = input;

        // Step 1: Create session with default flow (Simple or provided default)
        const sessionOrError = Session.create({
          title: sessionName,
          flowId: undefined,
          allCards: [],
          userCharacterCardId: undefined,
          turnIds: [],
          autoReply: AutoReply.Random,
          chatStyles,
          isPlaySession: false,
          config: {
            generationStatus: "generating",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (sessionOrError.isFailure) {
          logger.error("Failed to create session", sessionOrError.getError());
          toastError("Failed to create session", {
            description: "Could not initialize session.",
          });
          return null;
        }

        const session = sessionOrError.getValue();
        const sessionId = session.id;

        // Save empty session first
        const initialSaveResult = await SessionService.saveSession.execute({
          session: session,
        });

        if (initialSaveResult.isFailure) {
          logger.error("Failed to save initial session", initialSaveResult.getError());
          toastError("Failed to create session", {
            description: "Could not save session.",
          });
          return null;
        }

        // Step 2: Clone default flow or import Simple template
        let initialFlow: Flow;

        if (defaultFlow) {
          // Clone existing default flow
          const clonedFlowResult = await FlowService.cloneFlow.execute({
            flowId: defaultFlow.id,
            sessionId: sessionId,
            shouldRename: false,
          });

          if (clonedFlowResult.isFailure) {
            logger.error("Failed to clone default flow", clonedFlowResult.getError());
            toastError("Failed to create session", {
              description: "Could not initialize workflow.",
            });
            return null;
          }

          initialFlow = clonedFlowResult.getValue();
        } else {
          // No default flow exists, import Simple_complete template (works without datastore definition)
          const response = await fetch("/default/flow/Simple_complete.json");
          if (!response.ok) {
            toastError("Failed to load flow template", {
              description: "Could not load Simple_complete workflow template.",
            });
            return null;
          }

          const flowJson = await response.json();

          const importResult = await FlowService.importFlowWithNodes.importFromJson(
            flowJson,
            sessionId,
          );

          if (importResult.isFailure) {
            logger.error("Failed to import Simple_complete template", importResult.getError());
            toastError("Failed to create session", {
              description: "Could not import Simple_complete workflow template.",
            });
            return null;
          }

          initialFlow = importResult.getValue();
        }

        // Step 3: Process characters and create them immediately
        const allCards: Array<{ id: UniqueEntityID; type: CardType; enabled: boolean }> = [];
        let sessionPlayerCharacterId: UniqueEntityID | undefined;

        for (const draft of characters) {
          let finalCardId: UniqueEntityID;

          if (draft.source === "library" && draft.existingCardId) {
            // Clone library character
            const clonedCardResult = await CardService.cloneCard.execute({
              cardId: new UniqueEntityID(draft.existingCardId),
              sessionId: sessionId,
            });

            if (clonedCardResult.isFailure) {
              logger.error("Failed to clone character", clonedCardResult.getError());
              toastError("Failed to create session", {
                description: "Could not clone character.",
              });
              return null;
            }

            finalCardId = clonedCardResult.getValue().id;
          } else if (draft.data) {
            // Create new character
            const newCard = await createCharacterMutation.mutateAsync({
              name: draft.data.name,
              description: draft.data.description,
              tags: draft.data.tags,
              cardSummary: draft.data.cardSummary,
              exampleDialogue: draft.data.exampleDialogue,
              creator: draft.data.creator,
              version: draft.data.version,
              conceptualOrigin: draft.data.conceptualOrigin,
              imageFile: draft.data.imageFile,
              lorebookEntries: draft.data.lorebook,
              scenario: draft.data.scenario,
              firstMessages: draft.data.firstMessages,
              sessionId: sessionId,
            });

            finalCardId = newCard.id;
          } else {
            logger.error("Invalid draft character", draft);
            continue;
          }

          if (playerCharacterId && draft.tempId === playerCharacterId) {
            sessionPlayerCharacterId = finalCardId;
          }

          allCards.push({
            id: finalCardId,
            type: CardType.Character,
            enabled: true,
          });
        }

        // Step 4: Create scenario card if needed
        const hasScenarioData =
          scenarioBackground.trim() !== "" ||
          scenarioFirstMessages.length > 0 ||
          scenarioLorebook.length > 0;

        if (hasScenarioData) {
          const lorebookEntries = scenarioLorebook.map((entry) =>
            Entry.create({
              id: new UniqueEntityID(entry.id),
              name: entry.title,
              enabled: true,
              keys: entry.keys
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean),
              recallRange: entry.range,
              content: entry.desc,
            }).getValue(),
          );

          const lorebookResult = Lorebook.create({ entries: lorebookEntries });
          const lorebook = lorebookResult.isSuccess ? lorebookResult.getValue() : undefined;

          const firstMessages = scenarioFirstMessages.map((msg) => ({
            name: msg.title,
            description: msg.content,
          }));

          const scenarioCardResult = ScenarioCard.create({
            title: `Scenario - ${sessionName}`,
            name: `Scenario - ${sessionName}`,
            type: CardType.Scenario,
            description: scenarioBackground,
            firstMessages: firstMessages.length > 0 ? firstMessages : undefined,
            lorebook,
            sessionId: sessionId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (scenarioCardResult.isFailure) {
            logger.error("Failed to create scenario card", scenarioCardResult.getError());
            toastError("Failed to create session", {
              description: "Could not create scenario card.",
            });
            return null;
          }

          const scenarioCard = scenarioCardResult.getValue();
          const savedScenarioCardResult = await CardService.saveCard.execute(scenarioCard);

          if (savedScenarioCardResult.isFailure) {
            logger.error("Failed to save scenario card", savedScenarioCardResult.getError());
            toastError("Failed to create session", {
              description: "Could not save scenario card.",
            });
            return null;
          }

          const savedScenarioCard = savedScenarioCardResult.getValue() as ScenarioCard;

          allCards.push({
            id: savedScenarioCard.id,
            type: CardType.Scenario,
            enabled: true,
          });
        }

        // Step 5: Update session with flow and all cards
        session.update({
          flowId: initialFlow.id,
          allCards,
          userCharacterCardId: sessionPlayerCharacterId,
        });

        const savedSessionOrError = await SessionService.saveSession.execute({
          session: session,
        });

        if (savedSessionOrError.isFailure) {
          logger.error("Failed to save session with flow and cards", savedSessionOrError.getError());
          toastError("Failed to create session", {
            description: "Could not save session with cards.",
          });
          return null;
        }

        // Invalidate queries to show the session immediately
        queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

        // Return immediately - generation will continue in background
        const result: CreateSessionResult = {
          sessionId: sessionId.toString(),
          sessionName,
        };

        // Session creation complete - allow navigation
        setIsCreating(false);

        // Start background generation (non-blocking)
        setIsGenerating(true);

        // Run background generation in a separate async context
        executeBackgroundGeneration({
          session,
          workflow,
          workflowPromise,
          defaultLiteModel,
          defaultStrongModel,
          flowResponseTemplate,
          sessionId,
          sessionName,
          queryClient,
        }).finally(() => {
          setIsGenerating(false);
        });

        return result;
      } catch (error) {
        logger.error("[useCreateSession] Error creating session", error);
        toastError("Failed to create session", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setIsCreating(false);
        return null;
      }
    },
    [queryClient],
  );

  return {
    createSession,
    isCreating,
    isGenerating,
  };
}
