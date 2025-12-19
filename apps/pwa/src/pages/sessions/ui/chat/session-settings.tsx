import {
  MutableRefObject,
  useCallback,
  useRef,
  useState,
  useMemo,
  useId,
} from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  FileUp,
  Image,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/shared/lib";
import { useSession } from "@/shared/hooks/use-session";
import { useFlow } from "@/shared/hooks/use-flow";
import { useCard } from "@/shared/hooks/use-card";
import { useSessionSettingsHandlers } from "@/shared/hooks/use-session-settings-handlers";
import { useSessionStore } from "@/shared/stores/session-store";
import { useIsTouchDevice } from "@/shared/hooks/use-is-touch-device";
import { UniqueEntityID } from "@/shared/domain";
import { fetchSession, useSaveSession } from "@/entities/session/api";
import { CardTab } from "@/features/session/create-session/step-cards";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";
import { ScenarioSelectionDialog } from "@/features/scenario/ui/scenario-selection-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui";
import { DialogBase } from "@/shared/ui/dialogs/base";
import {
  CharacterCard as CharacterCardUI,
  type CardAction,
  type CardBadge,
} from "@astrsk/design-system/character-card";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { useQuery } from "@tanstack/react-query";
import {
  backgroundQueries,
  getDefaultBackground,
  getBackgroundAssetId,
} from "@/entities/background/api";
import { AssetService } from "@/app/services/asset-service";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import BackgroundGrid from "./settings/background-grid";
import MessageStyling from "./settings/message-styling";
import { IconWorkflow } from "@/shared/assets";

interface SessionSettingsProps {
  actionButton?: React.ReactNode;
  setIsOpenSettings: (open: boolean) => void;
  refEditCards: React.RefObject<HTMLDivElement>;
  refInitCardTab: MutableRefObject<CardTab>;
  isSettingsOpen: boolean;
}

/**
 * Section wrapper with consistent styling
 */
const Section = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-surface-raised rounded-xl border p-3 md:p-5",
        "border-border-muted hover:border-border-emphasis transition-colors",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-fg-default text-base font-bold md:text-lg">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

const SectionCarousel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Carousel>
      <CarouselContent className="mr-2 ml-0 gap-4 md:mr-4">
        {children}
      </CarouselContent>
      <CarouselPrevious
        className="bg-surface-raised border-border-muted left-2 h-8 w-8 border disabled:hidden md:left-4 md:h-10 md:w-10"
        variant="ghost_white"
      />
      <CarouselNext
        className="bg-surface-raised border-border-muted right-2 h-8 w-8 border disabled:hidden md:right-4 md:h-10 md:w-10"
        variant="ghost_white"
      />
    </Carousel>
  );
};

/**
 * Character Card Content (used in both grid and carousel)
 */
