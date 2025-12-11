import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import { MobileTabNav, type MobileTab } from "./mobile-tab-nav";
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
import { ChatPanel, CHAT_AGENTS, type ChatMessage } from "./chat-panel";
import type { SessionStep } from "./session-stepper";
import { StepHeader } from "./step-header";

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
  // Selected flow template (lifted to parent for workflow generation)
  selectedTemplate?: TemplateSelectionResult | null;
  onSelectedTemplateChange?: (template: TemplateSelectionResult | null) => void;
  // Response template from selected flow template
  onResponseTemplateChange?: (responseTemplate: string) => void;
  // Chat messages (lifted to parent for persistence across step navigation)
  chatMessages?: ChatMessage[];
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  // Mobile tab state (controlled by parent for navigation)
  mobileTab: "editor" | "chat";
  onMobileTabChange: (tab: "editor" | "chat") => void;
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
  selectedTemplate,
  onSelectedTemplateChange,
  onResponseTemplateChange,
  chatMessages = [],
  onChatMessagesChange,
  mobileTab,
  onMobileTabChange,
}: StatsStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    dataStores[0]?.id || null,
  );
  const [refinePrompt, setRefinePrompt] = useState("");
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
    // Call parent's stop handler (which has the actual abort controller)
    onStopGeneration();
    // Also abort local refine controller if active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [onStopGeneration]);

  // Regenerate trackers (clears existing and generates new ones)
  const handleRegenerate = useCallback(() => {
    // Reset attempt flag and clear stores to trigger regeneration
    onHasAttemptedGenerationChange(false);
    onDataStoresChange([]);
  }, [onDataStoresChange, onHasAttemptedGenerationChange]);

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
  const handleRefine = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!refinePrompt.trim()) return;

      // Add user message to chat (use ref to get latest messages, avoiding stale closure)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: refinePrompt,
        step: currentStep,
      };
      const currentMessages = chatMessagesRef.current;
      onChatMessagesChange?.([...currentMessages, userMessage]);

      const promptText = refinePrompt;
      setRefinePrompt("");
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

        await refineDataSchema({
          prompt: promptText,
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
          responseText = "No changes were made.";
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
    [refinePrompt, dataStores, onDataStoresChange, dataSchemaEntryToStatsDataStore, onChatMessagesChange, currentStep],
  );

  // Handle chat submit (wraps handleRefine)
  const handleChatSubmit = useCallback(() => {
    if (!refinePrompt.trim()) return;
    // Create a synthetic form event for handleRefine
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleRefine(syntheticEvent);
  }, [refinePrompt, handleRefine]);

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

  // Mobile tab configuration
  const mobileTabs = useMemo<MobileTab<"editor" | "chat">[]>(
    () => [
      { value: "editor", label: "Editor", icon: <Database size={14} /> },
      { value: "chat", label: "AI", icon: <Sparkles size={14} /> },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mobile Tab Navigation */}
      <MobileTabNav
        value={mobileTab}
        onValueChange={onMobileTabChange}
        tabs={mobileTabs}
      />

      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4 overflow-hidden px-0 md:flex-row md:gap-6 md:px-6 md:pb-6">
        {/* Left Panel: AI Chat */}
        <ChatPanel
          messages={chatMessages}
          agent={CHAT_AGENTS.hud}
          inputValue={refinePrompt}
          onInputChange={setRefinePrompt}
          onSubmit={handleChatSubmit}
          onStop={isRefining ? handleChatStop : undefined}
          isLoading={isRefining}
          disabled={isRefining}
          className={mobileTab === "chat" ? "" : "hidden md:flex"}
        />

        {/* Right Panel: Data Protocol Editor */}
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border-default md:rounded-xl md:border",
            mobileTab === "editor" ? "" : "hidden md:flex",
          )}
        >
          <StepHeader
            icon={<Database size={20} />}
            title="Data Protocol"
            subtitle="Define variables for AI to track"
            actions={
              <>
                {hasAttemptedGeneration && !isGenerating && dataStores.length === 0 && (
                  <Button
                    onClick={handleRegenerate}
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={16} />}
                    title="Regenerate trackers from scenario"
                  >
                    <span className="hidden sm:inline">Regenerate</span>
                  </Button>
                )}
                <Button
                  onClick={handleAddStore}
                  variant="default"
                  size="sm"
                  icon={<Plus size={16} />}
                >
                  <span className="hidden sm:inline">New Tracker</span>
                </Button>
              </>
            }
          />

        {/* Expandable List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* Show generating indicator at top when generating or refining */}
          {(isGenerating || isRefining) && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-brand-500" />
                  <span className="animate-pulse font-mono text-xs text-brand-400">
                    {isRefining ? "REFINING VARIABLES..." : templateStatus || `DERIVING VARIABLES... (${dataStores.length} found)`}
                  </span>
                </div>
                {selectedTemplate && !isRefining && (
                  <span className="ml-8 text-[10px] text-fg-muted">
                    Template: {selectedTemplate.templateName}
                  </span>
                )}
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <Database size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-400">
                {hasAttemptedGeneration ? "No trackers were generated" : "No trackers defined"}
              </p>
              <p className="mt-1 max-w-[280px] text-xs text-zinc-500">
                {hasAttemptedGeneration
                  ? "AI couldn't find suitable trackers for your scenario"
                  : "Add trackers manually or use AI to generate them"}
              </p>
              {hasAttemptedGeneration && (
                <Button
                  onClick={handleAddStore}
                  variant="outline"
                  size="sm"
                  icon={<Plus size={16} />}
                  className="mt-4"
                >
                  New Tracker
                </Button>
              )}
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
    </div>
  );
}
