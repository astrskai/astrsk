import { useCallback, useMemo, memo, useState, useId } from "react";
import { toast } from "sonner";
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
} from "lucide-react";

import { AssetService } from "@/app/services/asset-service";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import FlowPreview from "@/features/flow/ui/flow-preview";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";
import { ScenarioSelectionDialog } from "@/features/scenario/ui/scenario-selection-dialog";
import { Session } from "@/entities/session/domain/session";
import { PlotCard, CardType } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import {
  fetchSession,
  useSaveSession,
  useDeleteSession,
} from "@/entities/session/api";
import CharacterItem from "./settings/character-item";

import { cn } from "@/shared/lib";
import {
  isDefaultBackground,
  useBackgroundStore,
} from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { useFlow } from "@/shared/hooks/use-flow";
import { Loading, PopoverBase, DropdownMenuBase, Switch } from "@/shared/ui";
import { DialogConfirm } from "@/shared/ui/dialogs/confirm";
import DialogBase from "@/shared/ui/dialogs/base";
import { useCard } from "@/shared/hooks/use-card";
import { UniqueEntityID } from "@/shared/domain";
import MessageStyling from "./settings/message-styling";
import BackgroundGrid from "./settings/background-grid";
import { AutoReply } from "@/shared/stores/session-store";

interface SessionSettingsSidebarProps {
  session: Session;
  isOpen: boolean;
  autoReply: AutoReply;
  onAutoReply: (autoReply: AutoReply) => void;
  onClose: () => void;
}

const ScenarioPreviewItem = ({
  scenarioId,
  onClick,
}: {
  scenarioId: UniqueEntityID;
  onClick?: () => void;
}) => {
  const [scenario] = useCard<PlotCard>(scenarioId);
  const [imageUrl] = useAsset(scenario.props.iconAssetId);

  return (
    <ScenarioPreview
      title={scenario.props.title}
      imageUrl={imageUrl}
      tags={scenario.props.tags || []}
      tokenCount={scenario.props.tokenCount}
      firstMessages={scenario.props.scenarios?.length || 0}
      className="min-h-[200px]"
      onClick={onClick}
    />
  );
};

