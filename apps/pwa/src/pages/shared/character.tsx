// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/character/$uuid";
import { useImportCharacterFromCloud } from "@/entities/card/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";
import { SessionService } from "@/app/services/session-service";
import { FlowService } from "@/app/services/flow-service";
import { CardService } from "@/app/services/card-service";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";
import { queryClient } from "@/shared/api/query-client";
import { TableName } from "@/db/schema/table-name";
import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply } from "@/shared/stores/session-store";
import { CardType, ScenarioCard, CharacterCard } from "@/entities/card/domain";
import {
  PersonaSelectionDialog,
  type PersonaResult,
} from "@/features/character/ui/persona-selection-dialog";

type ImportState = "loading" | "success" | "persona_selection" | "creating_session" | "error";

// Timeout before showing "Go back" button (in ms)
const LOADING_TIMEOUT = 10000;
const DEFAULT_FLOW_FILE = "Simple_vf.json";

export default function SharedCharacterPage() {
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

  // Store the imported character for session creation
  const [importedCharacter, setImportedCharacter] = useState<CharacterCard | null>(null);

  // Guard against double execution (React Strict Mode runs effects twice)
  const importStartedRef = useRef(false);

  const importCharacterMutation = useImportCharacterFromCloud();

  // Show "Go back" button after timeout
  useEffect(() => {
    if (importState !== "loading") return;

    const timeoutId = setTimeout(() => {
      setShowTimeoutButton(true);
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [importState]);

  useEffect(() => {
    if (!uuid) return;

    // Prevent duplicate imports (React Strict Mode protection)
    if (importStartedRef.current) {
      console.log("[SharedCharacterPage] Import already started, skipping duplicate execution");
      return;
    }
    importStartedRef.current = true;

    console.log("[SharedCharacterPage] Starting character import for:", uuid);

    const importCharacter = async () => {
      try {
        console.log("[SharedCharacterPage] Calling importCharacterMutation.mutateAsync");
        const character = await importCharacterMutation.mutateAsync({
          characterId: uuid,
        });

        console.log("[SharedCharacterPage] Import successful:", character.id.toString());
        setImportedCharacter(character as CharacterCard);
        toastSuccess(`Character "${character.props.title}" imported successfully`);

        // Show persona selection dialog
        setImportState("persona_selection");
      } catch (error) {
        console.error("[SharedCharacterPage] Import failed:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import character", { description: message });
      }
    };

    importCharacter();
  }, [uuid]);

  /**
   * Create session with the imported character and start playing
   */
  const createSessionAndPlay = useCallback(
    async (personaResult: PersonaResult | null) => {
      if (!importedCharacter) return;

      setImportState("creating_session");

      try {
        const sessionName = importedCharacter.props.name || "Chat Session";

        // Step 1: Create empty session first (for foreign key constraints)
        const sessionOrError = Session.create({
          title: sessionName,
          flowId: undefined,
          allCards: [],
          userCharacterCardId: undefined,
          turnIds: [],
          autoReply: AutoReply.Off,
          chatStyles: defaultChatStyles,
          isPlaySession: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (sessionOrError.isFailure) {
          throw new Error(sessionOrError.getError());
        }

        const session = sessionOrError.getValue();
        const sessionId = session.id;

        // Save empty session first
        const initialSaveResult = await SessionService.saveSession.execute({
          session,
        });

        if (initialSaveResult.isFailure) {
          throw new Error(initialSaveResult.getError());
        }

        // Step 2: Import default flow from Simple_vf.json
        const response = await fetch(`/default/flow/${DEFAULT_FLOW_FILE}`);
        if (!response.ok) {
          throw new Error(`Failed to load default flow: ${DEFAULT_FLOW_FILE}`);
        }
        const flowJson = await response.json();

        const importResult = await FlowService.importFlowWithNodes.importFromJson(
          flowJson,
          sessionId,
        );

        if (importResult.isFailure) {
          throw new Error("Could not import workflow.");
        }

        const clonedFlow = importResult.getValue();

        // Step 3: Clone the character card with sessionId (AI character)
        const clonedCardResult = await CardService.cloneCard.execute({
          cardId: importedCharacter.id,
          sessionId: sessionId,
        });

        if (clonedCardResult.isFailure) {
          throw new Error(`Could not copy character "${importedCharacter.props.name}" for session.`);
        }

        const clonedCard = clonedCardResult.getValue();

        const allCards: CardListItem[] = [
          {
            id: clonedCard.id,
            type: CardType.Character,
            enabled: true,
          },
        ];

        // Step 4: Clone persona card if selected
        let userCharacterCardId: UniqueEntityID | undefined;
        if (personaResult?.type === "existing" && personaResult.characterId) {
          const personaCloneResult = await CardService.cloneCard.execute({
            cardId: new UniqueEntityID(personaResult.characterId),
            sessionId: sessionId,
          });

          if (personaCloneResult.isFailure) {
            throw new Error("Could not copy persona for session.");
          }

          const clonedPersona = personaCloneResult.getValue();
          userCharacterCardId = clonedPersona.id;

          allCards.push({
            id: clonedPersona.id,
            type: CardType.Character,
            enabled: true,
          });
        }

        // Step 5: Create scenario card from character's 1:1 config if exists
        const hasScenario = importedCharacter.props.scenario;
        const hasFirstMessages =
          importedCharacter.props.firstMessages &&
          importedCharacter.props.firstMessages.length > 0;

        if (hasScenario || hasFirstMessages) {
          const scenarioCardResult = ScenarioCard.create({
            title: `${importedCharacter.props.name} - Scenario`,
            name: `${importedCharacter.props.name} - Scenario`,
            type: CardType.Scenario,
            tags: [],
            description: importedCharacter.props.scenario || "",
            firstMessages: importedCharacter.props.firstMessages || [],
            sessionId: sessionId,
          });

          if (scenarioCardResult.isSuccess) {
            const scenarioCard = scenarioCardResult.getValue();
            const saveScenarioResult = await CardService.saveCard.execute(scenarioCard);

            if (saveScenarioResult.isSuccess) {
              const savedScenario = saveScenarioResult.getValue();
              allCards.push({
                id: savedScenario.id,
                type: CardType.Scenario,
                enabled: true,
              });
            } else {
              logger.warn(
                "Failed to save scenario card from character 1:1 config",
                saveScenarioResult.getError(),
              );
            }
          } else {
            logger.warn(
              "Failed to create scenario card from character 1:1 config",
              scenarioCardResult.getError(),
            );
          }
        }

        // Step 6: Update session with cloned resources
        session.update({
          flowId: clonedFlow.id,
          allCards,
          userCharacterCardId,
        });

        // Save the updated session
        const savedSessionOrError = await SessionService.saveSession.execute({
          session,
        });

        if (savedSessionOrError.isFailure) {
          throw new Error(savedSessionOrError.getError());
        }

        const savedSession = savedSessionOrError.getValue();

        // Update session store and invalidate queries
        selectSession(savedSession.id, savedSession.title);
        queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

        setImportState("success");

        toastSuccess("Session created!", {
          description: `Started a chat with ${importedCharacter.props.name}`,
        });

        // Navigate to session chat page
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: savedSession.id.toString() },
          replace: true,
        });
      } catch (error) {
        logger.error("Failed to create chat session:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error";
        setErrorMessage(message);
        toastError("Failed to create session", { description: message });
      }
    },
    [importedCharacter, selectSession, navigate],
  );

  /**
   * Handle persona selection confirmation
   */
  const handlePersonaConfirm = useCallback(
    (personaResult: PersonaResult | null) => {
      createSessionAndPlay(personaResult);
    },
    [createSessionAndPlay],
  );

  /**
   * Handle persona dialog close (user cancelled)
   */
  const handlePersonaDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        // User cancelled - navigate to characters list
        navigate({ to: "/assets/characters", replace: true });
      }
    },
    [navigate],
  );

  const handleRetry = () => {
    setImportState("loading");
    setErrorMessage("");
    importStartedRef.current = false;
    importCharacterMutation.mutate(
      { characterId: uuid },
      {
        onSuccess: (character) => {
          setImportedCharacter(character as CharacterCard);
          toastSuccess(`Character "${character.props.title}" imported successfully`);
          setImportState("persona_selection");
        },
        onError: (error) => {
          setImportState("error");
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          setErrorMessage(message);
          toastError("Failed to import character", { description: message });
        },
      },
    );
  };

  const handleGoToCharacters = () => {
    navigate({ to: "/assets/characters" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {importState === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Importing shared character...</p>
            <p className="text-fg-subtle text-sm">
              This may take a moment while we download the assets.
            </p>
            {showTimeoutButton && (
              <>
                <p className="text-fg-warning text-sm">
                  This is taking unusually long.
                </p>
                <Button onClick={handleGoToCharacters} variant="outline">
                  Go back to characters
                </Button>
              </>
            )}
          </div>
        )}

        {importState === "creating_session" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Starting your session...</p>
          </div>
        )}

        {importState === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Session ready!
            </p>
            <p className="text-fg-muted text-sm">Redirecting to your session...</p>
          </div>
        )}

        {importState === "error" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Failed to import character
            </p>
            <p className="text-fg-muted max-w-md text-center text-sm">
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline">
                Try again
              </Button>
              <Button onClick={handleGoToCharacters}>Go to characters</Button>
            </div>
          </div>
        )}
      </div>

      {/* Persona Selection Dialog - shown after import success */}
      <PersonaSelectionDialog
        open={importState === "persona_selection"}
        onOpenChange={handlePersonaDialogClose}
        onConfirm={handlePersonaConfirm}
        allowSkip={true}
      />
    </div>
  );
}
