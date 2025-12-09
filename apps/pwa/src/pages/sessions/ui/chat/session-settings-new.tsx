import {
  MutableRefObject,
  useCallback,
  useRef,
  useState,
  useMemo,
  useId,
} from "react";
import { Plus, Trash2, ArrowLeft, FileUp, Image, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/shared/lib";
import { useSession } from "@/shared/hooks/use-session";
import { useFlow } from "@/shared/hooks/use-flow";
import { useCard } from "@/shared/hooks/use-card";
import { useSessionSettingsHandlers } from "@/shared/hooks/use-session-settings-handlers";
import { useSessionStore } from "@/shared/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { fetchSession, useSaveSession } from "@/entities/session/api";
import { CardTab } from "@/features/session/create-session/step-cards";
import { CharacterSelectionDialog } from "@/features/character/ui/character-selection-dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/shared/ui";
import { DialogBase } from "@/shared/ui/dialogs/base";
import CharacterCardUI from "@/features/character/ui/character-card";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { useQuery } from "@tanstack/react-query";
import { backgroundQueries, getDefaultBackground, getBackgroundAssetId } from "@/entities/background/api";
import { AssetService } from "@/app/services/asset-service";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import BackgroundGrid from "./settings/background-grid";
import MessageStyling from "./settings/message-styling";
import { IconWorkflow } from "@/shared/assets";

interface SessionSettingsNewProps {
  actionButton?: React.ReactNode;
  setIsOpenSettings: (open: boolean) => void;
  refEditCards: React.RefObject<HTMLDivElement>;
  refInitCardTab: MutableRefObject<CardTab>;
  isSettingsOpen: boolean;
}

/**
 * Section wrapper matching HTML example styling
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
        "bg-surface-raised rounded-xl border border-border-muted p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-fg-default">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const SectionCarousel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Carousel>
      <CarouselContent className="mr-4 ml-0 max-md:mr-2 max-md:ml-0 gap-4">
        {children}
      </CarouselContent>
      <CarouselPrevious
        className="bg-surface-raised border-border-muted border disabled:hidden left-4 max-md:left-2 max-md:h-8 max-md:w-8"
        variant="ghost_white"
      />
      <CarouselNext
        className="bg-surface-raised border-border-muted border disabled:hidden right-4 max-md:right-2 max-md:h-8 max-md:w-8"
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
  const [isHovered, setIsHovered] = useState(false);
  const [card] = useCard(cardId);
  const [iconUrl] = useAsset(card?.props?.iconAssetId);
  const navigate = useNavigate();

  const handleCardClick = useCallback(() => {
    if (cardId && !isEmpty) {
      navigate({
        to: "/assets/characters/{-$characterId}",
        params: { characterId: cardId.toString() },
        search: { mode: "edit" as const },
      });
    }
  }, [cardId, isEmpty, navigate]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  }, [onDelete]);

  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.();
  }, [onAdd]);

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
          className="w-full !min-h-[320px] !h-[320px]"
        />

        {/* Label overlay */}
        {label && (
          <div className="absolute top-2 left-2 text-xs font-bold text-white uppercase tracking-wider bg-black/70 px-2 py-1 rounded z-10">
            {label}
          </div>
        )}

        {/* Hover overlay with add button */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity rounded-lg z-10">
            <button
              onClick={handleAddClick}
              className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform z-20"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Character card with click navigation and delete button on top-right
  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative cursor-pointer"
        onClick={handleCardClick}
      >
        <CharacterCardUI
          name={card?.props?.title || card?.props?.name || "Loading..."}
          imageUrl={iconUrl ?? null}
          summary={card?.props?.description || ""}
          tags={card?.props?.tags || []}
          tokenCount={card?.props?.tokenCount ?? 0}
          className="w-full !min-h-[320px] !h-[320px]"
        />

        {/* Label overlay */}
        {label && (
          <div className="absolute top-2 left-2 text-xs font-bold text-white uppercase tracking-wider bg-black/70 px-2 py-1 rounded z-10">
            {label}
          </div>
        )}

        {/* Delete button on top-right corner */}
        {isHovered && onDelete && (
          <button
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform z-20 shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
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
    <CarouselItem className="relative basis-1/5 py-6 pl-6 lg:basis-1/6 min-w-[220px]">
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
      className="flex flex-col items-center justify-start gap-2 group w-full"
    >
      <div className="w-full h-[320px] rounded-lg border-2 border-dashed border-border-muted bg-surface-raised hover:border-fg-muted hover:bg-surface-overlay transition-all flex items-center justify-center">
        <Plus className="h-8 w-8 text-fg-subtle group-hover:text-fg-default transition-colors" />
      </div>
    </button>
  );
};

/**
 * Add Character Placeholder Card for Carousel
 */
const AddCharacterCard = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <CarouselItem className="basis-1/5 py-6 pl-6 lg:basis-1/6 min-w-[220px]">
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
const BackgroundPreview = ({ backgroundId }: { backgroundId: UniqueEntityID | null | undefined }) => {
  const defaultBg = backgroundId ? getDefaultBackground(backgroundId) : undefined;

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
      className="w-full h-full object-cover"
    />
  );
};