const CharacterCardContent = ({
  cardId,
  onDelete,
  onAdd,
  isEmpty = false,
  label,
}: {
  cardId?: UniqueEntityID;
  onDelete?: () => void;
  onAdd?: () => void;
  isEmpty?: boolean;
  label?: string;
}) => {
  const [card] = useCard(cardId);
  const [iconUrl] = useAsset(card?.props?.iconAssetId);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = useCallback(() => {
    if (cardId && !isEmpty) {
      // Get current sessionId from URL to construct returnTo path
      const sessionId = window.location.pathname.split('/').pop();
      navigate({
        to: "/assets/characters/{-$characterId}",
        params: { characterId: cardId.toString() },
        search: {
          mode: "edit" as const,
          returnTo: `/sessions/settings/${sessionId}`,
        },
      });
    }
  }, [cardId, isEmpty, navigate]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete],
  );

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAdd?.();
    },
    [onAdd],
  );

  // Build badges array
  const badges: CardBadge[] = label
    ? [{ label: label.toUpperCase(), variant: "default" as const }]
    : [];

  // Empty state - "No persona" using CharacterCard component
  if (isEmpty) {
    return (
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CharacterCardUI
          name="No persona"
          imageUrl={null}
          summary=""
          tags={[]}
          tokenCount={0}
          className="!h-[320px] !min-h-[320px] w-full"
          badges={badges}
        />

        {/* Hover overlay with add button */}
        {isHovered && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50 transition-opacity">
            <button
              onClick={handleAddClick}
              className="z-20 rounded-full bg-white p-3 text-black transition-transform hover:scale-110"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Build actions array
  const actions: CardAction[] = onDelete
    ? [
        {
          icon: Trash2,
          label: "Delete",
          onClick: handleDeleteClick,
          className: "text-red-400 hover:text-red-300",
        },
      ]
    : [];

  // Character card with click navigation and delete action
  return (
    <CharacterCardUI
      name={card?.props?.title || card?.props?.name || "Loading..."}
      imageUrl={iconUrl ?? null}
      summary={card?.props?.description || ""}
      tags={card?.props?.tags || []}
      tokenCount={card?.props?.tokenCount ?? 0}
      className="!h-[320px] !min-h-[320px] w-full"
      onClick={handleCardClick}
      actions={actions}
      badges={badges}
    />
  );
};

/**
 * Interactive Character Card for Carousel (wrapped in CarouselItem)
 */
const InteractiveCharacterCard = (props: {
  cardId?: UniqueEntityID;
  onDelete?: () => void;
  onAdd?: () => void;
  isEmpty?: boolean;
  label?: string;
}) => {
  return (
    <CarouselItem className="relative min-w-[220px] basis-1/5 py-6 pl-6 lg:basis-1/6">
      <div className="w-[220px]">
        <CharacterCardContent {...props} />
      </div>
    </CarouselItem>
  );
};

/**
 * Interactive Character Card for Grid (no CarouselItem wrapper)
 */
const InteractiveCharacterCardGrid = (props: {
  cardId?: UniqueEntityID;
  onDelete?: () => void;
  onAdd?: () => void;
  isEmpty?: boolean;
  label?: string;
}) => {
  return (
    <div className="relative">
      <CharacterCardContent {...props} />
    </div>
  );
};

/**
 * Add Character Card Content (used in both grid and carousel)
 */
const AddCharacterCardContent = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <button
      onClick={onAdd}
      className="group flex w-full flex-col items-center justify-start gap-2"
    >
      <div className="border-border-muted bg-surface-raised hover:border-fg-muted hover:bg-surface-overlay flex h-[320px] w-full items-center justify-center rounded-lg border-2 border-dashed transition-all">
        <Plus className="text-fg-subtle group-hover:text-fg-default h-8 w-8 transition-colors" />
      </div>
    </button>
  );
};

/**
 * Add Character Placeholder Card for Carousel
 */
const AddCharacterCard = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <CarouselItem className="min-w-[220px] basis-1/5 py-6 pl-6 lg:basis-1/6">
      <div className="w-[220px]">
        <AddCharacterCardContent onAdd={onAdd} />
      </div>
    </CarouselItem>
  );
};

/**
 * Add Character Placeholder Card for Grid
 */
const AddCharacterCardGrid = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <div className="relative">
      <AddCharacterCardContent onAdd={onAdd} />
    </div>
  );
};

/**
 * Background Preview Component
 */
const BackgroundPreview = ({
  backgroundId,
}: {
  backgroundId: UniqueEntityID | null | undefined;
}) => {
  const defaultBg = backgroundId
    ? getDefaultBackground(backgroundId)
    : undefined;

  const { data: background } = useQuery({
    ...backgroundQueries.detail(backgroundId ?? undefined),
    enabled: !!backgroundId && !defaultBg,
  });

  const [backgroundAsset] = useAsset(getBackgroundAssetId(background));

  const backgroundImageSrc = useMemo(() => {
    if (defaultBg) {
      return defaultBg.src;
    }
    return backgroundAsset; // undefined or string
  }, [defaultBg, backgroundAsset]);

  if (!backgroundImageSrc) {
    return null;
  }

  return (
    <img
      src={backgroundImageSrc}
      alt="Background"
      className="h-full w-full object-cover"
    />
  );
};

/**
 * New SessionSettings layout matching the HTML example
 * Display-only components with same visual style as Scenario section
 */
