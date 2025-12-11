import { useState, useCallback, useRef, useEffect } from "react";
import {
  Database,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Hash,
  ToggleLeft,
  Type,
  Ruler,
  X,
  Square,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";
import { Button } from "@/shared/ui/forms";
import { Switch } from "@/shared/ui/switch";
import { toastError } from "@/shared/ui/toast";
import {
  refineDataSchema,
  type DataSchemaEntry,
  type DataSchemaContext,
} from "@/app/services/system-agents";
import type { ChatMessage } from "./chat-panel";
import type { ChatHandlers } from "./scenario-step";
import type { SessionStep } from "./session-stepper";

export type FlowTemplateName = "Simple";
export interface TemplateSelectionResult {
  templateName: FlowTemplateName;
  filename: string;
  reason: string;
}

// Shared input styles matching the design system
const INPUT_FOCUS_STYLES = "outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 focus:border-brand-500";

// Format name for display (replace underscores with spaces)
const formatDisplayName = (name: string) => name.replace(/_/g, " ");

/**
 * Data Store Type
 * Represents a trackable variable in the Stats step
 */
export type DataStoreType = "integer" | "number" | "boolean" | "string";

export interface StatsDataStore {
  id: string;
  name: string;
  type: DataStoreType;
  description: string;
  initial: number | boolean | string;
  min?: number;
  max?: number;
  /** If true, this field came from a template and cannot be deleted */
  isFromTemplate?: boolean;
}

// ChatMessage type imported from scenario-step.tsx for unified chat

interface StatsStepProps {
  // Current step for tagging chat messages
  currentStep: SessionStep;
  dataStores: StatsDataStore[];
  onDataStoresChange: (stores: StatsDataStore[]) => void;
  sessionContext?: {
    scenario?: string;
    character?: string;
    cast?: string[];
    firstMessages?: Array<{ title: string; content: string }>;
    lorebook?: Array<{ title: string; keys: string; desc: string }>;
  };
  // Generation state (lifted to parent to disable navigation)
  isGenerating: boolean;
  onIsGeneratingChange: (isGenerating: boolean) => void;
  // Track if generation has been attempted (lifted to parent to persist across step navigation)
  hasAttemptedGeneration: boolean;
  onHasAttemptedGenerationChange: (attempted: boolean) => void;
  // Callback to stop stats generation (handled by parent) - required since parent controls abort controller
  onStopGeneration: () => void;
  // Callback to regenerate stats (handled by parent) - triggers generation from parent
  onRegenerate?: () => void;
  // Selected flow template (lifted to parent for workflow generation)
  selectedTemplate?: TemplateSelectionResult | null;
  onSelectedTemplateChange?: (template: TemplateSelectionResult | null) => void;
  // Response template from selected flow template
  onResponseTemplateChange?: (responseTemplate: string) => void;
  // Chat messages (lifted to parent for persistence across step navigation)
  chatMessages?: ChatMessage[];
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  // Chat handlers ref (for parent to call submit/stop)
  chatHandlersRef: React.MutableRefObject<ChatHandlers | null>;
  // Chat UI state callbacks
  onChatLoadingChange: (loading: boolean) => void;
}
/**
 * Type Icon Component
 * Returns appropriate icon for data store type
 */
function TypeIcon({ type, className }: { type: DataStoreType; className?: string }) {
  switch (type) {
    case "integer":
      return <Hash size={14} className={className} />;
    case "number":
      return <Hash size={14} className={className} />;
    case "boolean":
      return <ToggleLeft size={14} className={className} />;
    case "string":
      return <Type size={14} className={className} />;
    default:
      return <Database size={14} className={className} />;
  }
}

/**
 * Stats Step Component
 * Third step for configuring session data stores/trackers
 */
export function StatsStep({
  currentStep,
  dataStores,
  onDataStoresChange,
  sessionContext,
  isGenerating,
  onIsGeneratingChange,
  hasAttemptedGeneration,
  onHasAttemptedGenerationChange,
  onStopGeneration,
  onRegenerate,
  selectedTemplate,
  onSelectedTemplateChange,
  onResponseTemplateChange,
  chatMessages = [],
  onChatMessagesChange,
  chatHandlersRef,
  onChatLoadingChange,
}: StatsStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    dataStores[0]?.id || null,
  );
  const [isRefining, setIsRefining] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<string>("");

  // Track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);

  // Track latest chatMessages for async callbacks (avoids stale closure)
  const chatMessagesRef = useRef(chatMessages);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Abort controller for AI generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert DataSchemaEntry to StatsDataStore (they're compatible)
  const dataSchemaEntryToStatsDataStore = useCallback(
    (entry: DataSchemaEntry): StatsDataStore => ({
      id: entry.id,
      name: entry.name,
      type: entry.type,
      description: entry.description,
      initial: entry.initial,
      min: entry.min,
      max: entry.max,
    }),
    [],
  );

  // NOTE: generateDataSchema moved to parent (new.tsx) for early triggering
  // Stats generation now starts when leaving Scenario step, not when entering Stats step

  // Stop generation - delegates to parent's handler
  const handleStopGeneration = useCallback(() => {
    // Mark that user manually stopped generation (to skip completion message)
    wasStoppedByUserRef.current = true;
    // Call parent's stop handler (which has the actual abort controller)
    onStopGeneration();
    // Also abort local refine controller if active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Add stopped message to chat (replace previous stopped message if exists)
    const currentMessages = chatMessagesRef.current;
    const messagesWithoutPreviousStopped = currentMessages.filter(
      (m) => m.id !== "stats-generation-stopped"
    );
    const stoppedMessage: ChatMessage = {
      id: "stats-generation-stopped",
      role: "assistant",
      content: dataStoresRef.current.length > 0
        ? `Generation stopped. ${dataStoresRef.current.length} stats have been generated so far.`
        : "Generation stopped. You can add stats manually or try regenerating.",
      step: "stats",
      variant: "cancelled",
      isSystemGenerated: true,
    };
    onChatMessagesChange?.([...messagesWithoutPreviousStopped, stoppedMessage]);
  }, [onStopGeneration, onChatMessagesChange]);

  // Regenerate trackers (clears existing and generates new ones)
  const handleRegenerate = useCallback(() => {
    // Reset attempt flag and clear stores to trigger regeneration
    onHasAttemptedGenerationChange(false);
    onDataStoresChange([]);
    // Trigger regeneration from parent (which controls the generation logic)
    onRegenerate?.();
  }, [onDataStoresChange, onHasAttemptedGenerationChange, onRegenerate]);

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // NOTE: Auto-generation removed - now triggered by parent (new.tsx) when leaving Scenario step
  // This allows stats to be pre-generated while user is on Cast step

  // Refs for latest values in welcome message effect (avoids stale closure)
  // Update on every render to ensure setTimeout callback gets latest values
  const dataStoresRef = useRef(dataStores);
  const isGeneratingRef = useRef(isGenerating);
  dataStoresRef.current = dataStores;
  isGeneratingRef.current = isGenerating;

  // Track previous isGenerating state for completion detection
  const prevIsGeneratingRef = useRef(isGenerating);

  // Track if generation was stopped by user (to differentiate from natural completion)
  const wasStoppedByUserRef = useRef(false);

  // Show completion message when generation finishes (isGenerating: true → false)
  useEffect(() => {
    const wasGenerating = prevIsGeneratingRef.current;
    prevIsGeneratingRef.current = isGenerating;

    // Only trigger when isGenerating changes from true to false
    if (!wasGenerating || isGenerating) return;

    // Skip if user manually stopped generation
    if (wasStoppedByUserRef.current) {
      wasStoppedByUserRef.current = false; // Reset for next generation
      return;
    }

    // Skip if no stats messages exist yet (welcome message hasn't been shown)
    const statsMessages = chatMessagesRef.current.filter(m => m.step === "stats");
    if (statsMessages.length === 0) return;

    // Skip if completion message already exists (including placeholder)
    const hasCompletionMessage = statsMessages.some(m => m.id === "stats-completion" || m.id === "stats-completion-placeholder");
    if (hasCompletionMessage) return;

    // Track if placeholder was added (for cleanup on unmount)
    let placeholderAdded = false;

    // Add placeholder message with typingIndicatorDuration
    const placeholderMessage: ChatMessage = {
      id: "stats-completion-placeholder",
      role: "assistant",
      content: "",
      step: "stats",
      isSystemGenerated: true,
      typingIndicatorDuration: 1000, // Show typing indicator for 1 second
    };
    onChatMessagesChange?.([...chatMessagesRef.current, placeholderMessage]);
    placeholderAdded = true;

    const timer = setTimeout(() => {
      // Skip if component unmounted
      if (!isMountedRef.current) return;

      placeholderAdded = false; // Placeholder will be replaced, no cleanup needed
      const currentDataStores = dataStoresRef.current;
      let content: string;

      if (currentDataStores.length > 0) {
        content = `All done! Generated ${currentDataStores.length} stats for your scenario. Feel free to add or remove any as you like!`;
      } else {
        content = `I couldn't find any specific stats to generate for this scenario. You can add custom stats manually!`;
      }

      // Replace placeholder with actual message
      const updatedMessages = chatMessagesRef.current.filter(m => m.id !== "stats-completion-placeholder");
      const completionMessage: ChatMessage = {
        id: "stats-completion",
        role: "assistant",
        content,
        step: "stats",
        isSystemGenerated: true,
      };
      onChatMessagesChange?.([...updatedMessages, completionMessage]);
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Remove placeholder if it wasn't replaced (component unmounted during timeout)
      if (placeholderAdded && isMountedRef.current) {
        const cleaned = chatMessagesRef.current.filter(m => m.id !== "stats-completion-placeholder");
        if (cleaned.length !== chatMessagesRef.current.length) {
          onChatMessagesChange?.(cleaned);
        }
      }
    };
  }, [isGenerating, onChatMessagesChange]);

  // Show welcome message on first mount with typing indicator
  useEffect(() => {
    // Skip if there are existing stats messages
    const statsMessages = chatMessagesRef.current.filter(m => m.step === "stats");
    if (statsMessages.length > 0) return;

    // Track if placeholder was added and not yet replaced (for cleanup on unmount)
    let placeholderAdded = false;

    // Add placeholder welcome message with typingIndicatorDuration
    // The useTypingIndicator hook will show typing dots for this duration
    const placeholderMessage: ChatMessage = {
      id: "stats-welcome-placeholder",
      role: "assistant",
      content: "",
      step: "stats",
      isSystemGenerated: true,
      typingIndicatorDuration: 1000, // Show typing indicator for 1 second
    };
    onChatMessagesChange?.([...chatMessagesRef.current, placeholderMessage]);
    placeholderAdded = true;

    const timer = setTimeout(() => {
      // Skip if component unmounted
      if (!isMountedRef.current) return;

      placeholderAdded = false; // Placeholder will be replaced, no cleanup needed

      // Use refs to get latest values (avoids stale closure)
      const currentDataStores = dataStoresRef.current;
      const currentIsGenerating = isGeneratingRef.current;

      // Determine welcome message content based on current state
      let content: string;
      if (currentDataStores.length > 0) {
        // Has items - show count (whether still generating or not)
        const suffix = currentIsGenerating ? " Still analyzing..." : " Feel free to adjust them or add more!";
        content = `I've generated ${currentDataStores.length} stats for your scenario.${suffix}`;
      } else if (currentIsGenerating) {
        // No items yet but generating
        content = `I'm analyzing your scenario and generating stats...`;
      } else {
        // No items and not generating
        content = `No stats generated yet. You can add custom stats manually or wait for generation to complete.`;
      }

      // Replace placeholder with actual message
      const updatedMessages = chatMessagesRef.current.filter(m => m.id !== "stats-welcome-placeholder");
      const welcomeMessage: ChatMessage = {
        id: "stats-welcome",
        role: "assistant",
        content,
        step: "stats",
        isSystemGenerated: true,
      };
      onChatMessagesChange?.([...updatedMessages, welcomeMessage]);
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Remove placeholder if it wasn't replaced (component unmounted during timeout)
      if (placeholderAdded) {
        const cleaned = chatMessagesRef.current.filter(m => m.id !== "stats-welcome-placeholder");
        if (cleaned.length !== chatMessagesRef.current.length) {
          onChatMessagesChange?.(cleaned);
        }
      }
    };
  }, []); // Only run on mount

  // Toggle accordion expansion
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Add new data store
  const handleAddStore = useCallback(() => {
    const newId = new UniqueEntityID().toString();
    const newStore: StatsDataStore = {
      id: newId,
      name: "New Tracker",
      type: "string",
      initial: "",
      description: "Describe what this tracks...",
    };
    onDataStoresChange([...dataStores, newStore]);
    setExpandedId(newId);
  }, [dataStores, onDataStoresChange]);

  // Update a data store
  const updateStore = useCallback(
    (id: string, field: keyof StatsDataStore, value: any) => {
      onDataStoresChange(
        dataStores.map((store) => {
          if (store.id !== id) return store;

          const updated = { ...store, [field]: value };

          // Type change handling - reset initial value
          if (field === "type") {
            if (value === "integer") {
              updated.initial = 0;
              // Don't set min/max by default - user can add bounds later
              delete updated.min;
              delete updated.max;
            } else if (value === "boolean") {
              updated.initial = false;
              delete updated.min;
              delete updated.max;
            } else {
              updated.initial = "";
              delete updated.min;
              delete updated.max;
            }
          }
          return updated;
        }),
      );
    },
    [dataStores, onDataStoresChange],
  );

  // Delete a data store
  const handleDelete = useCallback(
    (id: string) => {
      onDataStoresChange(dataStores.filter((s) => s.id !== id));
    },
    [dataStores, onDataStoresChange],
  );

  // Handle refine prompt submission (via chat)
  // Receives prompt from parent
  const handleRefine = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      // Add user message to chat (use ref to get latest messages, avoiding stale closure)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        step: currentStep,
      };
      const currentMessages = chatMessagesRef.current;
      onChatMessagesChange?.([...currentMessages, userMessage]);
      setIsRefining(true);

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Build context for AI - only scenario (no character names to avoid character-specific trackers)
        const context: DataSchemaContext = {
          scenario: sessionContext?.scenario,
        };

        // Convert StatsDataStore to DataSchemaEntry for the service
        const currentStores: DataSchemaEntry[] = dataStores.map((store) => ({
          id: store.id,
          name: store.name,
          type: store.type,
          description: store.description,
          initial: store.initial,
          min: store.min,
          max: store.max,
        }));

        // Track the updated stores
        let updatedStores = [...dataStores];
        const addedStoreNames: string[] = [];
        const removedStoreNames: string[] = [];

        const result = await refineDataSchema({
          prompt,
          context,
          currentStores,
          callbacks: {
            onAddStore: (store) => {
              // Check if aborted before applying
              if (abortControllerRef.current?.signal.aborted) return;
              addedStoreNames.push(store.name);
              updatedStores = [...updatedStores, dataSchemaEntryToStatsDataStore(store)];
              onDataStoresChange(updatedStores);
            },
            onRemoveStore: (id) => {
              // Check if aborted before applying
              if (abortControllerRef.current?.signal.aborted) return;
              const removedStore = updatedStores.find(s => s.id === id);
              if (removedStore) removedStoreNames.push(removedStore.name);
              updatedStores = updatedStores.filter((s) => s.id !== id);
              onDataStoresChange(updatedStores);
            },
            onClearAll: () => {
              // Check if aborted before applying
              if (abortControllerRef.current?.signal.aborted) return;
              removedStoreNames.push(...updatedStores.map(s => s.name));
              updatedStores = [];
              onDataStoresChange([]);
            },
          },
          abortSignal: abortControllerRef.current.signal,
        });

        // Check if aborted before showing result message
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Build AI response message
        let responseText = "Done!";
        if (addedStoreNames.length > 0) {
          responseText = `Added: ${addedStoreNames.join(", ")}`;
        }
        if (removedStoreNames.length > 0) {
          responseText += addedStoreNames.length > 0 ? `. Removed: ${removedStoreNames.join(", ")}` : `Removed: ${removedStoreNames.join(", ")}`;
        }
        if (addedStoreNames.length === 0 && removedStoreNames.length === 0) {
          // No tool calls made - use AI's text response (e.g., redirection message for out-of-scope requests)
          responseText = result.text?.trim() || "No changes were made.";
        }

        // Add AI response to chat (use ref to get latest messages after async operation)
        const aiResponse: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseText,
          step: currentStep,
        };
        onChatMessagesChange?.([...chatMessagesRef.current, aiResponse]);
      } catch (e) {
        // Check if this was an abort - don't show error for user-initiated abort
        if ((e as Error).name === "AbortError" || abortControllerRef.current?.signal.aborted) {
          return;
        }
        console.error("Failed to refine schema:", e);

        // Add error message to chat (use ref to get latest messages after async operation)
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: e instanceof Error
            ? `Sorry, I encountered an error: ${e.message}`
            : "Sorry, I encountered an error. Please try again.",
          step: currentStep,
        };
        onChatMessagesChange?.([...chatMessagesRef.current, errorMessage]);

        toastError("Failed to refine schema", {
          description: e instanceof Error ? e.message : "An unknown error occurred",
        });
      } finally {
        setIsRefining(false);
      }
    },
    [dataStores, onDataStoresChange, dataSchemaEntryToStatsDataStore, onChatMessagesChange, currentStep, sessionContext?.scenario],
  );

  // Handle chat submit - receives prompt from parent
  const handleChatSubmit = useCallback((prompt: string) => {
    if (!prompt.trim()) return;
    handleRefine(prompt);
  }, [handleRefine]);

  // Handle chat stop (abort refining and show cancelled message)
  const handleChatStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      // Keep the reference so catch block can check signal.aborted
    }
    setIsRefining(false);

    // Add cancelled message to chat
    const cancelledMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Response generation was stopped by user.",
      step: currentStep,
      variant: "cancelled",
      isSystemGenerated: true, // Exclude from AI chat history
    };
    onChatMessagesChange?.([...chatMessagesRef.current, cancelledMessage]);
  }, [currentStep, onChatMessagesChange]);

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
    onChatLoadingChange(isRefining);
  }, [isRefining, onChatLoadingChange]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Data Protocol Editor */}
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border-default md:rounded-xl md:border"
      >
          {/* Expandable List */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* Show generating indicator when generating or refining */}
            {(isGenerating || isRefining) && (
              <div className="flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-brand-500" />
                  <span className="animate-pulse font-mono text-xs text-brand-400">
                    {isRefining ? "REFINING VARIABLES..." : templateStatus || `DERIVING VARIABLES... (${dataStores.length} found)`}
                  </span>
                </div>
                <Button
                  onClick={handleStopGeneration}
                  variant="secondary"
                  size="sm"
                  icon={<Square size={14} />}
                >
                  Stop
                </Button>
              </div>
            )}

            {/* Empty state - only show when not generating and no stores */}
            {!isGenerating && dataStores.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                  <Database size={24} className="text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  {hasAttemptedGeneration ? "No trackers were generated" : "No trackers defined"}
                </p>
                <p className="mt-1 max-w-[280px] text-xs text-zinc-500">
                  {hasAttemptedGeneration
                    ? "AI couldn't find suitable trackers for your scenario"
                    : "Add trackers manually or use AI to generate them"}
                </p>
                {/* Action buttons inside empty state */}
                <div className="mt-6 flex items-center gap-3">
                  {hasAttemptedGeneration && (
                    <Button
                      onClick={handleRegenerate}
                      variant="secondary"
                      size="sm"
                      icon={<RefreshCw size={16} />}
                    >
                      Regenerate
                    </Button>
                  )}
                  <Button
                    onClick={handleAddStore}
                    variant="default"
                    size="sm"
                    icon={<Plus size={16} />}
                  >
                    Add Tracker
                  </Button>
                </div>
              </div>
            )}

            {/* Header with action button - only show when stores exist */}
            {dataStores.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-muted">
                  {dataStores.length} tracker{dataStores.length !== 1 ? "s" : ""}
                </span>
                <Button
                  onClick={handleAddStore}
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>
            )}
          {/* Data stores list - shows during generation as stores arrive */}
          {dataStores.length > 0 && (
            dataStores.map((store) => {
              const isExpanded = expandedId === store.id;
              return (
                <div
                  key={store.id}
                  className={cn(
                    "overflow-hidden rounded-xl border transition-all",
                    isExpanded
                      ? "border-brand-400 bg-surface-raised"
                      : "border-border-default bg-surface-raised hover:border-border-muted",
                  )}
                >
                  {/* Header / Summary Row */}
                  <div
                    className="flex cursor-pointer select-none items-center justify-between px-4 py-3"
                    onClick={() => toggleExpand(store.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border",
                          isExpanded
                            ? "border-brand-400/30 bg-brand-600/20 text-brand-300"
                            : "border-border-default bg-surface text-fg-muted",
                        )}
                      >
                        <TypeIcon type={store.type} />
                      </div>
                      <div>
                        <h4
                          className={cn(
                            "text-sm font-bold",
                            isExpanded ? "text-fg-default" : "text-fg-default",
                          )}
                        >
                          {formatDisplayName(store.name)}
                        </h4>
                        <p className="font-mono text-xs text-fg-muted">
                          {store.type} •{" "}
                          {store.initial === "" ? "empty" : String(store.initial)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Template badge - show if from template */}
                      {store.isFromTemplate && (
                        <div className="flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400">
                          <Sparkles size={10} />
                          Template
                        </div>
                      )}
                      {/* Delete button - only show for non-template fields */}
                      {!store.isFromTemplate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(store.id);
                          }}
                          className="p-1.5 text-fg-subtle transition-colors hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-fg-muted" />
                      ) : (
                        <ChevronDown size={16} className="text-fg-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Editor Form */}
                  {isExpanded && (
                    <div className="mt-2 space-y-4 border-t border-border-subtle px-4 pt-3 pb-4">
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-fg-muted">
                            Name
                          </label>
                          <input
                            type="text"
                            value={store.name}
                            onChange={(e) =>
                              updateStore(store.id, "name", e.target.value)
                            }
                            className={cn(
                              "w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-fg-default",
                              INPUT_FOCUS_STYLES,
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-fg-muted">
                            Type
                          </label>
                          <select
                            value={store.type}
                            onChange={(e) =>
                              updateStore(
                                store.id,
                                "type",
                                e.target.value as DataStoreType,
                              )
                            }
                            className={cn(
                              "w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-fg-default",
                              INPUT_FOCUS_STYLES,
                            )}
                          >
                            <option value="string">String (Text)</option>
                            <option value="integer">Integer (Number)</option>
                            <option value="boolean">Boolean (On/Off)</option>
                          </select>
                        </div>
                      </div>

                      {/* Description - moved up */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-fg-muted">
                          Description
                        </label>
                        <textarea
                          value={store.description}
                          onChange={(e) =>
                            updateStore(store.id, "description", e.target.value)
                          }
                          className={cn(
                            "h-16 w-full resize-none rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs text-fg-muted",
                            INPUT_FOCUS_STYLES,
                          )}
                        />
                      </div>

                      {/* Values - moved down */}
                      <div className="space-y-3 rounded-lg border border-border-subtle bg-canvas/40 p-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-fg-muted">
                            Values
                          </label>
                          {store.type === "integer" && store.min === undefined && store.max === undefined && (
                            <button
                              onClick={() => {
                                // Update both min and max in a single state update to avoid stale state
                                onDataStoresChange(
                                  dataStores.map((s) => {
                                    if (s.id !== store.id) return s;
                                    return { ...s, min: 0, max: 100 };
                                  }),
                                );
                              }}
                              className="flex items-center gap-1 rounded border border-border-default bg-surface px-2 py-1 text-[10px] text-fg-muted transition-colors hover:border-brand-400 hover:text-brand-400"
                            >
                              <Ruler size={12} />
                              Set Bounds
                            </button>
                          )}
                        </div>

                        {store.type === "integer" && (
                          <div className="space-y-3">
                            {/* Initial value input */}
                            <div className="space-y-1">
                              <span className="block text-[9px] text-fg-subtle">Initial Value</span>
                              <input
                                type="number"
                                value={store.initial as number}
                                onChange={(e) =>
                                  updateStore(
                                    store.id,
                                    "initial",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className={cn(
                                  "w-full rounded border border-border-default bg-surface px-2 py-1 text-xs text-fg-default",
                                  INPUT_FOCUS_STYLES,
                                )}
                              />
                            </div>

                            {/* Min/Max bounds - only shown when defined */}
                            {store.min !== undefined && store.max !== undefined && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-fg-subtle">Bounds (for slider display)</span>
                                  <button
                                    onClick={() => {
                                      // Remove bounds by setting to undefined
                                      onDataStoresChange(
                                        dataStores.map((s) => {
                                          if (s.id !== store.id) return s;
                                          const updated = { ...s };
                                          delete updated.min;
                                          delete updated.max;
                                          return updated;
                                        }),
                                      );
                                    }}
                                    className="flex items-center gap-1 text-[10px] text-fg-subtle transition-colors hover:text-red-400"
                                  >
                                    <X size={10} />
                                    Remove
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 space-y-1">
                                    <span className="block text-[9px] text-fg-subtle">Min</span>
                                    <input
                                      type="number"
                                      value={store.min}
                                      onChange={(e) =>
                                        updateStore(
                                          store.id,
                                          "min",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className={cn(
                                        "w-full rounded border border-border-default bg-surface px-2 py-1 text-xs text-fg-muted",
                                        INPUT_FOCUS_STYLES,
                                      )}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <span className="block text-[9px] text-fg-subtle">Max</span>
                                    <input
                                      type="number"
                                      value={store.max}
                                      onChange={(e) =>
                                        updateStore(
                                          store.id,
                                          "max",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className={cn(
                                        "w-full rounded border border-border-default bg-surface px-2 py-1 text-xs text-fg-muted",
                                        INPUT_FOCUS_STYLES,
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {store.type === "string" && (
                          <input
                            type="text"
                            value={store.initial as string}
                            onChange={(e) =>
                              updateStore(store.id, "initial", e.target.value)
                            }
                            placeholder="Initial text..."
                            className={cn(
                              "w-full rounded border border-border-default bg-surface px-3 py-2 text-xs text-fg-default placeholder:text-fg-subtle",
                              INPUT_FOCUS_STYLES,
                            )}
                          />
                        )}

                        {store.type === "boolean" && (
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={store.initial as boolean}
                              onCheckedChange={(checked) =>
                                updateStore(store.id, "initial", checked)
                              }
                              size="small"
                            />
                            <span className="font-mono text-xs text-fg-muted">
                              {store.initial ? "TRUE" : "FALSE"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>
    </div>
  );
}