/**
 * New SessionSettings layout matching the HTML example
 * Display-only components with same visual style as Scenario section
 */
export const SessionSettingsNew = ({
  actionButton,
  setIsOpenSettings,
  refEditCards,
  refInitCardTab,
  isSettingsOpen,
}: SessionSettingsNewProps) => {
  const navigate = useNavigate();
  const { selectedSessionId } = useSessionStore();
  const [session] = useSession(selectedSessionId);
  const { data: flow } = useFlow(session?.flowId);
  const saveSessionMutation = useSaveSession();

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
  const [isUserCharacterDialogOpen, setIsUserCharacterDialogOpen] = useState(false);
  const [isAICharacterDialogOpen, setIsAICharacterDialogOpen] = useState(false);

  // Background dialog state
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);

  // Session title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
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
      const characterId = characters.length > 0 ? characters[0].id.toString() : null;
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

  // Session title edit handlers
  const handleStartEditTitle = useCallback(() => {
    setEditedTitle(session?.title || "");
    setIsEditingTitle(true);
    // Focus input after state update
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [session?.title]);

  const handleSaveTitle = useCallback(async () => {
    if (!session) return;

    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && trimmedTitle !== session.title) {
      try {
        const latestSession = await fetchSession(session.id);
        latestSession.update({ title: trimmedTitle });
        await saveSessionMutation.mutateAsync({ session: latestSession });
        toastSuccess("Session title updated");
      } catch (error) {
        toastError("Failed to update session title", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    setIsEditingTitle(false);
  }, [session, editedTitle, saveSessionMutation]);

  const handleCancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle("");
  }, []);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEditTitle();
    }
  }, [handleSaveTitle, handleCancelEditTitle]);

  if (!session) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto p-6 md:p-10 space-y-6">
      {/* Header: Session Title + Start Button */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Back to sessions"
            onClick={() => navigate({ to: "/sessions" })}
            className="cursor-pointer text-fg-subtle hover:text-fg-default"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-fg-muted font-semibold">Session</span>

          {/* Session Title - Inline Edit */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="px-2 py-1 text-fg-default font-medium bg-surface-overlay border border-border-subtle rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="Session title"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-fg-subtle hover:text-fg-default transition-colors"
                aria-label="Save title"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEditTitle}
                className="p-1 text-fg-subtle hover:text-fg-default transition-colors"
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="text-fg-default font-medium">{session.title || "Untitled Session"}</span>
              <button
                onClick={handleStartEditTitle}
                className="p-1 text-fg-muted opacity-0 group-hover:opacity-100 hover:text-fg-default transition-all"
                aria-label="Edit title"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {actionButton}
      </header>

      {/* Row 1: Characters */}
      <Section title="Characters">
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {/* User Character Card */}
          <InteractiveCharacterCardGrid
            cardId={session?.userCharacterCardId}
            isEmpty={!session?.userCharacterCardId}
            onDelete={session?.userCharacterCardId ? handleDeleteUserCharacter : undefined}
            onAdd={!session?.userCharacterCardId ? handleAddUserCharacter : undefined}
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
              onDelete={session?.userCharacterCardId ? handleDeleteUserCharacter : undefined}
              onAdd={!session?.userCharacterCardId ? handleAddUserCharacter : undefined}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario - 2/3 width */}
        <Section title="Scenario" className="lg:col-span-2 h-80 flex flex-col">
          <div className="flex-grow space-y-4 overflow-y-auto pr-2">
            {plotCard ? (
              <>
                <div>
                  <label className="text-xs text-fg-subtle uppercase font-bold tracking-wider mb-2 block">
                    Description
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-18 w-1 bg-accent-primary rounded-full"></div>
                    <p className="text-sm text-fg-default font-medium line-clamp-4">{plotCard.props.description}</p>
                  </div>
                </div>

                {plotCard.props.firstMessages && plotCard.props.firstMessages.length > 0 && (
                  <div>
                    <label className="text-xs text-fg-subtle uppercase font-bold tracking-wider mb-2 block">
                      First Message
                    </label>
                    <div className="bg-surface-overlay p-3 rounded-lg border border-border-subtle overflow-hidden">
                      <div className="text-sm text-fg-muted leading-5 line-clamp-2">
                        {plotCard.props.firstMessages[0].description || "No first message"}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-fg-subtle">
                <p className="text-sm">No scenario selected</p>
              </div>
            )}
          </div>
        </Section>

        {/* Workflow - 1/3 width */}
        <Section title="Workflow" className="h-80 flex flex-col">
          <button
            onClick={() => {
              if (session?.props.flowId) {
                navigate({ to: "/assets/workflows/$workflowId", params: { workflowId: session.props.flowId.toString() } });
              }
            }}
            className="flex-grow rounded-lg border border-border-subtle relative overflow-hidden flex items-center justify-center transition-colors cursor-pointer group"
          >
            <IconWorkflow className="w-16 h-16 text-fg-subtle group-hover:text-fg-default transition-colors" />
          </button>
        </Section>
      </div>

      {/* Row 3: Visuals & Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cover Image - 1 column */}
        <Section title="Cover Image" className="h-72 flex flex-col">
          <div className={cn(
            "flex-grow rounded-lg relative overflow-hidden border border-border-subtle",
            coverImageSrc && "border-2"
          )}>
            <label htmlFor={coverImageInputId} className="cursor-pointer h-full block">
              {coverImageSrc ? (
                <div className="relative h-full group">
                  <img
                    src={coverImageSrc}
                    alt="Cover image"
                    className="w-full h-full object-cover"
                  />
                  {/* Delete button on hover */}
                  <button
                    onClick={handleDeleteCoverImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-10 shadow-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg text-fg-subtle hover:text-fg-default text-sm font-medium transition-colors md:text-base">
                    <FileUp className="h-5 w-5" />
                    <p>Upload cover image</p>
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

        {/* Background - 1 column */}
        <Section title="Background" className="h-72 flex flex-col">
          <div className={cn(
            "flex-grow rounded-lg relative overflow-hidden border border-border-subtle",
            session?.backgroundId && "border-2"
          )}>
            <button
              onClick={() => setIsBackgroundDialogOpen(true)}
              className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              {session?.backgroundId ? (
                <BackgroundPreview backgroundId={session.backgroundId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg text-fg-subtle hover:text-fg-default text-sm font-medium transition-colors md:text-base">
                    <Image className="h-5 w-5" />
                    <p>Select background</p>
                  </div>
                </div>
              )}
            </button>
          </div>
        </Section>

        {/* Message Styling - 2 columns */}
        <Section title="Message Styling" className="lg:col-span-2 h-72 flex flex-col">
          <div className="flex-grow flex items-center">
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
