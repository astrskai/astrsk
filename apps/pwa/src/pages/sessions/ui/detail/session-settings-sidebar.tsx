import { useCallback, useMemo, memo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/shared/lib";
import {
  PanelRightClose,
  Ellipsis,
  Pencil,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { Session } from "@/entities/session/domain/session";
import {
  isDefaultBackground,
  useBackgroundStore,
} from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { useFlow } from "@/shared/hooks/use-flow";
import { Loading, PopoverBase, DropdownMenuBase } from "@/shared/ui";
import { DialogConfirm } from "@/shared/ui/dialogs/confirm";
import CharacterItem from "./settings/character-item";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import { PlotCard } from "@/entities/card/domain";
import { useCard } from "@/shared/hooks/use-card";
import { UniqueEntityID } from "@/shared/domain";
import FlowPreview from "@/features/flow/ui/flow-preview";
import MessageStyling from "./settings/message-styling";
import BackgroundGrid from "./settings/background-grid";
import {
  fetchSession,
  useSaveSession,
  useDeleteSession,
} from "@/entities/session/api";

interface SessionSettingsSidebarProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

const ScenarioPreviewItem = ({
  scenarioId,
}: {
  scenarioId: UniqueEntityID;
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
    />
  );
};

const SessionSettingsSidebar = ({
  session,
  isOpen,
  onClose,
}: SessionSettingsSidebarProps) => {
  const navigate = useNavigate();
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);
  const saveSessionMutation = useSaveSession();
  const deleteSessionMutation = useDeleteSession();
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(session.title ?? "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(session.backgroundId?.toString() ?? "");
  const [backgroundAsset] = useAsset(background?.assetId);

  const backgroundImageSrc = useMemo(() => {
    if (background && isDefaultBackground(background)) {
      return background.src;
    }
    return backgroundAsset; // undefined or string
  }, [background, backgroundAsset]);

  const handleChangeBackground = useCallback(
    async (backgroundId: UniqueEntityID | undefined) => {
      try {
        // Fetch latest session data
        const latestSession = await fetchSession(session.id);

        // Update background
        latestSession.update({ backgroundId });

        // Save to backend
        await saveSessionMutation.mutateAsync({ session: latestSession });

        // Close popover
        setIsPopoverOpen(false);

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

  return (
    <aside
      className={cn(
        "bg-background-primary fixed top-0 right-0 z-30 h-full w-100 overflow-y-auto",
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
              session.aiCharacterCardIds.map((characterId) => (
                <CharacterItem
                  key={characterId.toString()}
                  characterId={characterId}
                />
              ))
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No AI characters</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">User Character</h3>
          <div>
            {session.userCharacterCardId ? (
              <CharacterItem
                key={session.userCharacterCardId.toString()}
                characterId={session.userCharacterCardId}
              />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No user character</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Scenario</h3>
          <div>
            {session.plotCard ? (
              <ScenarioPreviewItem scenarioId={session.plotCard.id} />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No scenario</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Workflow</h3>
          <div>
            {isLoadingFlow ? (
              <Loading size="sm" />
            ) : (
              <FlowPreview
                title={flow?.props.name ?? "No flow selected"}
                description={flow?.props.description}
                nodeCount={flow?.props.nodes.length}
                className="min-h-[140px]"
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Background image</h3>
          <PopoverBase
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            side="left"
            align="start"
            className="w-[480px]"
            trigger={
              <div className="cursor-pointer rounded-lg transition-opacity hover:opacity-80">
                {backgroundImageSrc ? (
                  <img
                    className="h-32 w-full rounded-lg object-cover"
                    src={backgroundImageSrc}
                    alt="Background image"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                    <p className="text-sm text-gray-400">No background image</p>
                  </div>
                )}
              </div>
            }
            content={
              <BackgroundGrid
                currentBackgroundId={session.backgroundId}
                onSelect={handleChangeBackground}
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
