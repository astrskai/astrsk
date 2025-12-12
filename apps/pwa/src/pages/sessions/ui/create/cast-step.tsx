import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { createPortal } from "react-dom";
import {
  User,
  Cpu,
  X,
  Plus,
  LayoutGrid,
  Users,
  Import,
  Activity,
  Info,
  Sparkles,
  AlertTriangle,
  Globe,
  Pencil,
  ArrowLeft,
  ImagePlus,
  Trash2,
  Search,
} from "lucide-react";
import { CharacterCard as DesignSystemCharacterCard } from "@astrsk/design-system/character-card";
import { Button } from "@astrsk/design-system/button";
import { IconInput } from "@astrsk/design-system/input";
import { Badge } from "@/shared/ui/badge";
import { Input, Textarea } from "@/shared/ui/forms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn, logger } from "@/shared/lib";
import { SESSION_STORAGE_KEYS } from "@/shared/storage";
import { UniqueEntityID } from "@/shared/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { useFilePreviewUrl } from "@/shared/hooks/use-file-preview-url";
import type { ChatMessage } from "./chat-panel";
import { MobileTabNav, type MobileTab } from "./mobile-tab-nav";
import type { ChatHandlers } from "./scenario-step";
import type { SessionStep } from "./session-stepper";
import {
  generateCharacterResponse,
  type CharacterBuilderMessage,
  type CharacterData,
} from "@/app/services/system-agents/character-builder-service";
import {
  DraftCharacter,
  generateTempId,
  getDraftCharacterName,
} from "./draft-character";
import { type FirstMessage } from "./scenario-step";

interface CastStepProps {
  // Current step for tagging chat messages
  currentStep: SessionStep;
  playerCharacter: DraftCharacter | null;
  aiCharacters: DraftCharacter[];
  onPlayerCharacterChange: (character: DraftCharacter | null) => void;
  onAiCharactersChange: (characters: DraftCharacter[]) => void;
  // Draft characters shown in library (from import/chat/create) - not yet assigned to roster
  draftCharacters: DraftCharacter[];
  onDraftCharactersChange: (characters: DraftCharacter[]) => void;
  onCreateCharacter: () => void;
  onImportCharacter: () => void;
  // Mobile tab state (controlled by parent for navigation)
  // Note: "chat" tab removed - now using MobileChatSheet bottom sheet
  mobileTab: "library" | "cast";
  onMobileTabChange: (tab: "library" | "cast") => void;
  // Chat messages (lifted to parent for persistence across step navigation)
  chatMessages?: ChatMessage[];
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  // Functional update helper to add a single message (avoids stale closure)
  addChatMessage?: (message: ChatMessage) => void;
  // Callback when a character is created via chat (returns DraftCharacter)
  onCharacterCreatedFromChat?: (character: DraftCharacter) => void;
  // Scenario context for AI character generation
  scenarioBackground?: string;
  firstMessages?: FirstMessage[];
  // Chat handlers ref (for parent to call submit/stop)
  chatHandlersRef: React.MutableRefObject<ChatHandlers | null>;
  // Chat UI state callbacks
  onChatLoadingChange: (loading: boolean) => void;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-placeholder.png";

// Initial welcome message for character creation
const WELCOME_MESSAGE_CONTENT =
  "Need a character? Describe who you're looking for — their personality, role, or vibe — and I'll help bring them to life. You can also browse existing characters in the library.";

// Flying trail animation constants
const TRAIL_ICON_SIZE = 48; // 12 * 4 = h-12 w-12
const TRAIL_ICON_OFFSET = TRAIL_ICON_SIZE / 2; // Center the icon on cursor
const PLAYER_SECTION_Y_OFFSET = 120; // Distance from roster top to player section
const AI_SECTION_Y_OFFSET = 300; // Distance from roster top to AI section

/**
 * Build character card badges based on selection state and source type
 * Labels are hidden on mobile (icon only) and shown on sm+ screens
 */
function buildCharacterBadges(
  isPlayer: boolean,
  isAI: boolean,
  isLocal: boolean,
  isLibrary: boolean = false,
) {
  // Mobile: icon only with compact padding (px-1.5), no gap (gap-0)
  // Desktop (sm+): icon + label with normal padding (px-2) and gap (sm:gap-1)
  const responsiveStyles = "px-1.5 sm:px-2 gap-0 sm:gap-1";
  const responsiveLabel = (text: string) => (
    <span className="hidden sm:inline">{text}</span>
  );

  return [
    // Source badge (left position) - icon only on mobile, with label on sm+
    ...(isLocal
      ? [
          {
            label: responsiveLabel("SESSION"),
            variant: "default" as const,
            position: "left" as const,
            className: `border-amber-500/30 bg-amber-950/50 text-amber-300 ${responsiveStyles}`,
            icon: <Sparkles size={10} />,
          },
        ]
      : isLibrary
        ? [
            {
              label: responsiveLabel("LIBRARY"),
              variant: "default" as const,
              position: "left" as const,
              className: `border-blue-500/30 bg-blue-950/50 text-blue-300 ${responsiveStyles}`,
              icon: <Globe size={10} />,
            },
          ]
        : []),
    // Selection badge (right position)
    ...(isPlayer
      ? [
          {
            label: responsiveLabel("PLAYER"),
            variant: "default" as const,
            position: "right" as const,
            className: `border-emerald-500/30 bg-emerald-950/50 text-emerald-300 ${responsiveStyles}`,
            icon: <User size={10} />,
          },
        ]
      : isAI
        ? [
            {
              label: responsiveLabel("AI"),
              variant: "default" as const,
              position: "right" as const,
              className: `border-purple-500/30 bg-purple-950/50 text-purple-300 ${responsiveStyles}`,
              icon: <Cpu size={10} />,
            },
          ]
        : []),
  ];
}

/**
 * Flying Trail Animation
 * Shows a ghost element flying from source card to roster panel
 */
interface FlyingTrail {
  id: string;
  startX: number;
  startY: number;
  targetType: "player" | "ai";
  imageUrl?: string;
  name: string;
}

function FlyingTrailOverlay({
  trails,
  onComplete,
  rosterRef,
}: {
  trails: FlyingTrail[];
  onComplete: (id: string) => void;
  rosterRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {trails.map((trail) => {
        // Calculate target position based on roster panel
        const rosterRect = rosterRef.current?.getBoundingClientRect();
        const targetX = rosterRect
          ? rosterRect.left + rosterRect.width / 2 - TRAIL_ICON_OFFSET
          : window.innerWidth - 200;
        const targetY = rosterRect
          ? trail.targetType === "player"
            ? rosterRect.top + PLAYER_SECTION_Y_OFFSET
            : rosterRect.top + AI_SECTION_Y_OFFSET
          : 200;

        return (
          <motion.div
            key={trail.id}
            initial={{
              x: trail.startX,
              y: trail.startY,
              scale: 1,
              opacity: 0.9,
            }}
            animate={{
              x: targetX,
              y: targetY,
              scale: 0.4,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.32, 0.72, 0, 1],
            }}
            onAnimationComplete={() => onComplete(trail.id)}
            className="pointer-events-none fixed z-[9999]"
            style={{ left: 0, top: 0 }}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl font-bold text-white shadow-lg",
                trail.targetType === "player"
                  ? "bg-emerald-500"
                  : "bg-purple-500",
              )}
            >
              {trail.imageUrl ? (
                <img
                  src={trail.imageUrl}
                  alt={trail.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                trail.name.substring(0, 2).toUpperCase()
              )}
            </div>
            {/* Trailing glow effect */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-xl blur-md",
                trail.targetType === "player"
                  ? "bg-emerald-500/50"
                  : "bg-purple-500/50",
              )}
              initial={{ scale: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Library Character Card Wrapper
 * Wraps design-system CharacterCard with asset loading and footer actions
 */
interface LibraryCharacterCardProps {
  card: CharacterCard;
  isPlayer: boolean;
  isAI: boolean;
  isLocal: boolean;
  onAssignPlayer: () => void;
  onAddAI: () => void;
  onOpenDetails: () => void;
  triggerFlyingTrail?: (
    event: React.MouseEvent,
    targetType: "player" | "ai",
    name: string,
    imageUrl?: string,
  ) => void;
}

function LibraryCharacterCard({
  card,
  isPlayer,
  isAI,
  isLocal,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
  triggerFlyingTrail,
}: LibraryCharacterCardProps) {
  const [imageUrl] = useAsset(card.props.iconAssetId);
  const isSelected = isPlayer || isAI;
  // Library cards: isLocal=false, isLibrary=true
  const badges = buildCharacterBadges(isPlayer, isAI, isLocal, true);

  return (
    <DesignSystemCharacterCard
      name={card.props.name || "Unnamed"}
      imageUrl={imageUrl}
      placeholderImageUrl={PLACEHOLDER_IMAGE_URL}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      badges={badges}
      onClick={onOpenDetails}
      renderMetadata={() => null}
      footerActions={
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) {
                triggerFlyingTrail?.(
                  e,
                  "player",
                  card.props.name || "Character",
                  imageUrl ?? undefined,
                );
                onAssignPlayer();
              }
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-emerald-600/10 hover:text-emerald-300",
            )}
          >
            <User size={10} className="sm:h-3 sm:w-3" /> PLAY AS
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) {
                triggerFlyingTrail?.(
                  e,
                  "ai",
                  card.props.name || "Character",
                  imageUrl ?? undefined,
                );
                onAddAI();
              }
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-purple-600/10 hover:text-purple-300",
            )}
          >
            <Cpu size={10} className="sm:h-3 sm:w-3" /> ADD AS AI
          </button>
        </>
      }
    />
  );
}

