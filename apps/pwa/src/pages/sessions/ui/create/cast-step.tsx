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
} from "lucide-react";
import { CharacterCard as DesignSystemCharacterCard } from "@astrsk/design-system/character-card";
import { Badge } from "@/shared/ui/badge";
import { SearchInput, Button } from "@/shared/ui/forms";
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
import { UniqueEntityID } from "@/shared/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { useTypingEffect } from "@/shared/hooks/use-typing-effect";
import { ChatPanel, CHAT_AGENTS, type ChatMessage } from "./chat-panel";
import { StepHeader } from "./step-header";
import { MobileTabNav, type MobileTab } from "./mobile-tab-nav";
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
  mobileTab: "library" | "cast" | "chat";
  onMobileTabChange: (tab: "library" | "cast" | "chat") => void;
  // Chat messages (lifted to parent for persistence across step navigation)
  chatMessages?: ChatMessage[];
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  // Callback when a character is created via chat (returns DraftCharacter)
  onCharacterCreatedFromChat?: (character: DraftCharacter) => void;
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
 * Build character card badges based on selection state
 */
function buildCharacterBadges(
  isPlayer: boolean,
  isAI: boolean,
  isLocal: boolean,
) {
  return [
    // Local badge (left position) - amber color
    ...(isLocal
      ? [
          {
            label: "LOCAL",
            variant: "default" as const,
            position: "left" as const,
            className: "border-amber-500/30 bg-amber-950/50 text-amber-300",
          },
        ]
      : []),
    // Selection badge (right position)
    ...(isPlayer
      ? [
          {
            label: "PLAYER",
            variant: "default" as const,
            position: "right" as const,
            className: "border-blue-500/30 bg-blue-950/50 text-blue-300",
          },
        ]
      : isAI
        ? [
            {
              label: "AI",
              variant: "default" as const,
              position: "right" as const,
              className: "border-purple-500/30 bg-purple-950/50 text-purple-300",
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
                trail.targetType === "player" ? "bg-blue-500" : "bg-purple-500",
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
                  ? "bg-blue-500/50"
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
  const badges = buildCharacterBadges(isPlayer, isAI, isLocal);

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
                : "text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300",
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
                : "text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",
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
 * Displays import/chat/create characters in the library with LOCAL badge
 */
interface DraftCharacterCardProps {
  draft: DraftCharacter;
  isPlayer: boolean;
  isAI: boolean;
  onAssignPlayer: (e: React.MouseEvent) => void;
  onAddAI: (e: React.MouseEvent) => void;
  onOpenDetails: () => void;
}

function DraftCharacterCard({
  draft,
  isPlayer,
  isAI,
  onAssignPlayer,
  onAddAI,
  onOpenDetails,
}: DraftCharacterCardProps) {
  const isSelected = isPlayer || isAI;
  const name = draft.data?.name || "Unnamed";
  const imageUrl = draft.data?.imageUrl;
  // Draft characters are always local
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
      onClick={onOpenDetails}
      renderMetadata={() => null}
      footerActions={
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) onAssignPlayer(e);
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              "border-r border-zinc-800",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300",
            )}
          >
            <User size={10} className="sm:h-3 sm:w-3" /> PLAY AS
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) onAddAI(e);
            }}
            disabled={isSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[9px] font-bold transition-all sm:gap-1.5 sm:py-3 sm:text-[10px]",
              isSelected
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",
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
  onCharacterCreatedFromChat,
}: CastStepProps) {
  const [search, setSearch] = useState("");
  const [selectedDetailsChar, setSelectedDetailsChar] =
    useState<CharacterDetailsData | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);
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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Welcome message typing effect using custom hook
  const {
    displayText: welcomeDisplayText,
    isTyping: isWelcomeTyping,
    startTyping: startWelcomeTyping,
  } = useTypingEffect({
    onComplete: () => {
      // Update to final message when typing completes
      const existingMessages = chatMessages.filter(
        (m) => m.id !== "cast-welcome",
      );
      onChatMessagesChange?.([
        ...existingMessages,
        {
          id: "cast-welcome",
          role: "assistant",
          content: WELCOME_MESSAGE_CONTENT,
          step: "cast",
        },
      ]);
    },
  });

  // Add initial welcome message with typing indicator then streaming text effect
  // Only show if no cast-step messages exist yet
  useEffect(() => {
    const hasCastMessages = chatMessages.some((m) => m.step === "cast");
    if (hasCastMessages) return;

    setIsTypingIndicator(true);

    // After typing indicator, start streaming the text
    const typingTimer = setTimeout(() => {
      setIsTypingIndicator(false);

      // Add welcome message that will be updated with streaming text
      const welcomeMessage: ChatMessage = {
        id: "cast-welcome",
        role: "assistant",
        content: "",
        step: "cast",
      };
      onChatMessagesChange?.([...chatMessages, welcomeMessage]);

      // Start typing effect
      startWelcomeTyping(WELCOME_MESSAGE_CONTENT);
    }, 1500); // Show typing indicator for 1.5 seconds

    return () => clearTimeout(typingTimer);
  }, []); // Only run on mount

  // Show all messages, apply streaming text to welcome message if typing
  const displayMessages = useMemo(() => {
    if (isWelcomeTyping) {
      return chatMessages.map((m) =>
        m.id === "cast-welcome" ? { ...m, content: welcomeDisplayText } : m,
      );
    }
    return chatMessages;
  }, [chatMessages, isWelcomeTyping, welcomeDisplayText]);

  // Handle character creation from AI - creates DraftCharacter without DB save
  const handleCharacterCreated = useCallback(
    (characterData: CharacterData) => {
      // Create a DraftCharacter with source: "chat" - NOT saved to DB until session creation
      const draftCharacter: DraftCharacter = {
        tempId: generateTempId(),
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

  // Handle chat submit with AI character generation
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chatInput,
      step: currentStep,
    };
    const newMessages = [...chatMessages, userMessage];
    onChatMessagesChange?.(newMessages);
    setChatInput("");

    // Start AI generation
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      // Convert ChatMessage to CharacterBuilderMessage format
      const builderMessages: CharacterBuilderMessage[] = newMessages.map(
        (msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }),
      );

      const response = await generateCharacterResponse({
        messages: builderMessages,
        callbacks: {
          onCreateCharacter: handleCharacterCreated,
        },
        abortSignal: abortControllerRef.current.signal,
      });

      // Check if aborted before applying results
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Add assistant response to chat
      if (response.text) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.text,
          step: currentStep,
        };
        onChatMessagesChange?.([...newMessages, assistantMessage]);
      }
    } catch (error) {
      // Check if this was an abort - don't show error for user-initiated abort
      if ((error as Error).name === "AbortError" || abortControllerRef.current?.signal.aborted) {
        logger.info("[CastStep] Character generation aborted");
        return;
      } else {
        logger.error("[CastStep] Character generation failed", error);
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I encountered an error while generating the character. Please try again.",
          step: currentStep,
        };
        onChatMessagesChange?.([...newMessages, errorMessage]);
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
  }, [
    chatInput,
    chatMessages,
    onChatMessagesChange,
    isGenerating,
    handleCharacterCreated,
    currentStep,
  ]);

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
    };
    onChatMessagesChange?.([...chatMessages, cancelledMessage]);
  }, [currentStep, onChatMessagesChange, chatMessages]);

  // Fetch character cards
  const { data: characterCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Character] }),
  });

  // Filter by search
  const filteredCharacters = useMemo(() => {
    if (!characterCards) return [];
    if (!search.trim()) return characterCards;

    const keyword = search.toLowerCase();
    return characterCards.filter((card: CharacterCard) => {
      const name = card.props.name?.toLowerCase() || "";
      return name.includes(keyword);
    });
  }, [characterCards, search]);

  // Handlers for library characters (from DB)
  const handleAssignPlayer = (card: CharacterCard) => {
    const cardId = card.id.toString();
    // If already AI, remove from AI list
    if (aiCharacters.find((c) => c.existingCardId === cardId)) {
      onAiCharactersChange(
        aiCharacters.filter((c) => c.existingCardId !== cardId),
      );
    }
    // If there's an existing player character that is a draft, return it to draft list
    if (playerCharacter && playerCharacter.source !== "library") {
      onDraftCharactersChange([...draftCharacters, playerCharacter]);
    }
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
  // For draft characters created via import/chat, use the imageUrl from data
  const playerDisplayImageUrl =
    playerImageUrl || playerCharacter?.data?.imageUrl;
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

  // Mobile tab configuration
  const mobileTabs = useMemo<MobileTab<"library" | "cast" | "chat">[]>(
    () => [
      { value: "library", label: "Library", icon: <LayoutGrid size={14} /> },
      {
        value: "cast",
        label: "Roster",
        icon: <Users size={14} />,
        badge: (
          <span className="rounded-full bg-indigo-600 px-1.5 text-[9px] text-white">
            {totalSelected}
          </span>
        ),
      },
      { value: "chat", label: "AI", icon: <Sparkles size={14} /> },
    ],
    [totalSelected],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
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

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 overflow-hidden px-0 pb-0 md:flex-row md:gap-6 md:px-6 md:pb-6">
        {/* Left Panel: AI Chat */}
        <ChatPanel
          messages={displayMessages}
          agent={CHAT_AGENTS.cast}
          inputValue={chatInput}
          onInputChange={setChatInput}
          onSubmit={handleChatSubmit}
          onStop={isGenerating ? handleChatStop : undefined}
          isLoading={isGenerating || isTypingIndicator}
          disabled={isGenerating || isTypingIndicator || isWelcomeTyping}
          className={mobileTab === "chat" ? "" : "hidden md:flex"}
        />

        {/* Middle Panel: Character Library - border provides visual distinction */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden border border-zinc-800 md:rounded-xl",
            mobileTab === "library" ? "flex" : "hidden md:flex",
          )}
        >
          <StepHeader
            icon={<LayoutGrid size={20} />}
            title="Character Library"
            subtitle="SELECT PERSONAS FOR SIMULATION"
            actions={
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onImportCharacter}
                        variant="secondary"
                        size="sm"
                        icon={<Import size={16} />}
                      />
                    </TooltipTrigger>
                    <TooltipContent variant="button" side="bottom">
                      Import V2, V3 character cards
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  onClick={onCreateCharacter}
                  variant="default"
                  size="sm"
                  icon={<Plus size={16} />}
                >
                  <span className="hidden sm:inline">New Character</span>
                </Button>
              </div>
            }
          >
            {/* Search */}
            <SearchInput
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="dark"
              className="w-full"
            />
          </StepHeader>

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
                  <p className="flex-1 text-[11px] leading-relaxed text-zinc-400">
                    Browsing{" "}
                    <span className="font-semibold text-blue-300">
                      Global Assets
                    </span>
                    . New characters are{" "}
                    <span className="font-semibold text-amber-300">Local</span>{" "}
                    to this scenario.
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
                    <span className="font-semibold">Warning:</span> Local
                    characters will be lost if you leave without creating a
                    session.
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
                  {/* Draft characters first (LOCAL - from import/chat/create) */}
                  {draftCharacters
                    .filter((draft) => {
                      if (!search) return true;
                      const name = draft.data?.name?.toLowerCase() || "";
                      return name.includes(search.toLowerCase());
                    })
                    .map((draft) => {
                      // Check if this draft is already assigned to roster
                      const isPlayer = playerCharacter?.tempId === draft.tempId;
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
                            onAssignPlayer={(e) => {
                              triggerFlyingTrail(
                                e,
                                "player",
                                draft.data?.name || "Character",
                                draft.data?.imageUrl,
                              );
                              handleAssignDraftPlayer(draft);
                            }}
                            onAddAI={(e) => {
                              triggerFlyingTrail(
                                e,
                                "ai",
                                draft.data?.name || "Character",
                                draft.data?.imageUrl,
                              );
                              handleAddDraftAI(draft);
                            }}
                            onOpenDetails={() =>
                              setSelectedDetailsChar({
                                name: draft.data?.name || "Unnamed",
                                description: draft.data?.description,
                                cardSummary: draft.data?.cardSummary,
                                tags: draft.data?.tags,
                                imageUrl: draft.data?.imageUrl,
                              })
                            }
                          />
                        </motion.div>
                      );
                    })}
                  {/* Library characters (from DB) */}
                  {filteredCharacters.map((card: CharacterCard) => {
                    const cardId = card.id.toString();
                    // Check if this library card is selected (by existingCardId)
                    const isPlayer = playerCharacter?.existingCardId === cardId;
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
                          onAssignPlayer={() => handleAssignPlayer(card)}
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
                  })}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>

            {/* Empty State */}
            {filteredCharacters.length === 0 &&
              draftCharacters.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center text-zinc-600">
                  <div className="mb-3 rounded-full bg-zinc-900/50 p-4">
                    <Users size={32} />
                  </div>
                  <p className="text-sm">No data found in archives.</p>
                </div>
              )}
          </div>
        </div>

        {/* Right Panel: Session Roster - border provides visual distinction */}
        <div
          ref={rosterPanelRef}
          className={cn(
            "relative w-full flex-col overflow-hidden rounded-xl border border-zinc-800 md:w-80 lg:w-96",
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
                {playerCharacter && (
                  <button
                    onClick={handleRemovePlayer}
                    className="text-[10px] text-red-400 transition-colors hover:text-red-300"
                  >
                    DISMISS
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {playerCharacter ? (
                  <motion.div
                    key={playerCharacter.tempId}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="group relative overflow-hidden rounded-xl border border-blue-500/30 bg-blue-950/20"
                  >
                    <div className="relative flex items-center gap-3 rounded-xl bg-blue-950/40 p-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-blue-500 font-bold text-white">
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
                          <div className="inline-block rounded border border-blue-500/20 bg-blue-950/30 px-1.5 py-0.5 text-[10px] text-blue-300">
                            PLAYER
                          </div>
                          {playerCharacter.source !== "library" && (
                            <div className="inline-block rounded border border-amber-500/30 bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">
                              LOCAL
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-500/40 bg-blue-950/20 px-4 py-5 text-center"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                      <User size={14} className="text-blue-400" />
                    </div>
                    <p className="text-[11px] font-medium text-blue-300">
                      No persona selected
                    </p>
                    <p className="mt-0.5 text-[10px] text-blue-400">
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
              <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2.5">
                <AlertTriangle
                  size={14}
                  className="flex-shrink-0 text-amber-400"
                />
                <p className="text-[11px] font-medium text-amber-300">
                  Select at least one character
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-950/20 px-3 py-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-[10px] font-bold text-green-400">
                  {totalSelected}
                </span>
                <p className="text-[11px] font-medium text-green-300">
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

  // Resolve display name and image
  const displayName =
    libraryCard?.props.name || draft.data?.name || getDraftCharacterName(draft);
  const displayImageUrl = libraryImageUrl || draft.data?.imageUrl;

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
              LOCAL
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

  if (!character) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border-border-default animate-in slide-in-from-bottom-4 relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full min-h-[400px] flex-col md:flex-row">
          {/* Visual Side - Character Image */}
          <div className="from-brand-600 to-brand-800 relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br md:w-1/3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={character.name || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-white/50">
                  {(character.name || "??").substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 p-6">
              <span className="font-mono text-xs text-white/50">
                CHARACTER_PROFILE
              </span>
            </div>

            <div className="relative z-10 p-6">
              <h2 className="text-2xl leading-tight font-bold text-white">
                {character.name || "Unnamed"}
              </h2>
              {character.version && (
                <p className="mt-1 font-mono text-sm text-white/70">
                  v{character.version}
                </p>
              )}
            </div>
          </div>

          {/* Data Side - Character Info */}
          <div className="bg-surface flex flex-1 flex-col p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-fg-muted mb-1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                  <Activity size={12} /> Character Info
                </h3>
                <div className="bg-brand-500 h-0.5 w-12" />
              </div>
              <button
                onClick={onClose}
                className="hover:bg-surface-raised text-fg-muted hover:text-fg-default rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto">
              {/* Summary */}
              {character.cardSummary && (
                <p className="text-fg-muted border-border-default border-l-2 pl-4 text-sm leading-relaxed">
                  {character.cardSummary}
                </p>
              )}

              {/* Description */}
              {character.description && (
                <div>
                  <h4 className="text-fg-subtle mb-2 font-mono text-[10px] uppercase">
                    Description
                  </h4>
                  <p className="text-fg-muted max-h-40 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
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
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-surface-raised text-brand-300 border-border-default rounded border px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-border-default mt-6 flex justify-end border-t pt-4">
              <Button onClick={onClose} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