export const SessionSettings = ({
  actionButton,
  setIsOpenSettings,
  refEditCards,
  refInitCardTab,
  isSettingsOpen,
}: SessionSettingsProps) => {
  const navigate = useNavigate();
  const { selectedSessionId } = useSessionStore();
  const [session] = useSession(selectedSessionId);
  const { data: flow } = useFlow(session?.flowId);
  const saveSessionMutation = useSaveSession();

  // Touch device detection for always-visible action buttons
  const isTouchDevice = useIsTouchDevice();

  // Fetch plot card data
  const [plotCard] = useCard(session?.plotCard?.id);

  // All session settings handlers from reusable hook
  const {
    handleDeleteUserCharacter,
    handleSetUserCharacter,
    handleDeleteAICharacter,
    handleAddAICharacter: handleAddAICharacterToSession,
    handleUpdateSession,
  } = useSessionSettingsHandlers(session);

  // Character selection dialog state
  const [isUserCharacterDialogOpen, setIsUserCharacterDialogOpen] =
    useState(false);
  const [isAICharacterDialogOpen, setIsAICharacterDialogOpen] = useState(false);

  // Scenario selection dialog state
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false);

  // Background dialog state
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);

  // Session name edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedName, setEditedName] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Cover image handlers
  const coverImageInputId = useId();
  const [coverImageSrc] = useAsset(session?.coverId);

  const handleCoverImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!session) return;

      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Upload file to asset
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

        // Update session with new cover ID
        await handleUpdateSession({ coverId: asset.id });
        toastSuccess("Cover image uploaded successfully");
      } catch (error) {
        toastError("Failed to upload cover image", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Reset the input
      e.target.value = "";
    },
    [session, handleUpdateSession],
  );

  const handleDeleteCoverImage = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session?.coverId) return;

      try {
        await handleUpdateSession({ coverId: null });
        toastSuccess("Cover image removed successfully");
      } catch (error) {
        toastError("Failed to remove cover image", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, handleUpdateSession],
  );

  // Background change handler
  const handleChangeBackground = useCallback(
    async (backgroundId: UniqueEntityID | undefined) => {
      if (!session) return;

      try {
        await handleUpdateSession({ backgroundId: backgroundId ?? null });
        setIsBackgroundDialogOpen(false);
      } catch (error) {
        toastError("Failed to update background", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, handleUpdateSession],
  );

  // Dialog handlers
  const handleAddUserCharacter = useCallback(() => {
    setIsUserCharacterDialogOpen(true);
  }, []);

  const handleUserCharacterSelected = useCallback(
    async (characters: CharacterCard[]) => {
      const characterId =
        characters.length > 0 ? characters[0].id.toString() : null;
      await handleSetUserCharacter(characterId);
      setIsUserCharacterDialogOpen(false);
    },
    [handleSetUserCharacter],
  );

  const handleAddAICharacter = useCallback(() => {
    setIsAICharacterDialogOpen(true);
  }, []);

  const handleAICharacterSelected = useCallback(
    async (characters: CharacterCard[]) => {
      if (characters.length > 0) {
        await handleAddAICharacterToSession(characters[0].id.toString());
      }
      setIsAICharacterDialogOpen(false);
    },
    [handleAddAICharacterToSession],
  );

  // Session name edit handlers
  const handleStartEditTitle = useCallback(() => {
    setEditedName(session?.name || "");
    setIsEditingTitle(true);
    // Focus input after state update
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [session?.name]);

  const handleSaveTitle = useCallback(async () => {
    if (!session) return;

    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== session.name) {
      try {
        const latestSession = await fetchSession(session.id);
        latestSession.update({ name: trimmedName });
        await saveSessionMutation.mutateAsync({ session: latestSession });
        toastSuccess("Session name updated");
      } catch (error) {
        toastError("Failed to update session name", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    setIsEditingTitle(false);
  }, [session, editedName, saveSessionMutation]);

  const handleCancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
    setEditedName("");
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSaveTitle();
      } else if (e.key === "Escape") {
        handleCancelEditTitle();
      }
    },
    [handleSaveTitle, handleCancelEditTitle],
  );

  if (!session) return null;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-3 p-4 md:space-y-4">
      {/* Header: Session Name + Start Button - Always single row */}
      <header className="bg-surface-raised border-border-muted rounded-xl border p-3 md:p-5">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Back to sessions"
            onClick={() => navigate({ to: "/sessions" })}
            className="text-fg-subtle hover:text-fg-default -ml-1 flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/5 md:p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
            <span className="text-fg-muted text-[10px] font-medium tracking-wider uppercase md:text-xs">
              Session Template
            </span>

            {/* Session Name - Inline Edit */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-fg-default bg-surface-overlay border-border-subtle focus:border-accent-primary w-full min-w-0 rounded-lg border px-2 py-1 text-base font-bold focus:outline-none md:px-3 md:py-1.5 md:text-xl"
                  placeholder="Session name"
                />
                <button
                  onClick={handleSaveTitle}
                  className="text-status-success hover:bg-status-success/10 flex-shrink-0 rounded-lg p-1.5 transition-colors"
                  aria-label="Save title"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEditTitle}
                  className="text-fg-subtle hover:text-fg-default hover:bg-surface-overlay flex-shrink-0 rounded-lg p-1.5 transition-colors"
                  aria-label="Cancel editing"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className="text-fg-default truncate text-base font-bold md:text-2xl">
                  {session.name || "Untitled Session"}
                </h1>
                <button
                  onClick={handleStartEditTitle}
                  className={cn(
                    "text-fg-muted hover:text-fg-default flex-shrink-0 rounded-lg p-1 transition-all hover:bg-white/5 md:p-1.5",
                    isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Button - Icon only on mobile, full button on desktop */}
          {actionButton && (
            <div className="flex-shrink-0">{actionButton}</div>
          )}
        </div>
      </header>

      {/* Row 1: Characters */}
      <Section title="Characters">
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {/* User Character Card */}
          <InteractiveCharacterCardGrid
            cardId={session?.userCharacterCardId}
            isEmpty={!session?.userCharacterCardId}
            onDelete={
              session?.userCharacterCardId
                ? handleDeleteUserCharacter
                : undefined
            }
            onAdd={
              !session?.userCharacterCardId ? handleAddUserCharacter : undefined
            }
            label="User"
          />

          {/* AI Character Cards */}
          {session?.aiCharacterCardIds.map((cardId: UniqueEntityID) => (
            <InteractiveCharacterCardGrid
              key={cardId.toString()}
              cardId={cardId}
              onDelete={() => handleDeleteAICharacter(cardId)}
            />
          ))}

          {/* Add AI Character Button */}
          <AddCharacterCardGrid onAdd={handleAddAICharacter} />
        </div>

        {/* Desktop: Carousel */}
        <div className="hidden md:block">
          <SectionCarousel>
            {/* User Character Card */}
            <InteractiveCharacterCard
              cardId={session?.userCharacterCardId}
              isEmpty={!session?.userCharacterCardId}
              onDelete={
                session?.userCharacterCardId
                  ? handleDeleteUserCharacter
                  : undefined
              }
              onAdd={
                !session?.userCharacterCardId
                  ? handleAddUserCharacter
                  : undefined
              }
              label="User"
            />

            {/* AI Character Cards */}
            {session?.aiCharacterCardIds.map((cardId: UniqueEntityID) => (
              <InteractiveCharacterCard
                key={cardId.toString()}
                cardId={cardId}
                onDelete={() => handleDeleteAICharacter(cardId)}
              />
            ))}

            {/* Add AI Character Button */}
            <AddCharacterCard onAdd={handleAddAICharacter} />
          </SectionCarousel>
        </div>
      </Section>

      {/* Character Selection Dialogs */}
      <CharacterSelectionDialog
        open={isUserCharacterDialogOpen}
        onOpenChange={setIsUserCharacterDialogOpen}
        selectedCharacters={[]}
        onConfirm={handleUserCharacterSelected}
        title="Select User Character"
      />

      <CharacterSelectionDialog
        open={isAICharacterDialogOpen}
        onOpenChange={setIsAICharacterDialogOpen}
        selectedCharacters={[]}
        onConfirm={handleAICharacterSelected}
        title="Select AI Character"
      />

      {/* Row 2: Narrative (Scenario + Workflow) */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
        {/* Scenario - 2/3 width on desktop */}
        <Section
          title="Scenario"
          className="flex h-64 flex-col md:h-80 lg:col-span-2"
        >
          <button
            onClick={() => {
              if (plotCard?.id) {
                // Get current sessionId from URL to construct returnTo path
                const sessionId = window.location.pathname.split('/').pop();
                navigate({
                  to: "/assets/scenarios/{-$scenarioId}",
                  params: { scenarioId: plotCard.id.toString() },
                  search: { returnTo: `/sessions/settings/${sessionId}` },
                });
              }
            }}
            className="hover:bg-surface-overlay/50 flex-grow cursor-pointer space-y-3 overflow-y-auto rounded-lg p-2 text-left transition-colors md:space-y-4"
          >
            {plotCard ? (
              <>
                <div>
                  <label className="text-fg-subtle mb-1.5 block text-[10px] font-bold tracking-wider uppercase md:mb-2 md:text-xs">
                    Description
                  </label>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-accent-primary h-14 w-1 rounded-full md:h-18"></div>
                    <p className="text-fg-default line-clamp-3 text-sm font-medium md:line-clamp-4">
                      {plotCard.props.description}
                    </p>
                  </div>
                </div>

                {plotCard.props.firstMessages &&
                  plotCard.props.firstMessages.length > 0 && (
                    <div>
                      <label className="text-fg-subtle mb-1.5 block text-[10px] font-bold tracking-wider uppercase md:mb-2 md:text-xs">
                        First Message
                      </label>
                      <div className="bg-surface-overlay border-border-subtle overflow-hidden rounded-lg border p-2 md:p-3">
                        <div className="text-fg-muted line-clamp-2 text-sm leading-5">
                          {plotCard.props.firstMessages[0].description ||
                            "No first message"}
                        </div>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="text-fg-subtle flex h-full items-center justify-center">
                <p className="text-sm">No scenario selected</p>
              </div>
            )}
          </button>
        </Section>

        {/* Workflow - 1/3 width on desktop */}
        <Section title="Workflow" className="flex h-48 flex-col md:h-80">
          <button
            onClick={() => {
              if (session?.props.flowId) {
                navigate({
                  to: "/assets/workflows/$workflowId",
                  params: { workflowId: session.props.flowId.toString() },
                });
              }
            }}
            className="border-border-subtle group hover:border-border-emphasis relative flex flex-grow cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-colors"
          >
            <IconWorkflow className="text-fg-subtle group-hover:text-fg-default h-12 w-12 transition-colors md:h-16 md:w-16" />
          </button>
        </Section>
      </div>

      {/* Row 3: Visuals & Styling - 3 equal columns */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {/* Cover Image */}
        <Section title="Cover Image" className="flex h-56 flex-col md:h-72">
          <div
            className={cn(
              "border-border-subtle relative flex-grow overflow-hidden rounded-lg border transition-colors",
              coverImageSrc ? "border-2" : "hover:border-border-emphasis",
            )}
          >
            <label
              htmlFor={coverImageInputId}
              className="block h-full cursor-pointer"
            >
              {coverImageSrc ? (
                <div className="group relative h-full">
                  <img
                    src={coverImageSrc}
                    alt="Cover image"
                    className="h-full w-full object-cover"
                  />
                  {/* Delete button on hover (always visible on touch devices) */}
                  <button
                    onClick={handleDeleteCoverImage}
                    className={cn(
                      "absolute top-2 right-2 z-10 rounded-full bg-black/60 p-1.5 text-white shadow-lg transition-all hover:bg-red-500/80 md:p-2",
                      isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-fg-subtle hover:text-fg-default flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors">
                    <FileUp className="h-6 w-6 md:h-8 md:w-8" />
                    <p>Upload cover</p>
                  </div>
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
          </div>
        </Section>

        {/* Background */}
        <Section title="Background" className="flex h-56 flex-col md:h-72">
          <div
            className={cn(
              "border-border-subtle relative flex-grow overflow-hidden rounded-lg border transition-colors",
              session?.backgroundId
                ? "border-2"
                : "hover:border-border-emphasis",
            )}
          >
            <button
              onClick={() => setIsBackgroundDialogOpen(true)}
              className="h-full w-full cursor-pointer transition-opacity hover:opacity-90"
            >
              {session?.backgroundId ? (
                <BackgroundPreview backgroundId={session.backgroundId} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-fg-subtle hover:text-fg-default flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors">
                    <Image className="h-6 w-6 md:h-8 md:w-8" />
                    <p>Select background</p>
                  </div>
                </div>
              )}
            </button>
          </div>
        </Section>

        {/* Message Styling */}
        <Section title="Message Styling" className="flex h-56 flex-col md:h-72">
          <div className="flex flex-grow items-center">
            <div className="flex-grow overflow-y-auto">
              <MessageStyling
                sessionId={session.id}
                chatStyles={session.chatStyles}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* Background Selection Dialog */}
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
    </div>
  );
};
