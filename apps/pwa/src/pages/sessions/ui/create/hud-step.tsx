import { useState, useCallback, useRef, useEffect } from "react";
import {
  Database,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Hash,
  ToggleLeft,
  Type,
  Smartphone,
  Ruler,
  X,
  Square,
  Sparkles,
} from "lucide-react";
import { cn, logger } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";
import { Button } from "@/shared/ui/forms";
import { Switch } from "@/shared/ui/switch";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  generateDataSchema as generateDataSchemaAI,
  refineDataSchema,
  type DataSchemaEntry,
  type DataSchemaContext,
} from "@/app/services/system-agents";
import {
  selectFlowTemplate,
  loadFlowTemplate,
  type TemplateSelectionResult,
  type FlowTemplateName,
} from "@/app/services/system-agents/flow-template-matcher";

// Shared input styles matching the design system
const INPUT_FOCUS_STYLES = "outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0 focus:border-brand-500";

/**
 * Data Store Type
 * Represents a trackable variable in the HUD
 */
export type DataStoreType = "integer" | "boolean" | "string";

export interface HudDataStore {
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

interface HudStepProps {
  dataStores: HudDataStore[];
  onDataStoresChange: (stores: HudDataStore[]) => void;
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
  // Selected flow template (lifted to parent for workflow generation)
  selectedTemplate?: TemplateSelectionResult | null;
  onSelectedTemplateChange?: (template: TemplateSelectionResult | null) => void;
  // Response template from selected flow template
  onResponseTemplateChange?: (responseTemplate: string) => void;
}

/**
 * Generate a simple hash from scenario content for change detection
 */
function generateContentHash(context: HudStepProps["sessionContext"]): string {
  if (!context) return "";

  const parts: string[] = [];

  // Include scenario background
  if (context.scenario) {
    parts.push(context.scenario);
  }

  // Include character name
  if (context.character) {
    parts.push(context.character);
  }

  // Include cast names
  if (context.cast && context.cast.length > 0) {
    parts.push(context.cast.join(","));
  }

  // Include first messages content
  if (context.firstMessages && context.firstMessages.length > 0) {
    parts.push(context.firstMessages.map(m => `${m.title}:${m.content}`).join("|"));
  }

  // Include lorebook content
  if (context.lorebook && context.lorebook.length > 0) {
    parts.push(context.lorebook.map(l => `${l.title}:${l.keys}:${l.desc}`).join("|"));
  }

  // Simple hash using string length and character sum for quick comparison
  const combined = parts.join("###");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${combined.length}-${hash}`;
}

/**
 * Type Icon Component
 * Returns appropriate icon for data store type
 */
function TypeIcon({ type, className }: { type: DataStoreType; className?: string }) {
  switch (type) {
    case "integer":
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
 * HUD Preview Component
 * Shows how data stores appear in-session
 */
function HudPreview({ dataStores }: { dataStores: HudDataStore[] }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden p-8">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-500-rgb),0.05)_0,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <h3 className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-fg-muted">
            <Smartphone size={16} /> Player View
          </h3>
          <p className="mt-1 text-[10px] text-fg-subtle">
            This is how the HUD appears in-session
          </p>
        </div>

        {/* Device Container */}
        <div className="relative overflow-hidden rounded-3xl border border-border-default bg-surface-raised shadow-2xl ring-4 ring-surface">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border-default bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <span className="font-mono text-[10px] text-fg-muted">SESSION_ACTIVE</span>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] space-y-3 bg-surface/50 p-4">
            <div className="mb-2 ml-1 text-[10px] font-bold uppercase text-fg-muted">
              Current State
            </div>

            {dataStores.length === 0 ? (
              <div className="py-10 text-center text-xs italic text-fg-subtle">
                No active trackers. Add some on the left.
              </div>
            ) : (
              dataStores.map((store) => (
                <div
                  key={store.id}
                  className="group relative overflow-hidden rounded-lg border border-border-subtle bg-surface-raised p-3 transition-colors hover:border-brand-400/30"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-fg-default">
                      {store.name}
                    </span>
                    {store.type === "integer" && store.min !== undefined && store.max !== undefined && (
                      <span className="font-mono text-[10px] text-brand-400">
                        {store.initial as number} / {store.max}
                      </span>
                    )}
                  </div>

                  {/* Integer with bounds = slider */}
                  {store.type === "integer" && store.min !== undefined && store.max !== undefined && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((store.initial as number - store.min) / (store.max - store.min)) * 100))}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Integer without bounds = just number */}
                  {store.type === "integer" && (store.min === undefined || store.max === undefined) && (
                    <div className="mt-1 rounded border border-border-subtle bg-canvas p-1.5 font-mono text-xs text-fg-muted">
                      {store.initial as number}
                    </div>
                  )}

                  {store.type === "boolean" && (
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          store.initial
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-red-500",
                        )}
                      />
                      <span
                        className={cn(
                          "font-mono text-[10px]",
                          store.initial ? "text-emerald-500" : "text-fg-muted",
                        )}
                      >
                        {store.initial ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>
                  )}

                  {store.type === "string" && (
                    <div className="mt-1 rounded border border-border-subtle bg-canvas p-1.5 font-mono text-xs text-fg-muted">
                      {(store.initial as string) || "—"}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HUD Step Component
 * Third step for configuring session data stores/trackers
 */
export function HudStep({
  dataStores,
  onDataStoresChange,
  sessionContext,
  isGenerating,
  onIsGeneratingChange,
  selectedTemplate,
  onSelectedTemplateChange,
  onResponseTemplateChange,
}: HudStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    dataStores[0]?.id || null,
  );
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<string>("");

  // Track the last content hash that triggered generation
  const lastContentHashRef = useRef<string>("");

  // Track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);

  // Abort controller for AI generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert DataSchemaEntry to HudDataStore (they're compatible)
  const dataSchemaEntryToHudDataStore = useCallback(
    (entry: DataSchemaEntry): HudDataStore => ({
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

  // Convert flow template dataStoreSchema field to HudDataStore
  const templateFieldToHudDataStore = useCallback(
    (field: { id: string; name: string; type: string; initialValue?: string }): HudDataStore => {
      // Map type from template (could be "string", "number", "integer", "boolean")
      let type: DataStoreType = "string";
      if (field.type === "number" || field.type === "integer") {
        type = "integer";
      } else if (field.type === "boolean") {
        type = "boolean";
      }

      // Parse initial value based on type
      let initial: number | boolean | string = "";
      if (type === "integer") {
        initial = parseInt(field.initialValue || "0", 10) || 0;
      } else if (type === "boolean") {
        initial = field.initialValue === "true";
      } else {
        initial = field.initialValue || "";
      }

      return {
        id: field.id,
        name: field.name,
        type,
        description: `From ${selectedTemplate?.templateName || "template"} template`,
        initial,
        isFromTemplate: true, // Mark as template field - cannot be deleted
      };
    },
    [selectedTemplate?.templateName],
  );

  // Ref to store latest sessionContext for use in callbacks
  const sessionContextRef = useRef(sessionContext);
  sessionContextRef.current = sessionContext;

  // Ref to track stores being generated (for incremental updates)
  const generatingStoresRef = useRef<HudDataStore[]>([]);

  // Generate data stores using AI based on context
  // 1. First select a flow template using AI
  // 2. Load template's dataStoreSchema fields (fixed)
  // 3. Generate additional fields using AI
  const generateDataSchema = useCallback(async () => {
    onIsGeneratingChange(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear existing stores and reset tracking ref
    generatingStoresRef.current = [];
    onDataStoresChange([]);

    try {
      const ctx = sessionContextRef.current;
      const scenario = ctx?.scenario || "";

      // Step 1: Select flow template using AI
      setTemplateStatus("Selecting workflow template...");
      logger.info("[HudStep] Selecting flow template...");

      const templateResult = await selectFlowTemplate(
        scenario,
        abortControllerRef.current.signal
      );

      logger.info("[HudStep] Template selected", templateResult);
      onSelectedTemplateChange?.(templateResult);

      // Step 2: Load template and extract dataStoreSchema fields
      setTemplateStatus(`Loading ${templateResult.templateName} template...`);
      const templateJson = await loadFlowTemplate(templateResult.filename);

      // Extract responseTemplate from template and pass to parent
      if (templateJson.responseTemplate && typeof templateJson.responseTemplate === "string") {
        onResponseTemplateChange?.(templateJson.responseTemplate);
      }

      // Extract dataStoreSchema fields from template
      const templateFields: HudDataStore[] = [];
      if (templateJson.dataStoreSchema?.fields && Array.isArray(templateJson.dataStoreSchema.fields)) {
        for (const field of templateJson.dataStoreSchema.fields) {
          const hudStore = templateFieldToHudDataStore(field);
          templateFields.push(hudStore);
        }
      }

      // Add template fields immediately
      if (templateFields.length > 0) {
        generatingStoresRef.current = [...templateFields];
        onDataStoresChange(generatingStoresRef.current);
        setExpandedId(templateFields[0].id);

        toastSuccess(`Using ${templateResult.templateName} template`, {
          description: `Loaded ${templateFields.length} pre-defined variables`,
        });
      }

      // Step 3: Generate additional fields using AI (if scenario is substantial)
      if (scenario.length >= 200) {
        setTemplateStatus("Generating additional variables...");

        // Build context for AI - include template fields so it doesn't duplicate
        const context: DataSchemaContext = {
          scenario,
        };

        // Convert template fields to DataSchemaEntry format for the AI
        const existingStores: DataSchemaEntry[] = templateFields.map((store) => ({
          id: store.id,
          name: store.name,
          type: store.type,
          description: store.description,
          initial: store.initial,
          min: store.min,
          max: store.max,
        }));

        await generateDataSchemaAI({
          context,
          currentStores: existingStores,
          callbacks: {
            onAddStore: (store) => {
              // Add AI-generated store incrementally
              const hudStore = dataSchemaEntryToHudDataStore(store);
              generatingStoresRef.current = [...generatingStoresRef.current, hudStore];
              onDataStoresChange(generatingStoresRef.current);
            },
            onRemoveStore: () => {},
            onClearAll: () => {},
          },
          abortSignal: abortControllerRef.current.signal,
        });
      }

      setTemplateStatus("");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        // Request was cancelled, ignore
        setTemplateStatus("");
        return;
      }
      console.error("Failed to generate data schema:", e);
      toastError("Failed to generate data schema", {
        description: e instanceof Error ? e.message : "An unknown error occurred",
      });
      setTemplateStatus("");
    } finally {
      onIsGeneratingChange(false);
    }
  }, [onDataStoresChange, dataSchemaEntryToHudDataStore, templateFieldToHudDataStore, onIsGeneratingChange, onSelectedTemplateChange]);

  // Stop generation
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    onIsGeneratingChange(false);
  }, [onIsGeneratingChange]);

  // Compute current content hash
  const currentContentHash = generateContentHash(sessionContext);

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

  // Auto-generate data schema when entering the HUD step or when content changes
  useEffect(() => {
    // Generate if:
    // 1. No data stores exist (first time or previous generation was aborted), OR
    // 2. Content has changed since last successful generation
    const needsInitialGeneration = dataStores.length === 0 && !isGenerating;
    const hasContentChanged = lastContentHashRef.current !== "" &&
                              lastContentHashRef.current !== currentContentHash &&
                              dataStores.length > 0;

    logger.info("[HudStep] useEffect triggered", {
      currentContentHash,
      lastContentHash: lastContentHashRef.current,
      dataStoresLength: dataStores.length,
      isGenerating,
      needsInitialGeneration,
      hasContentChanged,
    });

    if (needsInitialGeneration || hasContentChanged) {
      logger.info("[HudStep] Conditions met, will generate data schema", {
        needsInitialGeneration,
        hasContentChanged,
      });

      // Store the hash we're about to generate for
      const hashToGenerate = currentContentHash;

      // Delay slightly to avoid StrictMode double-mount issues
      const timeoutId = setTimeout(() => {
        logger.info("[HudStep] Timeout fired, checking if mounted", {
          isMounted: isMountedRef.current,
        });
        if (isMountedRef.current) {
          // Only update the ref and generate if we're still mounted
          lastContentHashRef.current = hashToGenerate;
          logger.info("[HudStep] Calling generateDataSchema");
          generateDataSchema();
        }
      }, 150); // Slightly longer timeout to survive StrictMode

      return () => {
        logger.info("[HudStep] Cleanup - clearing timeout (NOT updating hash ref)");
        clearTimeout(timeoutId);
        // Don't update lastContentHashRef here - let it stay empty so next mount can generate
      };
    } else {
      logger.info("[HudStep] Conditions NOT met, skipping generation");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContentHash, dataStores.length, isGenerating]); // Re-run when stores change or generation completes

  // Toggle accordion expansion
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Add new data store
  const handleAddStore = useCallback(() => {
    const newId = new UniqueEntityID().toString();
    const newStore: HudDataStore = {
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
    (id: string, field: keyof HudDataStore, value: any) => {
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

  // Handle refine prompt submission
  const handleRefine = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!refinePrompt.trim()) return;

      setIsRefining(true);

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Build context for AI - only scenario (no character names to avoid character-specific trackers)
        const ctx = sessionContextRef.current;
        const context: DataSchemaContext = {
          scenario: ctx?.scenario,
        };

        // Convert HudDataStore to DataSchemaEntry for the service
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

        await refineDataSchema({
          prompt: refinePrompt,
          context,
          currentStores,
          callbacks: {
            onAddStore: (store) => {
              updatedStores = [...updatedStores, dataSchemaEntryToHudDataStore(store)];
              onDataStoresChange(updatedStores);
            },
            onRemoveStore: (id) => {
              updatedStores = updatedStores.filter((s) => s.id !== id);
              onDataStoresChange(updatedStores);
            },
            onClearAll: () => {
              updatedStores = [];
              onDataStoresChange([]);
            },
          },
          abortSignal: abortControllerRef.current.signal,
        });

        setRefinePrompt("");
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Failed to refine schema:", e);
        toastError("Failed to refine schema", {
          description: e instanceof Error ? e.message : "An unknown error occurred",
        });
      } finally {
        setIsRefining(false);
      }
    },
    [refinePrompt, dataStores, onDataStoresChange, dataSchemaEntryToHudDataStore],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-6 overflow-hidden px-0 md:flex-row md:px-6 md:pb-6">
        {/* Left Panel: Editor List */}
        <div className="flex min-w-0 flex-1 flex-col border-border-default md:max-w-2xl md:rounded-xl md:border">
          {/* Header */}
          <div className="flex flex-shrink-0 flex-col gap-4 border-b border-border-default p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-fg-default">
                  <Database size={20} className="text-brand-400" />
                  Data Protocol
                </h1>
                <p className="mt-1 font-mono text-xs text-fg-muted">
                  DEFINE VARIABLES FOR AI TO TRACK
                </p>
              </div>
              <Button
                onClick={handleAddStore}
                variant="default"
                size="sm"
                icon={<Plus size={16} />}
              >
                <span className="hidden sm:inline">New Tracker</span>
              </Button>
            </div>
          </div>

        {/* AI Command Bar */}
        <div className="flex flex-shrink-0 gap-2 border-b border-border-default bg-surface/50 p-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="Ask AI to adjust schema (e.g. 'Add a stress meter')..."
              className={cn(
                "w-full rounded-lg border border-border-default bg-surface py-2 pr-10 pl-3 text-sm text-fg-default transition-all placeholder:text-fg-subtle",
                INPUT_FOCUS_STYLES,
              )}
              onKeyDown={(e) => e.key === "Enter" && handleRefine(e)}
            />
            <button
              onClick={isGenerating || isRefining ? handleStopGeneration : handleRefine}
              disabled={!isGenerating && !isRefining && !refinePrompt.trim()}
              className={cn(
                "absolute top-1 right-1 bottom-1 flex aspect-square items-center justify-center rounded-md text-white transition-colors disabled:opacity-50",
                isGenerating || isRefining
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-brand-600 hover:bg-brand-500",
              )}
              title={isGenerating || isRefining ? "Stop generation" : "Send"}
            >
              {isGenerating || isRefining ? (
                <Square size={14} />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>

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
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-fg-muted">
              <Database size={48} className="text-fg-subtle" />
              <div className="text-center">
                <p className="text-sm font-medium">No trackers defined</p>
                <p className="mt-1 text-xs text-fg-subtle">
                  Add trackers manually or use AI to generate them
                </p>
              </div>
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
                          {store.name}
                        </h4>
                        <p className="font-mono text-[10px] uppercase text-fg-muted">
                          {store.type} •{" "}
                          {store.initial === "" ? "EMPTY" : String(store.initial)}
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
                          <label className="text-[10px] font-bold uppercase text-fg-muted">
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
                          <label className="text-[10px] font-bold uppercase text-fg-muted">
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
                        <label className="text-[10px] font-bold uppercase text-fg-muted">
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
                          <label className="block text-[10px] font-bold uppercase text-fg-muted">
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

        {/* Right Panel: Preview (hidden on mobile) */}
        <div className="hidden flex-1 border-border-default bg-canvas md:rounded-xl md:border lg:block">
          <HudPreview dataStores={dataStores} />
        </div>
      </div>
    </div>
  );
}