/**
 * Draft Character Card for Library
 * Displays import/chat/create characters in the library with SESSION badge
 * Includes edit action on hover (session characters are editable)
 */
interface DraftCharacterCardProps {
  draft: DraftCharacter;
  isPlayer: boolean;
  isAI: boolean;
  onAssignPlayer: (e: React.MouseEvent, imageUrl?: string) => void;
  onAddAI: (e: React.MouseEvent, imageUrl?: string) => void;
  onOpenDetails: (imageUrl?: string) => void;
  onEdit: () => void;
}

function DraftCharacterCard({
  draft,
  isPlayer,
  isAI,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
  onEdit,
}: DraftCharacterCardProps) {
  const isSelected = isPlayer || isAI;
  const name = draft.data?.name || "Unnamed";
  // Use hook to manage object URL lifecycle from imageFile
  const imageUrl = useFilePreviewUrl(
    draft.data?.imageFile,
    draft.data?.imageUrl,
  );
  // Draft characters are always local (session)
  const badges = buildCharacterBadges(isPlayer, isAI, true);

  return (
    <DesignSystemCharacterCard
      name={name}
      imageUrl={imageUrl}
      placeholderImageUrl={PLACEHOLDER_IMAGE_URL}
      summary={draft.data?.cardSummary}
      tags={draft.data?.tags || []}
      badges={badges}
      className="border-dashed border-amber-500/50"
      onClick={() => onOpenDetails(imageUrl)}
      renderMetadata={() => null}
      footerActions={
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) onAssignPlayer(e, imageUrl);
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-emerald-600/10 hover:text-emerald-300",
            )}
          >
            <User size={10} className="sm:h-3 sm:w-3" /> PLAY AS
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) onAddAI(e, imageUrl);
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-purple-600/10 hover:text-purple-300",
            )}
          >
            <Cpu size={10} className="sm:h-3 sm:w-3" /> ADD AS AI
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex items-center justify-center px-2 py-2 text-zinc-400 transition-all hover:bg-zinc-600/10 hover:text-zinc-200 sm:px-3 sm:py-3"
          >
            <Pencil size={12} className="sm:h-3.5 sm:w-3.5" />
          </button>
        </>
      }
    />
  );
}

/**
 * Cast Step
 * Step in new session stepper for character selection
 * Two-panel layout: Character Library (left) + Session Roster (right)
 */