const SessionSettingsSidebar = ({
  session,
  isOpen,
  autoReply,
  onAutoReply,
  onClose,
}: SessionSettingsSidebarProps) => {
  const navigate = useNavigate();
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);
  const saveSessionMutation = useSaveSession();
  const deleteSessionMutation = useDeleteSession();
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] =
    useState<boolean>(false);
  const [isBackgroundPopoverOpen, setIsBackgroundPopoverOpen] =
    useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(session.title ?? "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isUserCharacterDialogOpen, setIsUserCharacterDialogOpen] =
    useState<boolean>(false);
  const [isAiCharacterDialogOpen, setIsAiCharacterDialogOpen] =
    useState<boolean>(false);
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] =
    useState<boolean>(false);

  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(session.backgroundId?.toString() ?? "");
  const [backgroundAsset] = useAsset(background?.assetId);

  const backgroundImageSrc = useMemo(() => {
    if (background && isDefaultBackground(background)) {
      return background.src;
    }
    return backgroundAsset; // undefined or string
  }, [background, backgroundAsset]);

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
            toast.error("Failed to add character", {
              description: result.getError(),
            });
            return;
          }
        }

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toast.success(
          `${newCharacters.length} AI character${newCharacters.length > 1 ? "s" : ""} added successfully`,
        );
      } catch (error) {
        toast.error("Failed to add AI characters", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );

  const handleAddUserCharacter = useCallback(() => {
    setIsUserCharacterDialogOpen(true);
  }, []);

  const handleConfirmUserCharacter = useCallback(
    async (characters: CharacterCard[]) => {
      // Single selection mode - take first character or null
      const selectedCharacter = characters.length > 0 ? characters[0] : null;

      if (!selectedCharacter) {
        return;
      }

      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Check if character is already in allCards
        const existingCard = latestSession.allCards.find((card) =>
          card.id.equals(selectedCharacter.id),
        );

        // If not in allCards, add it first
        if (!existingCard) {
          const addResult = latestSession.addCard(
            selectedCharacter.id,
            CardType.Character,
          );
          if (addResult.isFailure) {
            toast.error("Failed to add character", {
              description: addResult.getError(),
            });
            return;
          }
        }

        // Set as user character using validated method
        const setResult = latestSession.setUserCharacterCardId(
          selectedCharacter.id,
        );
        if (setResult.isFailure) {
          toast.error("Failed to set user character", {
            description: setResult.getError(),
          });
          return;
        }

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toast.success("User character added successfully");
      } catch (error) {
        toast.error("Failed to add user character", {
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
    async (scenario: PlotCard | null) => {
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
          toast.info("This scenario is already added to the session");
          return;
        }

        // Add scenario to allCards using addCard method (validates Plot card uniqueness)
        const addResult = latestSession.addCard(scenario.id, CardType.Plot);
        if (addResult.isFailure) {
          toast.error("Failed to add scenario", {
            description: addResult.getError(),
          });
          return;
        }

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Show success message
        toast.success("Scenario added successfully");
      } catch (error) {
        toast.error("Failed to add scenario", {
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
        toast.success("Background updated successfully");
      } catch (error) {
        toast.error("Failed to update background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session.id, saveSessionMutation],
  );

  const handleSaveTitle = useCallback(async () => {
    if (!editedTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      // Fetch latest session data
      const latestSession = await fetchSession(session.id);

      // Update title
      latestSession.update({ title: editedTitle.trim() });

      // Save to backend
      await saveSessionMutation.mutateAsync({ session: latestSession });

      // Exit editing mode
      setIsEditingTitle(false);

      // Show success message
      toast.success("Title updated successfully");
    } catch (error) {
      toast.error("Failed to update title", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [editedTitle, session.id, saveSessionMutation]);

  const handleCancelEditTitle = useCallback(() => {
    setEditedTitle("");
    setIsEditingTitle(false);
  }, []);

  const handleDeleteSession = useCallback(async () => {
    try {
      await deleteSessionMutation.mutateAsync({
        sessionId: session.id,
      });

      // Cache invalidation happens in mutation's onSuccess
      toast.success("Session deleted successfully");

      // Navigate to sessions list
      navigate({ to: "/sessions" });
    } catch (error) {
      toast.error("Failed to delete session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session.id, deleteSessionMutation, navigate]);

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
          toast.error("Failed to upload cover image", {
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
        toast.success("Cover image updated successfully");
      } catch (error) {
        toast.error("Failed to update cover image", {
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
      toast.success("Cover image deleted successfully");
    } catch (error) {
      toast.error("Failed to delete cover image", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session.id, saveSessionMutation]);

  const handleAutoReply = useCallback(() => {
    const hasMultipleCharacters = session.aiCharacterCardIds.length > 1;

    switch (autoReply) {
      case AutoReply.Off:
        onAutoReply(AutoReply.Random);
        break;
      case AutoReply.Random:
        // Skip Rotate option if only one character
        onAutoReply(hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off);
        break;
      case AutoReply.Rotate:
        onAutoReply(AutoReply.Off);
        break;
      default:
        throw new Error("Unknown auto reply");
    }
  }, [autoReply, onAutoReply, session.aiCharacterCardIds.length]);

  return (
    <aside
      className={cn(
        "bg-background-primary fixed top-0 right-0 z-30 h-dvh max-w-dvw overflow-y-auto md:w-96",
        "transition-transform duration-300 ease-in-out",
        "shadow-[-8px_0_24px_-4px_rgba(0,0,0,0.5)]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <button
          type="button"
          aria-label="Close settings panel"
          onClick={onClose}
          className="cursor-pointer text-gray-300 hover:text-gray-50"
        >
          <PanelRightClose className="h-5 w-5" />
        </button>
        {isEditingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTitle();
                } else if (e.key === "Escape") {
                  handleCancelEditTitle();
                }
              }}
              className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-50 focus:border-blue-500 focus:outline-none"
              autoFocus
              placeholder="Enter session title"
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              className="cursor-pointer text-green-400 hover:text-green-300"
              aria-label="Save title"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditTitle}
              className="cursor-pointer text-red-400 hover:text-red-300"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-2 text-base font-semibold text-gray-50">
            {session.title ?? "Untitled Session"}
            <button
              type="button"
              aria-label="Edit session title"
              className="cursor-pointer text-gray-300 hover:text-gray-50"
              onClick={() => {
                setIsEditingTitle(true);
                setEditedTitle(session.title ?? "");
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
              className="cursor-pointer text-gray-300 hover:text-gray-50"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
          }
          items={[
            {
              label: "Delete session",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setIsDeleteDialogOpen(true),
              className: "text-red-400 hover:text-red-300 focus:text-red-300",
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

      <div className="space-y-4 p-4 [&>section]:flex [&>section]:flex-col [&>section]:gap-2">
        <section>
          <h3 className="font-semibold">AI Characters</h3>
          <div className="space-y-2">
            {session.aiCharacterCardIds.length > 0 ? (
              session.aiCharacterCardIds.map((characterId, index) => (
                <CharacterItem
                  key={`ai-character-${index}-${characterId.toString()}`}
                  characterId={characterId}
                  onClick={() => {
                    navigate({
                      to: "/assets/characters/$characterId",
                      params: { characterId: characterId.toString() },
                    });
                  }}
                />
              ))
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No AI characters</p>
              </div>
            )}
            <div
              className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base"
              onClick={handleAddAICharacter}
            >
              <Plus className="h-5 w-5" />
              <p>Add AI Character</p>
            </div>
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
          <h3 className="font-semibold">User Character</h3>
          <div>
            {session.userCharacterCardId ? (
              <CharacterItem
                key={`user-character-${session.userCharacterCardId.toString()}`}
                characterId={session.userCharacterCardId}
                onClick={() => {
                  navigate({
                    to: "/assets/characters/$characterId",
                    params: {
                      characterId:
                        session.userCharacterCardId?.toString() ?? "",
                    },
                  });
                }}
              />
            ) : (
              <div
                className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base"
                onClick={handleAddUserCharacter}
              >
                <Plus className="h-5 w-5" />
                <p>Add User Character</p>
              </div>
            )}
          </div>

          {/* User Character Selection Dialog */}
          <CharacterSelectionDialog
            open={isUserCharacterDialogOpen}
            onOpenChange={setIsUserCharacterDialogOpen}
            selectedCharacters={[]}
            onConfirm={handleConfirmUserCharacter}
            excludeCharacterIds={session.aiCharacterCardIds.map((id) =>
              id.toString(),
            )}
            isMultipleSelect={false}
            title="Select User Character"
            description="Choose a character to play as in this session"
            confirmButtonText="Add"
          />
        </section>

        <section>
          <h3 className="font-semibold">Scenario</h3>
          <div>
            {session.plotCard ? (
              <ScenarioPreviewItem
                scenarioId={session.plotCard.id}
                onClick={() => {
                  navigate({
                    to: "/assets/scenarios/$scenarioId",
                    params: {
                      scenarioId: session.plotCard?.id.toString() ?? "",
                    },
                  });
                }}
              />
            ) : (
              <div
                className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base"
                onClick={handleAddScenario}
              >
                <Plus className="h-5 w-5" />
                <p>Add Scenario</p>
              </div>
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

        <section>
          <h3 className="font-semibold">Workflow</h3>
          <div>
            {isLoadingFlow ? (
              <Loading size="sm" />
            ) : flow ? (
              <FlowPreview
                title={flow?.props.name ?? "No flow selected"}
                description={flow?.props.description}
                nodeCount={flow?.props.nodes.length}
                className="min-h-[140px]"
                onClick={() => {
                  if (!flow?.id) return;

                  navigate({
                    to: "/assets/workflows/$workflowId",
                    params: { workflowId: flow.id.toString() },
                  });
                }}
              />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No flow selected</p>
              </div>
            )}
          </div>
        </section>

        <section className="block md:hidden!">
          <h3 className="font-semibold">Auto reply setting</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-900 px-4 py-2">
              <span>Auto reply</span>
              <Switch
                checked={autoReply === AutoReply.Random}
                onCheckedChange={handleAutoReply}
              />
            </div>
            <p className="text-xs text-gray-300">
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
                className="cursor-pointer text-gray-300 hover:text-gray-50"
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
                className="h-32 w-full rounded-lg object-cover"
                src={coverImageSrc}
                alt="Cover image"
              />
            ) : (
              <div className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base">
                <FileUp className="h-5 w-5" />
                <p>Upload Cover Image</p>
              </div>
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
                className="h-32 w-full rounded-lg object-cover"
                src={backgroundImageSrc}
                alt="Background image"
              />
            ) : (
              <div className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base">
                <Image className="h-5 w-5" />
                <p>Select Background Image</p>
              </div>
            )}
          </button>

          <DialogBase
            open={isBackgroundDialogOpen}
            onOpenChange={setIsBackgroundDialogOpen}
            title="Select Background"
            content={
              <BackgroundGrid
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
                    className="h-32 w-full rounded-lg object-cover"
                    src={backgroundImageSrc}
                    alt="Background image"
                  />
                ) : (
                  <div className="bg-black-alternate text-text-secondary hover:bg-black-alternate/10 flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-medium transition-colors md:text-base">
                    <Image className="h-5 w-5" />
                    <p>Select Background Image</p>
                  </div>
                )}
              </div>
            }
            content={
              <BackgroundGrid
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
      </div>
    </aside>
  );
};

export default memo(SessionSettingsSidebar);
