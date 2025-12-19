import { useCallback, useMemo, memo, useState, useId } from "react";
import { toastError, toastSuccess, toastInfo } from "@/shared/ui/toast";
import { useNavigate } from "@tanstack/react-router";
import {
  PanelRightClose,
  Ellipsis,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  FileUp,
  Image,
  Copy,
  Save,
  BookOpen,
} from "lucide-react";

import { AssetService } from "@/app/services/asset-service";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";
import { IconWorkflow } from "@/shared/assets";
import { ScenarioSelectionDialog } from "@/features/scenario/ui/scenario-selection-dialog";
import { Session } from "@/entities/session/domain/session";
import { ScenarioCard, CardType } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import {
  fetchSession,
  useSaveSession,
  useDeleteSession,
  useCloneTemplateSession,
} from "@/entities/session/api";
import PersonaItem from "./settings/persona-item";
import StorySettingItem from "./settings/story-setting-item";
import AddItemButton from "./settings/add-item-button";

import { cn } from "@/shared/lib";
import {
  backgroundQueries,
  getDefaultBackground,
  getBackgroundAssetId,
  isDefaultBackground,
} from "@/entities/background/api";
import { useAsset } from "@/shared/hooks/use-asset";
import { useQuery } from "@tanstack/react-query";
import { useFlow } from "@/shared/hooks/use-flow";
import { Loading, PopoverBase, DropdownMenuBase, Switch } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { DialogConfirm } from "@/shared/ui/dialogs/confirm";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { useCard } from "@/shared/hooks/use-card";
import { UniqueEntityID } from "@/shared/domain";
import MessageStyling from "./settings/message-styling";
import BackgroundGrid from "./settings/background-grid";
import { AutoReply, useSessionUIStore } from "@/shared/stores/session-store";

interface SessionSettingsSidebarProps {
  session: Session;
  isOpen: boolean;
  onAutoReply: () => void;
  onClose: () => void;
}

const ScenarioPreviewItem = ({
  scenarioId,
  onClick,
}: {
  scenarioId: UniqueEntityID;
  onClick?: () => void;
}) => {
  const [scenario] = useCard<ScenarioCard>(scenarioId);
  const [imageUrl] = useAsset(scenario?.props?.iconAssetId);

  if (!scenario) return null;

  return (
    <div
      className="group flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-border-subtle hover:border-fg-subtle"
      onClick={onClick}
    >
      <div className="relative w-[25%]">
        <img
          className="h-full w-full object-cover"
          src={imageUrl ?? "/default/card/GM_ Dice of Fate.png"}
          alt={scenario?.props?.title || "Scenario"}
        />
      </div>
      <div className="flex w-[75%] items-center justify-between gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-fg-default">
          {scenario?.props?.title ?? ""}
        </h3>
        <p className="flex-shrink-0 text-sm text-fg-subtle">
          <span className="font-semibold text-fg-default">
            {scenario?.props?.tokenCount ?? 0}
          </span>{" "}
          <span>Tokens</span>
        </p>
      </div>
    </div>
  );
};

const WorkflowPreviewItem = ({
  title,
  nodeCount,
  onClick,
}: {
  title: string;
  nodeCount?: number;
  onClick?: () => void;
}) => {
  return (
    <div
      className="group flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-border-subtle hover:border-fg-subtle"
      onClick={onClick}
    >
      <div className="relative flex w-[25%] items-center justify-center bg-blue-500/10">
        <IconWorkflow className="h-6 w-6 text-blue-400" />
      </div>
      <div className="flex w-[75%] items-center justify-between gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-fg-default">
          {title}
        </h3>
        <p className="flex-shrink-0 text-sm text-fg-subtle">
          <span className="font-semibold text-fg-default">{nodeCount ?? 0}</span>{" "}
          <span>Nodes</span>
        </p>
      </div>
    </div>
  );
};