export function CastStep({
  currentStep,
  playerCharacter,
  aiCharacters,
  onPlayerCharacterChange,
  onAiCharactersChange,
  draftCharacters,
  onDraftCharactersChange,
  onCreateCharacter,
  onImportCharacter,
  mobileTab,
  onMobileTabChange,
  chatMessages = [],
  onChatMessagesChange,
  addChatMessage,
  onCharacterCreatedFromChat,
  scenarioBackground,
  firstMessages,
  chatHandlersRef,
  onChatLoadingChange,
}: CastStepProps) {
  const [search, setSearch] = useState("");
  const [selectedDetailsChar, setSelectedDetailsChar] =
    useState<CharacterDetailsData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(
    () =>
      sessionStorage.getItem(
        SESSION_STORAGE_KEYS.CAST_STEP_INFO_BANNER_DISMISSED,
      ) !== "true",
  );
  const [showWarningBanner, setShowWarningBanner] = useState(
    () =>
      sessionStorage.getItem(
        SESSION_STORAGE_KEYS.CAST_STEP_WARNING_BANNER_DISMISSED,
      ) !== "true",
  );
  // Character being edited (null = library view, DraftCharacter = edit view)
  const [editingCharacter, setEditingCharacter] =
    useState<DraftCharacter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onChatMessagesChangeRef = useRef(onChatMessagesChange);

  // Keep ref in sync with prop
  useEffect(() => {
    onChatMessagesChangeRef.current = onChatMessagesChange;
  }, [onChatMessagesChange]);

  // Sync editingCharacter when draftCharacters changes (e.g., from AI chat updates)
  // Only sync when draftCharacters actually changes AND we're currently editing
  const prevDraftCharactersRef = useRef(draftCharacters);
  const prevEditingTempIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentTempId = editingCharacter?.tempId ?? null;

    // Skip if editingCharacter just changed (user action, not external update)
    if (prevEditingTempIdRef.current !== currentTempId) {
      prevEditingTempIdRef.current = currentTempId;
      prevDraftCharactersRef.current = draftCharacters;
      return;
    }

    // Only run if draftCharacters reference actually changed
    if (prevDraftCharactersRef.current === draftCharacters) {
      return;
    }
    prevDraftCharactersRef.current = draftCharacters;

    // Only sync if we're currently editing a character
    if (editingCharacter) {
      const updatedDraft = draftCharacters.find(
        (d) => d.tempId === editingCharacter.tempId,
      );
      if (updatedDraft && updatedDraft !== editingCharacter) {
        setEditingCharacter(updatedDraft);
      }
    }
  }, [draftCharacters, editingCharacter]);

  // Flying trail animation state
  const [flyingTrails, setFlyingTrails] = useState<FlyingTrail[]>([]);
  const rosterPanelRef = useRef<HTMLDivElement>(null);

  // Helper to trigger flying trail animation (desktop only)
  const triggerFlyingTrail = useCallback(
    (
      event: React.MouseEvent,
      targetType: "player" | "ai",
      name: string,
      imageUrl?: string,
    ) => {
      // Skip animation on mobile (< 768px) - roster panel is on separate tab
      if (window.innerWidth < 768) return;

      const rect = (event.currentTarget as HTMLElement)
        .closest("[data-card-wrapper]")
        ?.getBoundingClientRect();
      if (!rect) return;

      const trail: FlyingTrail = {
        id: `trail-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        startX: rect.left + rect.width / 2 - TRAIL_ICON_OFFSET,
        startY: rect.top + rect.height / 2 - TRAIL_ICON_OFFSET,
        targetType,
        imageUrl,
        name,
      };
      setFlyingTrails((prev) => [...prev, trail]);
    },
    [],
  );

  const handleTrailComplete = useCallback((id: string) => {
    setFlyingTrails((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Add initial welcome message with typing indicator and animation
  // useTypingIndicator hook handles both typing indicator and typewriter animation
  useEffect(() => {
    const hasCastMessages = chatMessages.some((m) => m.step === "cast");
    if (hasCastMessages) return;

    const welcomeMessage: ChatMessage = {
      id: "cast-welcome",
      role: "assistant",
      content: WELCOME_MESSAGE_CONTENT, // Full content - hook handles animation
      step: "cast",
      isSystemGenerated: true, // Exclude from AI chat history
      typingIndicatorDuration: 1500, // Show typing indicator for 1.5 seconds
      typingAnimation: true, // Animate the text after typing indicator
    };
    // Prepend welcome message to existing messages (from other steps)
    const currentMessages = chatMessages.filter((m) => m.step !== "cast");
    onChatMessagesChangeRef.current?.([...currentMessages, welcomeMessage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount, uses ref for callback
  }, []);

  // Handle character creation from AI - creates DraftCharacter without DB save
  const handleCharacterCreated = useCallback(
    (characterData: CharacterData) => {
      // Create a DraftCharacter with source: "chat" - NOT saved to DB until session creation
      const draftCharacter: DraftCharacter = {
        tempId: characterData.id || generateTempId(), // Use provided ID or generate new one
        source: "chat",
        data: {
          name: characterData.name,
          description: characterData.description,
          tags: characterData.tags,
          cardSummary: characterData.cardSummary,
          exampleDialogue: characterData.exampleDialogue,
        },
      };

      // Notify parent about the created draft character
      onCharacterCreatedFromChat?.(draftCharacter);

      // On mobile, switch to library tab to show the newly created character
      onMobileTabChange("library");

      logger.info("[CastStep] Draft character created from chat", {
        tempId: draftCharacter.tempId,
        name: characterData.name,
      });
    },
    [onCharacterCreatedFromChat, onMobileTabChange],
  );

  // Handle character update from AI - updates existing DraftCharacter
  const handleCharacterUpdated = useCallback(
    (id: string, updates: Partial<CharacterData>) => {
      // Find and update the draft character
      const updatedDrafts = draftCharacters.map((draft) => {
        if (draft.tempId === id && draft.data) {
          const existingData = draft.data; // Extract to satisfy TypeScript narrowing

          // Convert CharacterLorebookEntry[] to LorebookEntryData[] if lorebook is being updated
          const lorebookUpdate = updates.lorebook
            ? {
                lorebook: updates.lorebook.map((entry) => ({
                  id: entry.id,
                  name: entry.name,
                  enabled: entry.enabled,
                  keys: entry.keys,
                  recallRange: entry.recallRange,
                  content: entry.content,
                })),
              }
            : {};

          // Omit lorebook from updates and apply converted version
          const { lorebook: _, ...otherUpdates } = updates;

          return {
            ...draft,
            data: {
              ...existingData,
              ...otherUpdates,
              ...lorebookUpdate,
            },
          };
        }
        return draft;
      });

      onDraftCharactersChange(updatedDrafts);

      logger.info("[CastStep] Draft character updated from chat", {
        tempId: id,
        updates: Object.keys(updates),
      });
    },
    [draftCharacters, onDraftCharactersChange],
  );

  // Handle chat submit with AI character generation
  // Receives prompt from parent
  const handleChatSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isGenerating) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        step: currentStep,
      };
      const newMessages = [...chatMessages, userMessage];
      onChatMessagesChange?.(newMessages);

      // Start AI generation
      setIsGenerating(true);
      abortControllerRef.current = new AbortController();

      try {
        // Convert ChatMessage to CharacterBuilderMessage format
        // Filter out system-generated messages (welcome, etc.) from AI context
        const builderMessages: CharacterBuilderMessage[] = newMessages
          .filter((msg) => !msg.isSystemGenerated)
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

        // Build current characters list for context (only drafts with data)
        // Include source field to distinguish SESSION (editable) vs LIBRARY (read-only)
        const currentCharacters: CharacterData[] = draftCharacters
          .filter((draft) => draft.data !== undefined)
          .map((draft) => ({
            id: draft.tempId,
            name: draft.data!.name,
            description: draft.data!.description,
            tags: draft.data!.tags,
            cardSummary: draft.data!.cardSummary,
            exampleDialogue: draft.data!.exampleDialogue,
            lorebook: draft.data!.lorebook?.map((entry) => ({
              id: entry.id,
              name: entry.name,
              enabled: entry.enabled ?? true,
              keys: entry.keys ?? [],
              recallRange: entry.recallRange ?? 1000,
              content: entry.content,
            })),
            // SESSION characters are editable (source: import/chat)
            // LIBRARY characters are read-only (source: library)
            source: draft.source === "library" ? "library" : "session",
          }));

        const response = await generateCharacterResponse({
          messages: builderMessages,
          scenarioContext: {
            background: scenarioBackground,
            firstMessages: firstMessages?.map((msg) => ({
              title: msg.title,
              content: msg.content,
            })),
          },
          currentCharacters,
          callbacks: {
            onCreateCharacter: handleCharacterCreated,
            onUpdateCharacter: handleCharacterUpdated,
          },
          abortSignal: abortControllerRef.current.signal,
        });

        // Check if aborted before applying results
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Add assistant response to chat using functional update (avoids stale closure)
        if (response.text) {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.text,
            step: currentStep,
          };
          addChatMessage?.(assistantMessage);
        }
      } catch (error) {
        // Check if this was an abort - don't show error for user-initiated abort
        if (
          (error as Error).name === "AbortError" ||
          abortControllerRef.current?.signal.aborted
        ) {
          logger.info("[CastStep] Character generation aborted");
          return;
        } else {
          logger.error("[CastStep] Character generation failed", error);
          // Add error message to chat using functional update (avoids stale closure)
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Sorry, I encountered an error while generating the character. Please try again.",
            step: currentStep,
          };
          addChatMessage?.(errorMessage);
        }
      } finally {
        setIsGenerating(false);
        // Defer clearing the controller to the next tick to ensure the catch block
        // can complete its signal.aborted check before the reference is nullified.
        // This prevents a race condition where handleChatStop sets abort but the
        // catch block hasn't finished checking the signal yet.
        setTimeout(() => {
          abortControllerRef.current = null;
        }, 0);
      }
    },
    [
      chatMessages,
      onChatMessagesChange,
      isGenerating,
      handleCharacterCreated,
      handleCharacterUpdated,
      scenarioBackground,
      firstMessages,
      draftCharacters,
      currentStep,
      addChatMessage,
    ],
  );

  // Handle chat stop (abort generation and show cancelled message)
  const handleChatStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      // Keep the reference so catch block can check signal.aborted
    }
    setIsGenerating(false);

    // Add cancelled message to chat
    const cancelledMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Response generation was stopped by user.",
      step: currentStep,
      variant: "cancelled",
      isSystemGenerated: true, // Exclude from AI chat history
    };
    addChatMessage?.(cancelledMessage);
  }, [currentStep, addChatMessage]);

  // Fetch character cards
  const { data: characterCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Character] }),
  });

  // Filter library characters by search
  const filteredLibraryCharacters = useMemo(() => {
    if (!characterCards) return [];
    if (!search.trim()) return characterCards;

    const keyword = search.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const name = card.props.name?.toLowerCase() || "";
      return name.includes(keyword);
    });
  }, [characterCards, search]);

  // Filter draft characters by search
  const filteredDraftCharacters = useMemo(() => {
    if (!search.trim()) return draftCharacters;

    const keyword = search.toLowerCase();
    return draftCharacters.filter((draft) => {
      const name = draft.data?.name?.toLowerCase() || "";
      return name.includes(keyword);
    });
  }, [draftCharacters, search]);

  // Handlers for library characters (from DB)
  const handleAssignPlayer = (card: CharacterCard) => {
    const cardId = card.id.toString();
    // If already AI, remove from AI list
    if (aiCharacters.find((c) => c.existingCardId === cardId)) {
      onAiCharactersChange(
        aiCharacters.filter((c) => c.existingCardId !== cardId),
      );
    }
    // Note: Draft characters stay in draftCharacters list, so no need to return them
    // Wrap library character as DraftCharacter with data for context
    const draftCharacter: DraftCharacter = {
      tempId: `library-${cardId}`,
      source: "library",
      existingCardId: cardId,
      data: {
        name: card.props.name || "",
        description: card.props.description || "",
        tags: card.props.tags,
        cardSummary: card.props.cardSummary,
      },
    };
    onPlayerCharacterChange(draftCharacter);
  };

  const handleAddAI = (card: CharacterCard) => {
    const cardId = card.id.toString();
    // If this card is currently player, just move it to AI (no need to return to draft)
    if (playerCharacter?.existingCardId === cardId) {
      onPlayerCharacterChange(null);
    }
    // Add to AI if not already there
    if (!aiCharacters.find((c) => c.existingCardId === cardId)) {
      // Wrap library character as DraftCharacter with data for context
      const draftCharacter: DraftCharacter = {
        tempId: `library-${cardId}`,
        source: "library",
        existingCardId: cardId,
        data: {
          name: card.props.name || "",
          description: card.props.description || "",
          tags: card.props.tags,
          cardSummary: card.props.cardSummary,
        },
      };
      onAiCharactersChange([...aiCharacters, draftCharacter]);
    }
  };

  // Handlers for draft characters (from import/chat/create - shown in library with LOCAL badge)
  // Draft characters stay in draftCharacters list (like library characters) - only badge changes
  const handleAssignDraftPlayer = (draft: DraftCharacter) => {
    // If already AI, remove from AI list
    const inAI = aiCharacters.find((c) => c.tempId === draft.tempId);
    if (inAI) {
      onAiCharactersChange(
        aiCharacters.filter((c) => c.tempId !== draft.tempId),
      );
    }
    // Set as player (draft stays in draftCharacters for consistent UX with library)
    onPlayerCharacterChange(draft);
  };

  const handleAddDraftAI = (draft: DraftCharacter) => {
    // If already player, remove from player
    if (playerCharacter?.tempId === draft.tempId) {
      onPlayerCharacterChange(null);
    }
    // Add to AI if not already there (draft stays in draftCharacters for consistent UX)
    if (!aiCharacters.find((c) => c.tempId === draft.tempId)) {
      onAiCharactersChange([...aiCharacters, draft]);
    }
  };

  const handleRemoveAI = (tempId: string) => {
    // Simply remove from AI list - draft stays in draftCharacters
    onAiCharactersChange(aiCharacters.filter((c) => c.tempId !== tempId));
  };

  const handleRemovePlayer = () => {
    // Simply clear player - draft stays in draftCharacters
    onPlayerCharacterChange(null);
  };

  // Handle save from CharacterEditPanel - updates the draft in draftCharacters list
  const handleSaveEditedCharacter = useCallback(
    (updatedCharacter: DraftCharacter) => {
      // Update the character in draftCharacters list
      const updatedDrafts = draftCharacters.map((draft) =>
        draft.tempId === updatedCharacter.tempId ? updatedCharacter : draft,
      );
      onDraftCharactersChange(updatedDrafts);

      // Also update if this character is assigned to roster
      if (playerCharacter?.tempId === updatedCharacter.tempId) {
        onPlayerCharacterChange(updatedCharacter);
      }

      // Update in AI characters if present
      if (aiCharacters.some((c) => c.tempId === updatedCharacter.tempId)) {
        onAiCharactersChange(
          aiCharacters.map((c) =>
            c.tempId === updatedCharacter.tempId ? updatedCharacter : c,
          ),
        );
      }
    },
    [
      draftCharacters,
      onDraftCharactersChange,
      playerCharacter,
      onPlayerCharacterChange,
      aiCharacters,
      onAiCharactersChange,
    ],
  );

  const totalSelected = (playerCharacter ? 1 : 0) + aiCharacters.length;

  // Get player character details from library if it's a library character
  const playerLibraryChar = useMemo(() => {
    if (!playerCharacter?.existingCardId || !characterCards) return null;
    return characterCards.find(
      (c: CharacterCard) => c.id.toString() === playerCharacter.existingCardId,
    );
  }, [playerCharacter, characterCards]);

  // Get player character image - either from library card or draft data
  const playerIconAssetId = playerLibraryChar?.props.iconAssetId;
  const [playerImageUrl] = useAsset(playerIconAssetId);
  // Use hook to manage object URL lifecycle from imageFile (for draft characters)
  const playerDraftImageUrl = useFilePreviewUrl(
    playerCharacter?.data?.imageFile,
    playerCharacter?.data?.imageUrl,
  );
  // For draft characters created via import/chat, use the imageUrl from hook
  const playerDisplayImageUrl = playerImageUrl || playerDraftImageUrl;
  const playerDisplayName = playerCharacter
    ? playerLibraryChar?.props.name ||
      playerCharacter.data?.name ||
      getDraftCharacterName(playerCharacter)
    : undefined;

  // Banner dismiss handlers
  const handleDismissInfoBanner = useCallback(() => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.CAST_STEP_INFO_BANNER_DISMISSED,
      "true",
    );
    setShowInfoBanner(false);
  }, []);

  const handleDismissWarningBanner = useCallback(() => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.CAST_STEP_WARNING_BANNER_DISMISSED,
      "true",
    );
    setShowWarningBanner(false);
  }, []);

  // Mobile tab configuration (2 tabs only - chat is in bottom sheet)
  const mobileTabs = useMemo<MobileTab<"library" | "cast">[]>(
    () => [
      { value: "library", label: "Library", icon: <LayoutGrid size={14} /> },
      {
        value: "cast",
        label: "Roster",
        icon: <Users size={14} />,
        badge: (
          <span className="bg-brand-600 rounded-full px-1.5 text-[9px] text-white">
            {totalSelected}
          </span>
        ),
      },
    ],
    [totalSelected],
  );

  // Register chat handlers with parent (via ref to avoid re-renders)
  useEffect(() => {
    chatHandlersRef.current = {
      onSubmit: handleChatSubmit,
      onStop: handleChatStop,
    };
    return () => {
      chatHandlersRef.current = null;
    };
  }, [handleChatSubmit, handleChatStop, chatHandlersRef]);

  // Sync chat loading state to parent (only when AI is generating response)
  useEffect(() => {
    onChatLoadingChange(isGenerating);
  }, [isGenerating, onChatLoadingChange]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Flying Trail Animation Overlay */}
      <FlyingTrailOverlay
        trails={flyingTrails}
        onComplete={handleTrailComplete}
        rosterRef={rosterPanelRef}
      />

      {/* Character Details Modal */}
      <CharacterDetailsModal
        character={selectedDetailsChar}
        onClose={() => setSelectedDetailsChar(null)}
      />

      {/* Mobile Tab Nav */}
      <MobileTabNav
        value={mobileTab}
        onValueChange={onMobileTabChange}
        tabs={mobileTabs}
      />

      {/* Main Content - Library + Roster (2 column on desktop) */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden md:flex-row md:gap-6">
        {/* Library Panel OR Edit Panel */}
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden border border-zinc-800 md:rounded-xl",
            mobileTab === "library" ? "flex" : "hidden md:flex",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {editingCharacter ? (
              <motion.div
                key="edit-panel"
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 600,
                    damping: 35,
                    mass: 0.6,
                  },
                }}
                exit={{
                  x: "100%",
                  opacity: 0.5,
                  transition: { duration: 0.15 },
                }}
                className="flex h-full w-full flex-col bg-zinc-950"
              >
                <CharacterEditPanel
                  character={editingCharacter}
                  onBack={() => setEditingCharacter(null)}
                  onSave={handleSaveEditedCharacter}
                />
              </motion.div>
            ) : (
              <motion.div
                key="library-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex h-full w-full flex-col"
              >
                {/* Search and Actions Bar */}
                <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3 md:px-6">
                  <IconInput
                    icon={<Search />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    rightIcon={search ? <X /> : undefined}
                    onRightIconClick={search ? () => setSearch("") : undefined}
                    rightIconAriaLabel="Clear search"
                    className="min-w-0 flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={onImportCharacter}
                          variant="secondary"
                          size="icon"
                        >
                          <Import />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent variant="button" side="bottom">
                        Import V2, V3 character cards
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button onClick={onCreateCharacter}>
                    <Plus />
                    <span className="hidden sm:inline">New Character</span>
                  </Button>
                </div>

                {/* Info & Warning Banners */}
                {(showInfoBanner ||
                  (draftCharacters.length > 0 && showWarningBanner)) && (
                  <div className="mx-3 mt-1 space-y-1 sm:mx-6 sm:mt-2">
                    {showInfoBanner && (
                      <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-950/20 px-3 py-2">
                        <Info
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-blue-400"
                        />
                        <p className="flex-1 text-[11px] leading-relaxed text-blue-300">
                          <span className="inline-flex items-center gap-1 align-middle font-semibold">
                            <Globe size={10} />
                            LIBRARY
                          </span>{" "}
                          characters are read-only shared templates.{" "}
                          <span className="inline-flex items-center gap-1 align-middle font-semibold text-amber-300">
                            <Sparkles size={10} />
                            SESSION
                          </span>{" "}
                          characters are fully editable.
                        </p>
                        <button
                          onClick={handleDismissInfoBanner}
                          className="flex-shrink-0 p-0.5 text-blue-400 transition-colors hover:text-blue-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {draftCharacters.length > 0 && showWarningBanner && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2">
                        <AlertTriangle
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-red-400"
                        />
                        <p className="flex-1 text-[11px] leading-relaxed text-red-300">
                          <span className="font-semibold">Warning:</span>{" "}
                          Session characters will be lost if you leave without
                          creating a session.
                        </p>
                        <button
                          onClick={handleDismissWarningBanner}
                          className="flex-shrink-0 p-0.5 text-red-400 transition-colors hover:text-red-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Character Grid */}
                <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6 sm:py-4">
                  <LayoutGroup>
                    <motion.div
                      layout
                      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
                    >
                      <AnimatePresence mode="popLayout">
                        {/* Draft characters first (SESSION - from import/chat/create) */}
                        {filteredDraftCharacters.map((draft) => {
                          // Check if this draft is already assigned to roster
                          const isPlayer =
                            playerCharacter?.tempId === draft.tempId;
                          const isAI = aiCharacters.some(
                            (c) => c.tempId === draft.tempId,
                          );

                          return (
                            <motion.div
                              key={draft.tempId}
                              layout
                              data-card-wrapper
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{
                                opacity: 0,
                                scale: 0.8,
                                transition: { duration: 0.2 },
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            >
                              <DraftCharacterCard
                                draft={draft}
                                isPlayer={isPlayer}
                                isAI={isAI}
                                onAssignPlayer={(e, imageUrl) => {
                                  triggerFlyingTrail(
                                    e,
                                    "player",
                                    draft.data?.name || "Character",
                                    imageUrl,
                                  );
                                  handleAssignDraftPlayer(draft);
                                }}
                                onAddAI={(e, imageUrl) => {
                                  triggerFlyingTrail(
                                    e,
                                    "ai",
                                    draft.data?.name || "Character",
                                    imageUrl,
                                  );
                                  handleAddDraftAI(draft);
                                }}
                                onOpenDetails={(imageUrl) =>
                                  setSelectedDetailsChar({
                                    name: draft.data?.name || "Unnamed",
                                    description: draft.data?.description,
                                    cardSummary: draft.data?.cardSummary,
                                    tags: draft.data?.tags,
                                    imageUrl,
                                  })
                                }
                                onEdit={() => setEditingCharacter(draft)}
                              />
                            </motion.div>
                          );
                        })}
                        {/* Library characters (from DB) */}
                        {filteredLibraryCharacters.map(
                          (card: CharacterCard) => {
                            const cardId = card.id.toString();
                            // Check if this library card is selected (by existingCardId)
                            const isPlayer =
                              playerCharacter?.existingCardId === cardId;
                            const isAI = aiCharacters.some(
                              (c) => c.existingCardId === cardId,
                            );
                            // Library cards are never "local"
                            const isLocal = false;

                            return (
                              <motion.div
                                key={cardId}
                                layout
                                data-card-wrapper
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.8,
                                  transition: { duration: 0.2 },
                                }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                              >
                                <LibraryCharacterCard
                                  card={card}
                                  isPlayer={isPlayer}
                                  isAI={isAI}
                                  isLocal={isLocal}
                                  onAssignPlayer={() =>
                                    handleAssignPlayer(card)
                                  }
                                  onAddAI={() => handleAddAI(card)}
                                  onOpenDetails={() =>
                                    setSelectedDetailsChar({
                                      name: card.props.name || "Unnamed",
                                      description: card.props.description,
                                      cardSummary: card.props.cardSummary,
                                      tags: card.props.tags,
                                      version: card.props.version,
                                      iconAssetId: card.props.iconAssetId,
                                    })
                                  }
                                  triggerFlyingTrail={triggerFlyingTrail}
                                />
                              </motion.div>
                            );
                          },
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </LayoutGroup>

                  {/* Empty State */}
                  {filteredLibraryCharacters.length === 0 &&
                    filteredDraftCharacters.length === 0 && (
                      <div className="flex h-64 flex-col items-center justify-center text-zinc-600">
                        <div className="mb-3 rounded-full bg-zinc-900/50 p-4">
                          <Users size={32} />
                        </div>
                        <p className="text-sm">No characters found.</p>
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Session Roster - border provides visual distinction */}
        <div
          ref={rosterPanelRef}
          className={cn(
            "relative w-full flex-col overflow-hidden rounded-xl border border-zinc-800 md:w-72 lg:w-80",
            mobileTab === "cast" ? "flex h-full" : "hidden md:flex",
          )}
        >
          {/* Roster Header */}
          <div className="flex-shrink-0 p-4">
            <div className="flex items-center gap-2.5 rounded-lg bg-zinc-800/40 px-3.5 py-2.5">
              <div className="bg-brand-500/20 flex h-6 w-6 items-center justify-center rounded-md">
                <Users size={14} className="text-brand-400" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
                Session Roster
              </h2>
            </div>
          </div>

          {/* Roster Content */}
          <div className="flex-1 space-y-8 overflow-y-auto p-5">
            {/* Player Character Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  <User size={12} /> User Persona
                </label>
              </div>

              <AnimatePresence mode="wait">
                {playerCharacter ? (
                  <motion.div
                    key={playerCharacter.tempId}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-950/20"
                  >
                    <div className="relative flex items-center gap-3 rounded-xl bg-emerald-950/40 p-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-500 font-bold text-white">
                        {playerDisplayImageUrl ? (
                          <img
                            src={playerDisplayImageUrl}
                            alt={playerDisplayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (playerDisplayName || "??")
                            .substring(0, 2)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">
                          {playerDisplayName}
                        </div>
                        <div className="mt-1 flex gap-1">
                          <div className="inline-block rounded border border-emerald-500/20 bg-emerald-950/30 px-1.5 py-0.5 text-[10px] text-emerald-300">
                            PLAYER
                          </div>
                          {playerCharacter.source !== "library" && (
                            <div className="inline-block rounded border border-amber-500/30 bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">
                              SESSION
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemovePlayer}
                        className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20 px-4 py-5 text-center"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <User size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-[11px] font-medium text-emerald-300">
                      No persona selected
                    </p>
                    <p className="mt-0.5 text-[10px] text-emerald-400">
                      Use PLAY AS to assign
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Support Characters Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  <Cpu size={12} /> AI Character(s)
                </label>
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900 text-zinc-400"
                >
                  {aiCharacters.length}
                </Badge>
              </div>

              <AnimatePresence mode="popLayout">
                {aiCharacters.length > 0 ? (
                  aiCharacters.map((draft) => (
                    <motion.div
                      key={draft.tempId}
                      layout
                      initial={{ opacity: 0, scale: 0.9, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="mb-2 last:mb-0"
                    >
                      <AIRosterItem
                        draft={draft}
                        libraryCards={characterCards || []}
                        onRemove={() => handleRemoveAI(draft.tempId)}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty-ai"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 px-4 py-5 text-center"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                      <Cpu size={14} className="text-purple-400" />
                    </div>
                    <p className="text-[11px] font-medium text-purple-300">
                      No AI companions selected
                    </p>
                    <p className="mt-0.5 text-[10px] text-purple-400">
                      Use ADD AS AI to assign
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4">
            {totalSelected === 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <AlertTriangle
                  size={14}
                  className="flex-shrink-0 text-zinc-400"
                />
                <p className="text-[11px] font-medium text-zinc-400">
                  Select at least one character
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="bg-brand-500/20 text-brand-400 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                  {totalSelected}
                </span>
                <p className="text-[11px] font-medium text-zinc-300">
                  character{totalSelected > 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AI Roster Item
 * Single AI character in the roster (supports both library and draft characters)
 * Uses consistent rounded-xl to match system design
 */
function AIRosterItem({
  draft,
  libraryCards,
  onRemove,
}: {
  draft: DraftCharacter;
  libraryCards: CharacterCard[];
  onRemove: () => void;
}) {
  // For library characters, find the actual CharacterCard
  const libraryCard = useMemo(() => {
    if (draft.source === "library" && draft.existingCardId) {
      return libraryCards.find((c) => c.id.toString() === draft.existingCardId);
    }
    return null;
  }, [draft, libraryCards]);

  // Get asset from library card's iconAssetId
  const [libraryImageUrl] = useAsset(libraryCard?.props.iconAssetId);

  // Use hook to manage object URL lifecycle from imageFile (for draft characters)
  const draftImageUrl = useFilePreviewUrl(
    draft.data?.imageFile,
    draft.data?.imageUrl,
  );

  // Resolve display name and image
  const displayName =
    libraryCard?.props.name || draft.data?.name || getDraftCharacterName(draft);
  const displayImageUrl = libraryImageUrl || draftImageUrl;

  // Check if this is a local (non-library) character
  const isLocal = draft.source !== "library";

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-950/40 p-3 transition-all hover:border-purple-500/40">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-purple-500 text-xs font-bold text-white">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          (displayName || "??").substring(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-200">
          {displayName}
        </div>
        <div className="mt-0.5 flex gap-1">
          <div className="inline-block rounded border border-purple-500/30 bg-purple-950/30 px-1.5 py-0.5 text-[10px] text-purple-300">
            AI
          </div>
          {isLocal && (
            <div className="inline-block rounded border border-amber-500/30 bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">
              SESSION
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Unified character data for details modal
 * Supports both CharacterCard (from DB) and DraftCharacter (local)
 */
interface CharacterDetailsData {
  name: string;
  description?: string;
  cardSummary?: string;
  tags?: string[];
  version?: string;
  imageUrl?: string;
  // For library characters, we need asset ID to load image
  iconAssetId?: UniqueEntityID;
}

/**
 * Character Details Modal
 * Shows full character information when clicking on a card
 * Supports both library characters (CharacterCard) and draft characters (DraftCharacter)
 * Uses DialogBase for consistent styling, accessibility, and proper mobile viewport handling
 */
function CharacterDetailsModal({
  character,
  onClose,
}: {
  character: CharacterDetailsData | null;
  onClose: () => void;
}) {
  // Load image from asset if iconAssetId is provided (library characters)
  const [assetImageUrl] = useAsset(character?.iconAssetId);
  // Use asset URL if available, otherwise use direct imageUrl (draft characters)
  const imageUrl = assetImageUrl || character?.imageUrl;

  return (
    <DialogBase
      open={!!character}
      onOpenChange={(open) => !open && onClose()}
      title={character?.name || "Character Details"}
      hideTitle
      size="lg"
      isShowCloseButton
      className="overflow-hidden p-0"
      contentClassName="md:overflow-hidden!"
      content={
        character && (
          <div className="flex flex-col md:h-[400px] md:flex-row">
            {/* Visual Side - Character Image */}
            {/* Mobile: sticky top, Desktop: fixed left column */}
            <div className="bg-surface-raised sticky top-0 z-10 md:relative md:top-auto md:z-auto md:h-full md:w-2/5">
              <div className="from-brand-600 to-brand-800 relative flex h-48 w-full flex-col justify-end overflow-hidden bg-gradient-to-br md:h-full">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={character.name || ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-black text-white/50 md:text-6xl">
                      {(character.name || "??").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Character Name Overlay */}
                <div className="relative z-10 p-4 md:p-6">
                  <h2 className="text-lg leading-tight font-bold text-white md:text-2xl">
                    {character.name || "Unnamed"}
                  </h2>
                  {character.version && (
                    <p className="mt-1 font-mono text-xs text-white/70 md:text-sm">
                      v{character.version}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Data Side - Character Info */}
            <div className="relative flex flex-1 flex-col md:h-full md:min-h-0">
              {/* Header - sticky on mobile, fixed on desktop */}
              <div className="bg-surface-raised sticky top-48 z-10 px-4 pt-4 pb-4 md:relative md:top-auto md:z-auto md:px-6 md:pt-6 md:pb-4">
                <h3 className="text-fg-muted mb-1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                  <Activity size={12} /> Character Info
                </h3>
                <div className="bg-brand-500 h-0.5 w-12" />
              </div>

              {/* Content (scrollable on desktop) */}
              <div className="flex-1 space-y-4 px-4 pb-8 md:space-y-5 md:overflow-y-auto md:px-6 md:pb-10">
                {/* Summary */}
                {character.cardSummary && (
                  <p className="text-fg-muted border-border-default border-l-2 pl-3 text-sm leading-relaxed md:pl-4">
                    {character.cardSummary}
                  </p>
                )}

                {/* Description */}
                {character.description && (
                  <div>
                    <h4 className="text-fg-subtle mb-2 font-mono text-[10px] uppercase">
                      Description
                    </h4>
                    <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-wrap">
                      {character.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {character.tags && character.tags.length > 0 && (
                  <div>
                    <h4 className="text-fg-subtle mb-2 font-mono text-[10px] uppercase">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {character.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-raised text-brand-300 border-border-default rounded border px-1.5 py-0.5 text-xs md:px-2 md:py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom fade overlay - sticky on mobile, absolute on desktop */}
              <div className="from-surface-raised pointer-events-none sticky bottom-0 h-12 w-full bg-gradient-to-t to-transparent md:absolute md:inset-x-0" />
            </div>
          </div>
        )
      }
    />
  );
}

/**
 * Character Edit Panel
 * Full-panel editor for session characters (draft characters)
 * Replaces the Character Library when editing
 */
interface CharacterEditPanelProps {
  character: DraftCharacter;
  onBack: () => void;
  onSave: (updatedCharacter: DraftCharacter) => void;
}

/**
 * Local lorebook entry state for editing
 * Maps to LorebookEntryData on save
 */
interface EditableLorebookEntry {
  id: string;
  name: string;
  enabled: boolean;
  keys: string; // comma-separated string for easier editing
  recallRange: number;
  content: string;
}

function CharacterEditPanel({
  character,
  onBack,
  onSave,
}: CharacterEditPanelProps) {
  // Form state initialized from character data
  const [name, setName] = useState(character.data?.name || "");
  const [summary, setSummary] = useState(character.data?.cardSummary || "");
  const [description, setDescription] = useState(
    character.data?.description || "",
  );
  const [tags, setTags] = useState<string[]>(character.data?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | undefined>(
    character.data?.imageFile,
  );
  const [lorebook, setLorebook] = useState<EditableLorebookEntry[]>(
    character.data?.lorebook?.map((entry) => ({
      id: entry.id || crypto.randomUUID(),
      name: entry.name || "",
      enabled: entry.enabled ?? true,
      keys: entry.keys?.join(", ") || "",
      recallRange: entry.recallRange ?? 1000,
      content: entry.content || "",
    })) || [],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use hook to get cached Object URL for imageFile
  // Cleanup happens when session creation flow unmounts via revokeAllFilePreviewUrls()
  const previewImageUrl = useFilePreviewUrl(
    imageFile,
    character.data?.imageUrl,
  );
  // Track if we're currently syncing from prop to avoid infinite loop
  const isSyncingFromPropRef = useRef(false);
  // Track the last synced character tempId to detect external changes
  const lastSyncedTempIdRef = useRef(character.tempId);
  // Track if this is the initial mount to skip first auto-save
  const isInitialMountRef = useRef(true);

  // Sync local state when character prop changes from EXTERNAL source (e.g., AI chat updates)
  // Only sync if the data actually changed externally, not from our own onSave
  useEffect(() => {
    // Skip if this is a self-triggered update (same tempId, data changed by us)
    if (isSyncingFromPropRef.current) {
      return;
    }

    // Check if lorebook count changed (external update indicator - e.g., AI added lorebook entry)
    const currentLorebookCount = character.data?.lorebook?.length ?? 0;
    const localLorebookCount = lorebook.length;
    const lorebookCountChanged = currentLorebookCount !== localLorebookCount;

    // Only sync if there's a meaningful external change (lorebook count or different character)
    if (
      lorebookCountChanged ||
      lastSyncedTempIdRef.current !== character.tempId
    ) {
      isSyncingFromPropRef.current = true;
      lastSyncedTempIdRef.current = character.tempId;

      setName(character.data?.name || "");
      setSummary(character.data?.cardSummary || "");
      setDescription(character.data?.description || "");
      setTags(character.data?.tags || []);
      setImageFile(character.data?.imageFile);
      setLorebook(
        character.data?.lorebook?.map((entry) => ({
          id: entry.id || crypto.randomUUID(),
          name: entry.name || "",
          enabled: entry.enabled ?? true,
          keys: entry.keys?.join(", ") || "",
          recallRange: entry.recallRange ?? 1000,
          content: entry.content || "",
        })) || [],
      );

      // Reset flag after state updates are processed
      requestAnimationFrame(() => {
        isSyncingFromPropRef.current = false;
      });
    }
  }, [character.tempId, character.data?.lorebook?.length]);


  // Auto-save on changes
  useEffect(() => {
    // Skip initial mount - don't save on first render
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Skip if we're currently syncing from external prop changes
    if (isSyncingFromPropRef.current) {
      return;
    }

    const updatedCharacter: DraftCharacter = {
      ...character,
      data: {
        ...character.data,
        name,
        cardSummary: summary,
        description,
        tags,
        imageFile,
        // When imageFile exists, don't store blob URL - useFilePreviewUrl will regenerate it
        // When no imageFile, preserve existing external URL (e.g., from AI chat)
        imageUrl: imageFile ? undefined : character.data?.imageUrl,
        lorebook: lorebook.map((entry) => ({
          id: entry.id,
          name: entry.name,
          enabled: entry.enabled,
          keys: entry.keys
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean),
          recallRange: entry.recallRange,
          content: entry.content,
        })),
      },
    };
    onSave(updatedCharacter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- character and onSave intentionally excluded to prevent infinite loops
  }, [name, summary, description, tags, imageFile, lorebook]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type is a safe image MIME type
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return;
      }

      // Just set the file - useFilePreviewUrl hook will handle object URL creation
      setImageFile(file);
    }
  };

  // Handle tag add
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Handle tag remove
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle lorebook entry add
  const handleAddLorebookEntry = () => {
    const newEntry: EditableLorebookEntry = {
      id: crypto.randomUUID(),
      name: "",
      enabled: true,
      keys: "",
      recallRange: 1000,
      content: "",
    };
    setLorebook([...lorebook, newEntry]);
  };

  // Handle lorebook entry remove
  const handleRemoveLorebookEntry = (index: number) => {
    setLorebook(lorebook.filter((_, i) => i !== index));
  };

  // Handle lorebook entry update
  const handleUpdateLorebookEntry = (
    index: number,
    field: keyof EditableLorebookEntry,
    value: string | number | boolean,
  ) => {
    setLorebook(
      lorebook.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  // Validate image URL to prevent XSS - only allow safe URLs
  // Use URL parsing for proper validation instead of string prefix check
  const safeImageUrl = useMemo((): string | null => {
    if (!previewImageUrl) return null;
    try {
      // Allow relative URLs by resolving against current origin
      const parsedUrl = new URL(previewImageUrl, window.location.origin);

      const isAllowedProtocol =
        parsedUrl.protocol === "blob:" || parsedUrl.protocol === "https:";
      const isSameOrigin = parsedUrl.origin === window.location.origin;

      // Allow same-origin relative/absolute URLs + blob/https URLs
      if (isAllowedProtocol || isSameOrigin) {
        return parsedUrl.href;
      }
    } catch {
      // Invalid URL - return null
    }
    return null;
  }, [previewImageUrl]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Edit Character
            </h2>
            <p className="text-[10px] font-medium tracking-widest text-amber-400 uppercase">
              SESSION CHARACTER
            </p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="flex flex-col items-center">
            {safeImageUrl ? (
              <div className="relative max-w-[160px]">
                <img
                  src={safeImageUrl}
                  alt={name || "Character"}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-white shadow-md transition-colors hover:bg-zinc-700"
                  aria-label="Edit image"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[160px] w-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-800 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              >
                <ImagePlus size={32} />
                <span className="text-sm">Add image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Metadata Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Metadata</h2>

            <Input
              label="Character Name"
              labelPosition="inner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              isRequired
            />

            <div className="space-y-1">
              <Input
                label="Character Summary"
                labelPosition="inner"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={50}
              />
              <div className="px-2 text-left text-xs text-zinc-400">
                {`(${summary.length}/50)`}
              </div>
            </div>
          </section>

          {/* Tags Section */}
          <section className="space-y-2">
            <h3 className="text-xs text-zinc-200">Tags</h3>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-brand-500/20 text-brand-400 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-brand-300"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Input
                labelPosition="inner"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="pr-16"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="secondary"
                size="sm"
                disabled={!tagInput.trim()}
                className="absolute top-1/2 right-2 -translate-y-1/2"
              >
                Add
              </Button>
            </div>
          </section>

          {/* Character Info Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">
              Character Info
            </h2>

            <Textarea
              label="Character Description"
              labelPosition="inner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoResize
              isRequired
            />
          </section>

          {/* Lorebook Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Lorebook</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLorebookEntry}
              >
                <Plus size={14} />
                Add lorebook
              </Button>
            </div>

            {lorebook.length === 0 ? (
              <p className="text-sm text-zinc-400">No lorebook entries</p>
            ) : (
              <div className="space-y-3">
                {lorebook.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        {entry.name || `Entry ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLorebookEntry(index)}
                        className="text-zinc-500 hover:text-zinc-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <Input
                      label="Lorebook name"
                      labelPosition="inner"
                      value={entry.name}
                      onChange={(e) =>
                        handleUpdateLorebookEntry(index, "name", e.target.value)
                      }
                    />

                    <div className="space-y-2">
                      <Input
                        label="Trigger keywords"
                        labelPosition="inner"
                        value={entry.keys}
                        onChange={(e) =>
                          handleUpdateLorebookEntry(
                            index,
                            "keys",
                            e.target.value,
                          )
                        }
                        placeholder="Comma-separated keywords"
                      />
                      {entry.keys && (
                        <ul className="flex flex-wrap gap-2">
                          {entry.keys
                            .split(",")
                            .filter((k) => k.trim())
                            .map((key, keyIndex) => (
                              <li
                                key={`${entry.id}-${keyIndex}`}
                                className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
                              >
                                {key.trim()}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>

                    <Textarea
                      label="Description"
                      labelPosition="inner"
                      value={entry.content}
                      onChange={(e) =>
                        handleUpdateLorebookEntry(
                          index,
                          "content",
                          e.target.value,
                        )
                      }
                      autoResize
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
