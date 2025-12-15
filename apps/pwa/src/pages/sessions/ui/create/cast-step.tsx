import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  LayoutGrid,
  Users,
  Import,
  Info,
  Sparkles,
  AlertTriangle,
  Globe,
  Search,
} from "lucide-react";
import { Button } from "@astrsk/design-system/button";
import { IconInput } from "@astrsk/design-system/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { cn, logger } from "@/shared/lib";
import { SESSION_STORAGE_KEYS } from "@/shared/storage";
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
import { CharacterEditPanel } from "./character-edit-panel";
import { SessionRosterPanel } from "./session-roster-panel";
import { LibraryCharacterCard } from "./library-character-card";
import { DraftCharacterCard } from "./draft-character-card";
import {
  CharacterDetailsModal,
  type CharacterDetailsData,
} from "./character-details-modal";

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

// Initial welcome message for character creation
const WELCOME_MESSAGE_CONTENT =
  "Need a character? Describe who you're looking for — their personality, role, or vibe — and I'll help bring them to life. You can also browse existing characters in the library.";

// Flying trail animation constants
const TRAIL_ICON_SIZE = 48; // 12 * 4 = h-12 w-12
const TRAIL_ICON_OFFSET = TRAIL_ICON_SIZE / 2; // Center the icon on cursor
const PLAYER_SECTION_Y_OFFSET = 120; // Distance from roster top to player section
const AI_SECTION_Y_OFFSET = 300; // Distance from roster top to AI section

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
  // Character being edited - store tempId only, derive actual character from draftCharacters
  // This ensures form always gets latest data when draftCharacters updates (e.g., AI edits)
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const editingCharacter = useMemo(
    () => draftCharacters.find((d) => d.tempId === editingTempId) ?? null,
    [draftCharacters, editingTempId],
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const onChatMessagesChangeRef = useRef(onChatMessagesChange);

  // Keep ref in sync with prop
  useEffect(() => {
    onChatMessagesChangeRef.current = onChatMessagesChange;
  }, [onChatMessagesChange]);

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

      // Also update Roster if this character is assigned
      const updatedDraft = updatedDrafts.find((d) => d.tempId === id);
      if (updatedDraft) {
        // Update player character if it matches
        if (playerCharacter?.tempId === id) {
          onPlayerCharacterChange(updatedDraft);
        }

        // Update AI characters if it matches
        if (aiCharacters.some((c) => c.tempId === id)) {
          onAiCharactersChange(
            aiCharacters.map((c) => (c.tempId === id ? updatedDraft : c)),
          );
        }
      }

      logger.info("[CastStep] Draft character updated from chat", {
        tempId: id,
        updates: Object.keys(updates),
      });
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
            "relative flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-xl md:border md:border-border-default",
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
                  onBack={() => setEditingTempId(null)}
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
                          Characters from the{" "}
                          <span className="inline-flex items-center gap-1 align-middle font-semibold">
                            <Globe size={10} />
                            LIBRARY
                          </span>{" "}
                          can't be edited here,{" "}
                          <span className="inline-flex items-center gap-1 align-middle font-semibold text-amber-300">
                            <Sparkles size={10} />
                            SESSION
                          </span>{" "}
                          characters can be.
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
                                onEdit={() => setEditingTempId(draft.tempId)}
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

        {/* Right Panel: Session Roster */}
        <SessionRosterPanel
          panelRef={rosterPanelRef}
          playerCharacter={playerCharacter}
          playerDisplayName={playerDisplayName}
          playerDisplayImageUrl={playerDisplayImageUrl}
          aiCharacters={aiCharacters}
          libraryCards={characterCards || []}
          onRemovePlayer={handleRemovePlayer}
          onRemoveAI={handleRemoveAI}
          mobileTab={mobileTab}
        />
      </div>
    </div>
  );
}
