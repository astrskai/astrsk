import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { Route } from "@/routes/_layout/assets/characters/{-$characterId}";

import { characterQueries } from "@/entities/character/api";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";

import { Loading } from "@/shared/ui";
import { Button, FieldDisplay, TextDisplay } from "@/shared/ui/forms";
import { useAsset } from "@/shared/hooks/use-asset";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { AccordionBase } from "@/shared/ui";

import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { CardType, ScenarioCard } from "@/entities/card/domain";
import { queryClient } from "@/shared/api/query-client";
import { TableName } from "@/db/schema/table-name";
import {
  PersonaSelectionDialog,
  type PersonaResult,
} from "@/features/character/ui/persona-selection-dialog";

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-placeholder.png";
const DEFAULT_FLOW_FILE = "Simple.json";

/**
 * Lorebook Item Title - View Mode (matches editor styling)
 */
const LorebookItemTitle = ({ name }: { name: string }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="max-w-[200px] truncate sm:max-w-sm md:max-w-full">
        {name}
      </div>
    </div>
  );
};

/**
 * Lorebook Item Content - View Mode (uses FieldDisplay/TextDisplay)
 */
const LorebookItemContent = ({
  entry,
}: {
  entry: {
    name: string;
    keys: string[];
    recallRange: number;
    content: string;
  };
}) => {
  return (
    <div className="space-y-4">
      <FieldDisplay
        label="Lorebook name"
        labelPosition="inner"
        value={entry.name}
      />

      <div className="space-y-2">
        <div className="relative">
          <FieldDisplay
            label="Trigger keywords"
            labelPosition="inner"
            value={entry.keys.length > 0 ? "" : undefined}
            emptyText="No keywords"
          />
        </div>

        {entry.keys.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {entry.keys.map((key, keyIndex) => (
              <li
                key={`${key}-${keyIndex}`}
                className="flex items-center gap-2 rounded-md bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              >
                <span className="text-xs text-neutral-200">{key}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TextDisplay
        label="Description"
        labelPosition="inner"
        value={entry.content}
      />

      <FieldDisplay
        label="Recall range"
        labelPosition="inner"
        value={entry.recallRange.toString()}
      />
    </div>
  );
};

/**
 * Character Detail Page - View Mode
 * Shows character info as labels (not editable) with same layout as editor
 * Two buttons: Chat (create session & play) and Edit (go to editor)
 */
const CharacterDetailPage = () => {
  const navigate = useNavigate();
  const { characterId } = Route.useParams();
  const selectSession = useSessionStore.use.selectSession();

  // Fetch character data
  const { data: character, isLoading } = useQuery({
    ...characterQueries.detail(characterId!),
    enabled: !!characterId && characterId !== "new",
  });

  const [imageUrl] = useAsset(character?.props.iconAssetId);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isCopyingAsGlobal, setIsCopyingAsGlobal] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string>("");
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);

  // Check if character is session-local
  const isSessionLocal = character?.props.sessionId != null;

  const handleGoBack = () => {
    navigate({ to: "/assets/characters" });
  };

  const handleEdit = () => {
    // Navigate to editor page with edit mode
    navigate({
      to: "/assets/characters/{-$characterId}",
      params: { characterId: characterId! },
      search: { mode: "edit" },
    });
  };

  // Open persona selection dialog when Chat button is clicked
  const handleChatClick = useCallback(() => {
    setIsPersonaDialogOpen(true);
  }, []);

  // Create session with this character using default flow and start playing
  const handlePersonaConfirm = useCallback(
    async (personaResult: PersonaResult | null) => {
      if (!character || !characterId) return;

      setIsCreatingSession(true);
      try {
        const sessionName = character.props.name || "Chat Session";

        // Step 1: Create empty session first (for foreign key constraints)
        const sessionOrError = Session.create({
          title: sessionName,
          flowId: undefined,
          allCards: [],
          userCharacterCardId: undefined,
          turnIds: [],
          autoReply: AutoReply.Random,
          chatStyles: defaultChatStyles,
          isPlaySession: true, // Play sessions appear in sidebar
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (sessionOrError.isFailure) {
          toastError("Failed to create session", {
            description: sessionOrError.getError(),
          });
          return;
        }

        const session = sessionOrError.getValue();
        const sessionId = session.id;

        // Save empty session first
        const initialSaveResult = await SessionService.saveSession.execute({
          session,
        });

        if (initialSaveResult.isFailure) {
          toastError("Failed to create session", {
            description: initialSaveResult.getError(),
          });
          return;
        }

        // Step 2: Import default flow from Simple.json
        const response = await fetch(`/default/flow/${DEFAULT_FLOW_FILE}`);
        if (!response.ok) {
          throw new Error(`Failed to load default flow: ${DEFAULT_FLOW_FILE}`);
        }
        const flowJson = await response.json();

        const importResult =
          await FlowService.importFlowWithNodes.importFromJson(
            flowJson,
            sessionId,
          );

        if (importResult.isFailure) {
          toastError("Failed to create session", {
            description: "Could not import workflow.",
          });
          return;
        }

        const clonedFlow = importResult.getValue();

        // Step 3: Clone the character card with sessionId (AI character)
        const clonedCardResult = await CardService.cloneCard.execute({
          cardId: new UniqueEntityID(characterId),
          sessionId: sessionId,
        });

        if (clonedCardResult.isFailure) {
          toastError("Failed to create session", {
            description: `Could not copy character "${character.props.name}" for session.`,
          });
          return;
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
            toastError("Failed to create session", {
              description: "Could not copy persona for session.",
            });
            return;
          }

          const clonedPersona = personaCloneResult.getValue();
          userCharacterCardId = clonedPersona.id;

          // Add persona to allCards
          allCards.push({
            id: clonedPersona.id,
            type: CardType.Character,
            enabled: true,
          });
        }

        // Step 5: Create scenario card from character's 1:1 config if exists
        const hasScenario = character.props.scenario;
        const hasFirstMessages =
          character.props.firstMessages &&
          character.props.firstMessages.length > 0;

        if (hasScenario || hasFirstMessages) {
          // Create scenario card using character's 1:1 session config
          const scenarioCardResult = ScenarioCard.create({
            title: `${character.props.name} - Scenario`,
            name: `${character.props.name} - Scenario`,
            type: CardType.Scenario,
            tags: [],
            description: character.props.scenario || "",
            firstMessages: character.props.firstMessages || [],
            sessionId: sessionId, // Session-local
          });

          if (scenarioCardResult.isSuccess) {
            const scenarioCard = scenarioCardResult.getValue();
            const saveScenarioResult =
              await CardService.saveCard.execute(scenarioCard);

            if (saveScenarioResult.isSuccess) {
              const savedScenario = saveScenarioResult.getValue();
              // Add scenario card to allCards
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
          toastError("Failed to save session", {
            description: savedSessionOrError.getError(),
          });
          return;
        }

        const savedSession = savedSessionOrError.getValue();

        // Update session store and invalidate queries
        selectSession(savedSession.id, savedSession.title);
        queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

        toastSuccess("Session created!", {
          description: `Started a chat with ${character.props.name}`,
        });

        // Navigate to session chat page to start playing
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: savedSession.id.toString() },
        });
      } catch (error) {
        logger.error("Failed to create chat session", error);
        toastError("Failed to create session", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCreatingSession(false);
      }
    },
    [character, characterId, navigate, selectSession],
  );

  // Copy as Global handler
  const handleCopyAsGlobal = useCallback(async () => {
    if (!character || !characterId) return;

    setIsCopyingAsGlobal(true);
    try {
      const result = await CardService.cloneCard.execute({
        cardId: new UniqueEntityID(characterId),
        // sessionId is NOT passed, so the cloned card will be global
      });

      if (result.isFailure) {
        toastError("Failed to copy as global", {
          description: result.getError(),
        });
        return;
      }

      toastSuccess("Copied as global resource!", {
        description: `"${character.props.name}" is now available in your library.`,
      });
    } catch (error) {
      toastError("Failed to copy as global", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCopyingAsGlobal(false);
    }
  }, [character, characterId]);

  if (isLoading) return <Loading />;
  if (!character)
    return <div className="p-4 text-neutral-400">Character not found</div>;

  const displayImage = imageUrl || PLACEHOLDER_IMAGE_URL;
  const tags = character.props.tags || [];
  const lorebookEntries = character.props.lorebook?.props.entries || [];
  const cardSummary = character.props.cardSummary || "";

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Header - matches editor layout */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-5 w-5" />}
            size="sm"
            onClick={handleGoBack}
            type="button"
          />
          <h1 className="text-base font-semibold">
            {character.props.name || character.props.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Copy as Global - only shown for session-local characters */}
          {isSessionLocal && (
            <Button
              variant="secondary"
              icon={<Globe className="h-4 w-4" />}
              type="button"
              onClick={handleCopyAsGlobal}
              disabled={isCopyingAsGlobal}
              loading={isCopyingAsGlobal}
              title="Save as character"
            >
              <span className="hidden sm:inline">Save as character</span>
            </Button>
          )}
          {/* Edit button */}
          <Button
            variant="secondary"
            icon={<Pencil className="h-4 w-4" />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          {/* Chat button - opens persona selection then creates session (accent/primary) */}
          <Button
            icon={<MessageCircle className="h-4 w-4" />}
            onClick={handleChatClick}
            disabled={isCreatingSession}
            loading={isCreatingSession}
          >
            Chat
          </Button>
        </div>
      </div>

      {/* Persona Selection Dialog */}
      <PersonaSelectionDialog
        open={isPersonaDialogOpen}
        onOpenChange={setIsPersonaDialogOpen}
        onConfirm={handlePersonaConfirm}
        allowSkip={true}
      />

      {/* Content - matches editor layout */}
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
        {/* Image and Metadata section - matches editor */}
        <section className="flex w-full flex-col items-center justify-center gap-4">
          {/* Image */}
          <div className="relative max-w-[200px]">
            <img
              src={displayImage}
              alt={character.props.title ?? ""}
              className="h-full w-full rounded-lg object-cover"
            />
            {/* Show "No image selected" overlay when using placeholder */}
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                <p className="text-sm text-neutral-300">No image selected</p>
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Metadata
            </h2>

            <div className="space-y-4">
              <FieldDisplay
                label="Character Name"
                labelPosition="inner"
                value={character.props.name}
              />
              <div className="space-y-1">
                <FieldDisplay
                  label="Character Summary"
                  labelPosition="inner"
                  value={cardSummary}
                />
                <div className="px-2 text-left text-xs text-neutral-400">
                  {`(${cardSummary.length}/50)`}
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <FieldDisplay
                  label="Version"
                  labelPosition="inner"
                  value={character.props.version}
                />
                <FieldDisplay
                  label="Conceptual Origin"
                  labelPosition="inner"
                  value={character.props.conceptualOrigin}
                />
              </div>
            </div>

            {/* Tags display - only show selected tags in view mode */}
            {tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs text-neutral-200">Tags</h3>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="bg-brand-500/20 text-brand-400 rounded-md p-1 text-xs font-medium md:px-2 md:py-1 md:text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Character Info section - matches editor */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-100">
            Character Info
          </h2>

          <TextDisplay
            label="Character Description"
            labelPosition="inner"
            value={character.props.description}
          />
          <TextDisplay
            label="Example Dialogue"
            labelPosition="inner"
            value={character.props.exampleDialogue}
          />
        </section>

        {/* Lorebook section - matches editor */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-100">
              Lorebook
            </h2>
          </div>

          {lorebookEntries.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No lorebook entries yet.
            </p>
          ) : (
            <AccordionBase
              type="single"
              collapsible
              value={openAccordionId}
              onValueChange={(value) => setOpenAccordionId(value as string)}
              itemClassName="bg-transparent data-[state=open]:bg-transparent border-neutral-800"
              triggerClassName="bg-transparent hover:bg-transparent data-[state=open]:bg-transparent"
              items={lorebookEntries.map((entry) => ({
                title: <LorebookItemTitle name={entry.name || "Unnamed"} />,
                content: (
                  <LorebookItemContent
                    entry={{
                      name: entry.name || "",
                      keys: entry.keys || [],
                      recallRange: entry.recallRange || 2,
                      content: entry.content || "",
                    }}
                  />
                ),
                value: entry.id.toString(),
              }))}
            />
          )}
        </section>

        {/* 1:1 Session Config - Only shown if character has scenario or firstMessages */}
        {(character.props.scenario ||
          (character.props.firstMessages &&
            character.props.firstMessages.length > 0)) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">
                1:1 Session Config
              </h2>
            </div>

            {/* Amber accent card matching editor styling */}
            <div className="flex overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/20">
              {/* Amber accent bar */}
              <div className="w-2 bg-amber-500/50" />

              <div className="flex-1 space-y-4 p-4">
                {/* Warning banner */}
                <div className="flex items-center gap-3 rounded-lg bg-amber-950/30 p-3 text-amber-200">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
                  <p className="text-sm">
                    These fields provide starting context for 1:1 chat sessions.
                    For advanced roleplay scenarios, create a separate scenario
                    card.
                  </p>
                </div>

                {/* Scenario display */}
                {character.props.scenario && (
                  <TextDisplay
                    label="Scenario"
                    labelPosition="inner"
                    value={character.props.scenario}
                  />
                )}

                {/* First Messages display */}
                {character.props.firstMessages &&
                  character.props.firstMessages.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-200">
                        First Messages
                      </h3>
                      <div className="space-y-3">
                        {character.props.firstMessages.map((msg, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-3"
                          >
                            <div className="mb-2 text-xs font-medium text-amber-400">
                              Option {index + 1}
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-neutral-200">
                              {msg.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CharacterDetailPage;