const SessionSettingsSidebar = ({
  session,
  isOpen,
  onAutoReply,
  onClose,
}: SessionSettingsSidebarProps) => {
  const navigate = useNavigate();
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);
  const saveSessionMutation = useSaveSession();
  const deleteSessionMutation = useDeleteSession();
  const cloneTemplateSessionMutation = useCloneTemplateSession();
  const skipScenarioDialog = useSessionUIStore.use.skipScenarioDialog();
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] =
    useState<boolean>(false);
  const [isBackgroundPopoverOpen, setIsBackgroundPopoverOpen] =
    useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(session.name ?? "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isAiCharacterDialogOpen, setIsAiCharacterDialogOpen] =
    useState<boolean>(false);
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] =
    useState<boolean>(false);

  // Background - check if default first, then query for user background
  const defaultBg = session.backgroundId ? getDefaultBackground(session.backgroundId) : undefined;

  const { data: background } = useQuery({
    ...backgroundQueries.detail(session.backgroundId),
    enabled: !!session.backgroundId && !defaultBg,
  });

  const [backgroundAsset] = useAsset(getBackgroundAssetId(background));

  const backgroundImageSrc = useMemo(() => {
    if (defaultBg) {
      return defaultBg.src;
    }
    return backgroundAsset; // undefined or string
  }, [defaultBg, backgroundAsset]);

  const [coverImageSrc] = useAsset(session.coverId);

  const handleAddAICharacter = useCallback(() => {
    setIsAiCharacterDialogOpen(true);
  }, []);

  const handleConfirmAICharacters = useCallback(
    async (characters: CharacterCard[]) => {
      if (characters.length === 0) {
        return;
      }

      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Get new character IDs (only characters not already in the session)
        const existingIds = latestSession.aiCharacterCardIds.map((id) =>
          id.toString(),
        );
        const newCharacters = characters.filter(
          (char) => !existingIds.includes(char.id.toString()),
        );

        // Add each new character to allCards array using addCard method
        for (const character of newCharacters) {
          const result = latestSession.addCard(
            character.id,
            CardType.Character,
          );
          if (result.isFailure) {
            toastError("Failed to add character", {
              description: result.getError(),
            });
            return;
          }
        }

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toastSuccess(
          `${newCharacters.length} AI character${newCharacters.length > 1 ? "s" : ""} added successfully`,
        );
      } catch (error) {
        toastError("Failed to add AI characters", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );


  const handleAddScenario = useCallback(() => {
    setIsScenarioDialogOpen(true);
  }, []);

  const handleConfirmScenario = useCallback(
    async (scenario: ScenarioCard | null) => {
      if (!scenario) {
        return;
      }

      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Check if scenario is already in allCards
        const existingCard = latestSession.allCards.find((card) =>
          card.id.equals(scenario.id),
        );

        // If already exists, no need to add again
        if (existingCard) {
          toastInfo("This scenario is already added to the session");
          return;
        }

        // Add scenario to allCards using addCard method (validates Plot card uniqueness)
        const addResult = latestSession.addCard(scenario.id, CardType.Plot);
        if (addResult.isFailure) {
          toastError("Failed to add scenario", {
            description: addResult.getError(),
          });
          return;
        }

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toastSuccess("Scenario added successfully");
      } catch (error) {
        toastError("Failed to add scenario", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );

  const handleToggleCharacterActive = useCallback(
    async (characterId: UniqueEntityID) => {
      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Find the card and toggle its enabled state
        const card = latestSession.allCards.find((c) => c.id.equals(characterId));
        if (!card) return;

        const newEnabled = !card.enabled;
        latestSession.setCardEnabled(characterId, newEnabled);

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });
      } catch (error) {
        toastError("Failed to toggle character", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );

  const handleChangeBackground = useCallback(
    async (backgroundId: UniqueEntityID | undefined) => {
      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Update background
        latestSession.update({ backgroundId });

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Close both dialog and popover
        setIsBackgroundDialogOpen(false);
        setIsBackgroundPopoverOpen(false);

        // Show success message
        toastSuccess("Background updated successfully");
      } catch (error) {
        toastError("Failed to update background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );

  const handleSaveTitle = useCallback(async () => {
    if (!editedName.trim()) {
      toastError("Name cannot be empty");
      return;
    }

    try {
      // Fetch latest session data
      const latestSession = await fetchSession(session.id);

      // Update name
      latestSession.update({ name: editedName.trim() });

      // Save to backend
      await saveSessionMutation.mutateAsync({ session: latestSession });

      // Exit editing mode
      setIsEditingTitle(false);

      // Show success message
      toastSuccess("Session name updated");
    } catch (error) {
      toastError("Failed to update session name", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [editedName, session.id, saveSessionMutation]);

  const handleCancelEditTitle = useCallback(() => {
    setEditedName("");
    setIsEditingTitle(false);
  }, []);

  const handleDeleteSession = useCallback(async () => {
    try {
      await deleteSessionMutation.mutateAsync({
        sessionId: session.id,
      });

      // Cache invalidation happens in mutation's onSuccess
      toastSuccess("Session deleted successfully");

      // Navigate to sessions list
      navigate({ to: "/sessions" });
    } catch (error) {
      toastError("Failed to delete session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session.id, deleteSessionMutation, navigate]);

  const handleSaveAsPreset = useCallback(async () => {
    try {
      // Clone as template session (isPlaySession: false, original title, no history)
      const clonedSession = await cloneTemplateSessionMutation.mutateAsync({
        sessionId: session.id,
        includeHistory: false,
      });

      // Save the template session (title and isPlaySession already set by CloneTemplateSession)
      await saveSessionMutation.mutateAsync({ session: clonedSession });

      // Skip the first message dialog for the new session (user already saw it)
      skipScenarioDialog(clonedSession.id.toString());

      toastSuccess("Saved as preset successfully");

      // Navigate to session grid to see the newly created preset
      navigate({ to: "/sessions" });
    } catch (error) {
      toastError("Failed to save as asset", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session.id, cloneTemplateSessionMutation, saveSessionMutation, skipScenarioDialog, navigate]);

  const coverImageInputId = useId();

  const handleCoverImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // 1. Upload file to asset
        const assetResult = await AssetService.saveFileToAsset.execute({
          file,
        });

        if (assetResult.isFailure) {
          toastError("Failed to upload cover image", {
            description: assetResult.getError(),
          });
          return;
        }

        const asset = assetResult.getValue();

        // 2. Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // 3. Update cover ID
        latestSession.update({
          coverId: asset.id,
        });

        // 4. Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toastSuccess("Cover image updated successfully");
      } catch (error) {
        toastError("Failed to update cover image", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [session.id, saveSessionMutation],
  );

  const handleDeleteCoverImage = useCallback(async () => {
    try {
      // Fetch latest session data
      const latestSession = await fetchSession(session.id);

      // Remove cover ID (set to undefined)
      latestSession.update({
        coverId: undefined,
      });

      // Save to backend
      await saveSessionMutation.mutateAsync({ session: latestSession });

      // Show success message
      toastSuccess("Cover image deleted successfully");
    } catch (error) {
      toastError("Failed to delete cover image", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session.id, saveSessionMutation]);

  return (
    <aside
      className={cn(
        "bg-surface absolute top-0 bottom-0 right-0 z-30 flex max-w-dvw flex-col md:w-96",
        "transition-transform duration-300 ease-in-out",
        "shadow-[-8px_0_24px_-4px_rgba(0,0,0,0.5)]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface p-4">
        <button
          type="button"
          aria-label="Close settings panel"
          onClick={onClose}
          className="cursor-pointer text-fg-subtle hover:text-fg-default"
        >
          <PanelRightClose className="h-5 w-5" />
        </button>
        {isEditingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTitle();
                } else if (e.key === "Escape") {
                  handleCancelEditTitle();
                }
              }}
              className="flex-1 rounded-md border border-fg-disabled bg-surface-raised px-2 py-1 text-sm text-fg-default focus:border-brand-500 focus:outline-none"
              autoFocus
              placeholder="Enter session name"
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              className="cursor-pointer text-status-success hover:text-status-success/80"
              aria-label="Save title"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditTitle}
              className="cursor-pointer text-status-error hover:text-status-error/80"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="flex flex-1 items-center gap-2 min-w-0 text-base font-semibold text-fg-default">
            <span className="truncate">{session.name ?? "Untitled Session"}</span>
            <button
              type="button"
              aria-label="Edit session name"
              className="cursor-pointer text-fg-subtle hover:text-fg-default flex-shrink-0"
              onClick={() => {
                setIsEditingTitle(true);
                setEditedName(session.name ?? "");
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </span>
        )}
        <DropdownMenuBase
          trigger={
            <button
              type="button"
              aria-label="More menu"
              className="cursor-pointer text-fg-subtle hover:text-fg-default"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
          }
          items={[
            {
              label: "Save as asset",
              icon: <Save className="h-4 w-4" />,
              onClick: handleSaveAsPreset,
            },
            {
              label: "Delete session",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setIsDeleteDialogOpen(true),
              className: "text-status-error hover:text-status-error/80 focus:text-status-error/80",
            },
          ]}
          align="end"
        />

        <DialogConfirm
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Session"
          description="Are you sure you want to delete this session? This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="destructive"
          onConfirm={handleDeleteSession}
        />

      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 [&>section]:flex [&>section]:flex-col [&>section]:gap-2">
        
        <section>
          <h3 className="font-semibold">User character</h3>
          <div className="space-y-2">
            {session.userCharacterCardId ? (
              <PersonaItem
                key={`user-character-${session.userCharacterCardId.toString()}`}
                characterId={session.userCharacterCardId}
                isEnabled={true}
                onClick={() => {
                  navigate({
                    to: "/assets/characters/{-$characterId}",
                    params: {
                      characterId:
                        session.userCharacterCardId?.toString() ?? "",
                    },
                    search: { mode: "edit" },
                  });
                }}
              />
            ) : (
              <div className="group flex h-[64px] overflow-hidden rounded-lg border border-border-subtle">
                <div className="relative w-[25%]">
                  <img
                    className="h-full w-full object-cover"
                    src="/img/placeholder/character-placeholder.png"
                    alt="No Persona"
                  />
                </div>
                <div className="flex w-[75%] items-center justify-between gap-2 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-fg-default">
                    No persona
                  </h3>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">AI characters</h3>
          <div className="space-y-2">
            {session.characterCards
              .filter((card) => !card.id.equals(session.userCharacterCardId))
              .length > 0 ? (
              session.characterCards
                .filter((card) => !card.id.equals(session.userCharacterCardId))
                .map((card, index) => (
                  <PersonaItem
                    key={`ai-character-${index}-${card.id.toString()}`}
                    characterId={card.id}
                    isEnabled={card.enabled}
                    onClick={() => {
                      navigate({
                        to: "/assets/characters/{-$characterId}",
                        params: { characterId: card.id.toString() },
                        search: { mode: "edit" },
                      });
                    }}
                    onToggleActive={() => handleToggleCharacterActive(card.id)}
                  />
                ))
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-raised/50">
                <p className="text-sm text-fg-subtle">No AI characters</p>
              </div>
            )}
            <AddItemButton
              icon={Plus}
              label="Add AI character"
              onClick={handleAddAICharacter}
            />
          </div>

          {/* AI Character Selection Dialog */}
          <CharacterSelectionDialog
            open={isAiCharacterDialogOpen}
            onOpenChange={setIsAiCharacterDialogOpen}
            selectedCharacters={[]}
            onConfirm={handleConfirmAICharacters}
            excludeCharacterIds={[
              // Exclude user character if selected
              ...(session.userCharacterCardId
                ? [session.userCharacterCardId.toString()]
                : []),
              // Exclude already selected AI characters
              ...session.aiCharacterCardIds.map((id) => id.toString()),
            ]}
            isMultipleSelect={true}
            title="Choose AI Characters"
            description="Choose one or more AI character cards"
            confirmButtonText="Update"
          />
        </section>


        <section>
          <h3 className="font-semibold">Story setting</h3>
          <div className="space-y-2">
            <StorySettingItem
              icon={BookOpen}
              title="Scenario"
              disabled={!session.plotCard}
              onClick={() => {
                if (session.plotCard) {
                  navigate({
                    to: "/assets/scenarios/{-$scenarioId}",
                    params: {
                      scenarioId: session.plotCard?.id.toString() ?? "",
                    },
                  });
                }
              }}
            />

            {isLoadingFlow ? (
              <div className="flex h-[64px] items-center justify-center rounded-lg border border-border-subtle">
                <Loading size="sm" />
              </div>
            ) : (
              <StorySettingItem
                icon={IconWorkflow}
                title="Workflow"
                onClick={() => {
                  if (!flow?.id) return;

                  navigate({
                    to: "/assets/workflows/$workflowId",
                    params: { workflowId: flow.id.toString() },
                  });
                }}
                disabled={!flow}
              />
            )}
          </div>

          {/* Scenario Selection Dialog */}
          <ScenarioSelectionDialog
            open={isScenarioDialogOpen}
            onOpenChange={setIsScenarioDialogOpen}
            selectedScenario={null}
            onConfirm={handleConfirmScenario}
            title="Select Scenario"
            description="Choose a scenario to add to this session"
            confirmButtonText="Add"
          />
        </section>

        <section className="block md:hidden!">
          <h3 className="font-semibold">Auto reply setting</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface px-4 py-2">
              <span>Auto reply</span>
              <Switch
                checked={session.autoReply !== AutoReply.Off}
                onCheckedChange={onAutoReply}
              />
            </div>
            <p className="text-xs text-fg-subtle">
              Automatically responds after your message.
            </p>
          </div>
        </section>

        <section>
          <h3 className="flex items-center justify-between gap-2 font-semibold">
            <span>Cover image</span>
            {coverImageSrc && (
              <button
                type="button"
                aria-label="Delete cover image"
                className="cursor-pointer text-fg-subtle hover:text-fg-default"
                onClick={handleDeleteCoverImage}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </h3>
          <label
            htmlFor={coverImageInputId}
            className="transition-brightness block cursor-pointer duration-200 hover:brightness-110"
          >
            {coverImageSrc ? (
              <img
                className="h-[64px] w-full rounded-lg object-cover"
                src={coverImageSrc}
                alt="Cover image"
              />
            ) : (
              <AddItemButton icon={FileUp} label="Upload cover image" />
            )}
          </label>
          <input
            id={coverImageInputId}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleCoverImageChange}
            className="hidden"
          />
        </section>

        {/* Background image - Mobile (Dialog) */}
        <section className="md:hidden!">
          <h3 className="font-semibold">Background image</h3>
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg border-0 bg-transparent p-0 text-left transition-opacity hover:brightness-110"
            onClick={() => setIsBackgroundDialogOpen(true)}
            aria-label="Change background image"
          >
            {backgroundImageSrc ? (
              <img
                className="h-[64px] w-full rounded-lg object-cover"
                src={backgroundImageSrc}
                alt="Background image"
              />
            ) : (
              <AddItemButton icon={Image} label="Select background image" />
            )}
          </button>

          <DialogBase
            open={isBackgroundDialogOpen}
            onOpenChange={setIsBackgroundDialogOpen}
            title="Select Background"
            content={
              <BackgroundGrid
                sessionId={session.id}
                currentBackgroundId={session.backgroundId}
                onSelect={handleChangeBackground}
                isEditable={true}
              />
            }
          />
        </section>

        {/* Background image - Desktop (Popover) */}
        <section className="hidden! md:flex!">
          <h3 className="font-semibold">Background image</h3>
          <PopoverBase
            open={isBackgroundPopoverOpen}
            onOpenChange={setIsBackgroundPopoverOpen}
            side="left"
            align="start"
            className="w-[calc(100dvw-2rem)] md:w-[480px]"
            trigger={
              <div className="cursor-pointer rounded-lg transition-opacity hover:brightness-110">
                {backgroundImageSrc ? (
                  <img
                    className="h-[64px] w-full rounded-lg object-cover"
                    src={backgroundImageSrc}
                    alt="Background image"
                  />
                ) : (
                  <AddItemButton icon={Image} label="Select background image" />
                )}
              </div>
            }
            content={
              <BackgroundGrid
                sessionId={session.id}
                currentBackgroundId={session.backgroundId}
                onSelect={handleChangeBackground}
                isEditable={true}
              />
            }
          />
        </section>

        <section>
          <h3 className="font-semibold">Message styling</h3>

          <MessageStyling
            sessionId={session.id}
            chatStyles={session.chatStyles}
          />
        </section>

        {/* Save as asset - Mobile only (inside sections) */}
        <section className="md:hidden!">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleSaveAsPreset}
          >
            <Save className="h-5 w-5" />
            Save as asset
          </Button>
        </section>
      </div>

      {/* Save as asset - Desktop only (footer) */}
      <div className="mt-auto hidden p-4 pt-0 md:block">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleSaveAsPreset}
        >
          <Save className="h-5 w-5" />
          Save as asset
        </Button>
      </div>
    </aside>
  );
};

export default memo(SessionSettingsSidebar);
