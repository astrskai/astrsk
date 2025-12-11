import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  CastStep,
  ScenarioStep,
  StatsStep,
  CharacterCreateDialog,
  SessionStepper,
  SESSION_STEPS,
  type SessionStep,
  type FirstMessage,
  type LorebookEntry,
  type StatsDataStore,
  type ChatMessage,
} from "./ui/create";
import { logger } from "@/shared/lib";
import {
  DraftCharacter,
  needsCreation,
  getDraftCharacterName,
} from "./ui/create/draft-character";
import { useCreateCharacterCard } from "@/entities/character/api/mutations";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType, Lorebook, Entry } from "@/entities/card/domain";
import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { useCreateSession } from "@/entities/session/api";
import { useModelStore } from "@/shared/stores/model-store";
import { SessionService } from "@/app/services/session-service";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { queryClient } from "@/shared/api/query-client";
import { TableName } from "@/db/schema/table-name";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { DialogConfirm } from "@/shared/ui/dialogs";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import {
  generateWorkflow,
  workflowStateToFlowData,
  type WorkflowBuilderContext,
  type StatsDataStoreField,
  type WorkflowState,
  type WorkflowBuilderProgress,
  ModelTier,
} from "@/app/services/system-agents/workflow-builder";
import {
  generateDataSchema as generateDataSchemaAI,
  type DataSchemaContext,
  type DataSchemaEntry,
} from "@/app/services/system-agents";
import type { TemplateSelectionResult, DataStoreType } from "./ui/create/stats-step";
import { Sparkles, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

/**
 * Create Session Page
 * New 3-step wizard for creating a session
 *
 * Steps:
 * 1. Cast - Select player character and AI characters
 * 2. Scenario - Select scenario card (optional)
 * 3. HUD - Configure display settings (placeholder)
 */
export function CreateSessionPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<SessionStep>("scenario");

  // Mobile cast tab state (lifted from CastStep for navigation control)
  // Note: "chat" tab removed - now using MobileChatSheet bottom sheet
  const [mobileCastTab, setMobileCastTab] = useState<"library" | "cast">(
    "library",
  );

  // Mobile scenario tab state (lifted from ScenarioStep for navigation control)
  const [mobileScenarioTab, setMobileScenarioTab] = useState<
    "chat" | "builder"
  >("builder");

  // Mobile HUD tab state (lifted from StatsStep for navigation control)
  const [mobileHudTab, setMobileHudTab] = useState<"editor" | "chat">("editor");

  // Character create dialog state
  const [showCharacterCreateDialog, setShowCharacterCreateDialog] =
    useState(false);

  // Character import file input ref
  const characterImportRef = useRef<HTMLInputElement>(null);

  // Cast state - draft characters (can be from library, import, or chat)
  // Characters are NOT saved to DB until final "Create Session" button is clicked
  const [playerCharacter, setPlayerCharacter] = useState<DraftCharacter | null>(
    null,
  );
  const [aiCharacters, setAiCharacters] = useState<DraftCharacter[]>([]);
  // Draft characters shown in library (from import/chat/create) - not yet assigned to roster
  const [draftCharacters, setDraftCharacters] = useState<DraftCharacter[]>([]);

  // Mutation for creating characters at session finalization
  const createCharacterMutation = useCreateCharacterCard();

  // Scenario state
  const defaultScenarioTemplate = `Scene:
Location:
Time Period:
Ground Rules:`;
  const [scenarioBackground, setScenarioBackground] = useState(
    defaultScenarioTemplate,
  );
  const [scenarioFirstMessages, setScenarioFirstMessages] = useState<
    FirstMessage[]
  >([]);
  const [scenarioLorebook, setScenarioLorebook] = useState<LorebookEntry[]>([]);
  const [isScenarioGenerating, setIsScenarioGenerating] = useState(false);

  // Unified chat messages (shared across all steps)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Functional update helper to add messages (avoids stale closure issues in async callbacks)
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  // Stats state
  const [statsDataStores, setStatsDataStores] = useState<StatsDataStore[]>([]);
  const [isStatsGenerating, setIsStatsGenerating] = useState(false);
  // Track if stats generation has been attempted (persists across step navigation)
  const [hasAttemptedStatsGeneration, setHasAttemptedStatsGeneration] =
    useState(false);
  // Selected flow template from HUD step (determined by AI based on scenario)
  const [selectedFlowTemplate, setSelectedFlowTemplate] =
    useState<TemplateSelectionResult | null>(null);
  // Response template from selected flow template (for final output formatting)
  const [flowResponseTemplate, setFlowResponseTemplate] = useState<string>("");

  // Workflow generation state
  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowState | null>(null);
  const [generatedSessionName, setGeneratedSessionName] = useState<string | null>(null);
  const [isWorkflowGenerating, setIsWorkflowGenerating] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowBuilderProgress | null>(null);
  const workflowGenerationPromiseRef =
    useRef<Promise<{ state: WorkflowState; sessionName: string } | null> | null>(null);
  // Show waiting dialog only when user tries to create session and workflow is still generating
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);

  // Stats generation refs (for abort control and incremental updates)
  const statsAbortControllerRef = useRef<AbortController | null>(null);
  const generatingStoresRef = useRef<StatsDataStore[]>([]);
  // Refs mirror state for immediate checks in useCallback (avoids stale closure issues)
  const hasAttemptedStatsGenerationRef = useRef(false);
  const isStatsGeneratingRef = useRef(false);
  const isUserStoppedRef = useRef(false); // Track user-initiated stop for current generation
  // Persists across navigation - prevents auto-regeneration when user explicitly stopped
  const userExplicitlyStoppedRef = useRef(false);
  const scenarioBackgroundRef = useRef(scenarioBackground);
  scenarioBackgroundRef.current = scenarioBackground;

  // Callback to update both state and ref when stats data stores change
  // This ensures workflow generation always has access to current data via ref
  const handleStatsDataStoresChange = useCallback((stores: StatsDataStore[]) => {
    setStatsDataStores(stores);
    generatingStoresRef.current = stores;
  }, []);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const handleGenerateStatsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Helpers to sync state + ref together (single source of truth pattern)
  const setStatsGenerating = useCallback((value: boolean) => {
    isStatsGeneratingRef.current = value;
    setIsStatsGenerating(value);
  }, []);

  const setStatsAttempted = useCallback((value: boolean) => {
    hasAttemptedStatsGenerationRef.current = value;
    setHasAttemptedStatsGeneration(value);
    // When resetting to false (regenerate request), also reset userExplicitlyStopped
    // This allows manual regeneration via Regenerate button
    if (!value) {
      userExplicitlyStoppedRef.current = false;
    }
  }, []);

  const selectSession = useSessionStore.use.selectSession();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  // Get default model settings for workflow generation
  const defaultLiteModel = useModelStore.use.defaultLiteModel();
  const defaultStrongModel = useModelStore.use.defaultStrongModel();

  // Get default flow (first available)
  const { data: flows } = useQuery(flowQueries.list());
  const defaultFlow = flows?.[0];

  // Session creation hook
  const { createSession, isCreating, isGenerating } = useCreateSession();

  // Track if user has made changes
  const hasUnsavedChanges =
    playerCharacter !== null ||
    aiCharacters.length > 0 ||
    draftCharacters.length > 0 ||
    scenarioBackground !== defaultScenarioTemplate ||
    scenarioFirstMessages.length > 0 ||
    scenarioLorebook.length > 0 ||
    statsDataStores.length > 0;

  // Block navigation when there are unsaved changes (but not during save/create)
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges && !isSaving && !isCreatingSession,
    withResolver: true,
    enableBeforeUnload: hasUnsavedChanges && !isSaving && !isCreatingSession,
  });

  // Leave without cleanup - draft characters are not saved to DB yet
  const handleCleanupAndLeave = useCallback(() => {
    // No cleanup needed - draft characters are held in memory only
    // They will be garbage collected when component unmounts
    proceed?.();
  }, [proceed]);

  const handleCancel = () => {
    navigate({ to: "/sessions" });
  };

  // Handle character import from file (PNG or JSON)
  // Creates DraftCharacter with source: "import" - NOT saved to DB until session creation
  const handleCharacterImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const isJSON =
        file.type === "application/json" || file.name.endsWith(".json");
      const isPNG = file.type === "image/png";

      if (!isJSON && !isPNG) {
        toastError("Invalid file type", {
          description:
            "Only PNG and JSON files are supported for character import",
        });
        return;
      }

      try {
        // Parse file to extract character data WITHOUT saving to DB
        const result = await CardService.parseCharacterFromFile.execute({
          file,
        });

        if (result.isFailure) {
          toastError("Failed to import character", {
            description: result.getError(),
          });
          return;
        }

        const parsedCharacters = result.getValue();

        if (parsedCharacters.length === 0) {
          toastError("No character found", {
            description: "The imported file does not contain a character card",
          });
          return;
        }

        // Convert parsed characters to DraftCharacter format
        const { generateTempId } = await import("./ui/create/draft-character");

        for (const parsed of parsedCharacters) {
          const draftCharacter: DraftCharacter = {
            tempId: generateTempId(),
            source: "import",
            data: {
              name: parsed.name,
              description: parsed.description,
              tags: parsed.tags,
              cardSummary: parsed.cardSummary,
              exampleDialogue: parsed.exampleDialogue,
              creator: parsed.creator,
              version: parsed.version,
              conceptualOrigin: parsed.conceptualOrigin,
              imageFile: parsed.imageFile,
              imageUrl: parsed.imageFile
                ? URL.createObjectURL(parsed.imageFile)
                : undefined,
              scenario: parsed.scenario,
              firstMessages: parsed.firstMessages,
              lorebook: parsed.lorebook,
            },
          };

          // Add to draft characters at the front of library (user can select to assign to roster)
          setDraftCharacters((prev) => [draftCharacter, ...prev]);
        }

        toastSuccess("Character imported!", {
          description: `Imported ${parsedCharacters.length} character(s)`,
        });
      } catch (error) {
        logger.error(error);
        toastError("Failed to import character", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        // Reset file input
        if (characterImportRef.current) {
          characterImportRef.current.value = "";
        }
      }
    },
    [],
  );

  // Simple template constant (only template available)
  const SIMPLE_TEMPLATE: TemplateSelectionResult = {
    templateName: "Simple",
    filename: "Simple_vf.json",
    reason: "Default template",
  };

  // Helper: Convert flow template field to StatsDataStore
  const templateFieldToStatsDataStore = useCallback(
    (field: {
      id: string;
      name: string;
      type: string;
      initialValue?: string;
    }): StatsDataStore => {
      let type: DataStoreType = "string";
      if (field.type === "integer") type = "integer";
      else if (field.type === "number") type = "number";
      else if (field.type === "boolean") type = "boolean";

      let initial: number | boolean | string = "";
      if (type === "integer") initial = parseInt(field.initialValue || "0", 10) || 0;
      else if (type === "number") initial = parseFloat(field.initialValue || "0") || 0;
      else if (type === "boolean") initial = field.initialValue === "true";
      else initial = field.initialValue || "";

      return {
        id: field.id,
        name: field.name,
        type,
        description: `From ${selectedFlowTemplate?.templateName || "template"} template`,
        initial,
        isFromTemplate: true,
      };
    },
    [selectedFlowTemplate?.templateName],
  );

  // Helper: Convert DataSchemaEntry to StatsDataStore
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

  // Generate stats data stores from scenario
  // Called when transitioning from Scenario → Cast step
  const handleGenerateStats = useCallback(async () => {
    // Skip if already generating or already attempted (refs for immediate check)
    if (isStatsGeneratingRef.current || hasAttemptedStatsGenerationRef.current) {
      return;
    }

    // Mark as started immediately to prevent duplicate calls
    setStatsAttempted(true);
    setStatsGenerating(true);

    // Cancel any previous request and create new abort controller
    statsAbortControllerRef.current?.abort();
    statsAbortControllerRef.current = new AbortController();

    // Clear existing stores
    generatingStoresRef.current = [];
    setStatsDataStores([]);

    try {
      const scenario = scenarioBackgroundRef.current;

      // Step 1: Load template
      setSelectedFlowTemplate(SIMPLE_TEMPLATE);

      const response = await fetch(`/default/flow/${SIMPLE_TEMPLATE.filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load flow template: ${SIMPLE_TEMPLATE.filename}`);
      }
      const templateJson = await response.json();

      // Extract responseTemplate
      if (templateJson.responseTemplate && typeof templateJson.responseTemplate === "string") {
        setFlowResponseTemplate(templateJson.responseTemplate);
      }

      // Step 2: Extract template fields
      const templateFields: StatsDataStore[] = [];
      if (templateJson.dataStoreSchema?.fields && Array.isArray(templateJson.dataStoreSchema.fields)) {
        for (const field of templateJson.dataStoreSchema.fields) {
          templateFields.push(templateFieldToStatsDataStore(field));
        }
      }

      if (templateFields.length > 0) {
        generatingStoresRef.current = [...templateFields];
        setStatsDataStores(generatingStoresRef.current);
        toastSuccess(`Using ${SIMPLE_TEMPLATE.templateName} template`, {
          description: `Loaded ${templateFields.length} pre-defined variables`,
        });
      }

      // Step 3: Generate AI fields (if scenario is substantial)
      const MIN_SCENARIO_LENGTH_FOR_AI_STATS = 200;
      const MAX_TOTAL_STORES = 5;
      const MAX_RETRIES = 2;
      const RETRY_DELAY_MS = 2000; // 2 seconds

      if (scenario.length >= MIN_SCENARIO_LENGTH_FOR_AI_STATS) {
        const existingStores: DataSchemaEntry[] = templateFields.map((store) => ({
          id: store.id,
          name: store.name,
          type: store.type,
          description: store.description,
          initial: store.initial,
          min: store.min,
          max: store.max,
        }));

        // Track if max limit was reached (to show different completion message)
        let maxLimitReached = false;

        // Retry logic for AI generation
        let lastError: Error | null = null;
        let retryCount = 0;

        while (retryCount <= MAX_RETRIES) {
          try {
            await generateDataSchemaAI({
              context: { scenario },
              currentStores: existingStores,
              callbacks: {
                onAddStore: (store) => {
                  if (statsAbortControllerRef.current?.signal.aborted) return;
                  if (generatingStoresRef.current.length >= MAX_TOTAL_STORES) {
                    maxLimitReached = true;
                    statsAbortControllerRef.current?.abort();
                    return;
                  }
                  generatingStoresRef.current = [
                    ...generatingStoresRef.current,
                    dataSchemaEntryToStatsDataStore(store),
                  ];
                  setStatsDataStores(generatingStoresRef.current);
                },
                onRemoveStore: () => {},
                onClearAll: () => {},
              },
              abortSignal: statsAbortControllerRef.current.signal,
            });

            // Success - break out of retry loop
            break;
          } catch (error) {
            lastError = error as Error;
            retryCount++;

            // Check if it's an abort error (user stopped) - don't retry
            if (statsAbortControllerRef.current?.signal.aborted || isUserStoppedRef.current) {
              throw error;
            }

            // If we already generated at least one field, don't retry - we got some useful data
            const generatedAnyFields = generatingStoresRef.current.length > templateFields.length;
            if (generatedAnyFields) {
              break; // Exit retry loop - we have partial success
            }

            // Check if it's a Gemini API error that should be retried
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isRetryableError = errorMessage.includes("Invalid JSON response") ||
                                     errorMessage.includes("candidates") ||
                                     errorMessage.includes("API");

            if (isRetryableError && retryCount <= MAX_RETRIES) {

              // Show user-friendly message for first retry
              if (retryCount === 1) {
                addChatMessage({
                  id: `stats-retry-${retryCount}`,
                  role: "assistant",
                  content: "Hmm, there was a glitch. Let me try that again...",
                  step: "stats",
                  isSystemGenerated: true,
                });
              }

              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retryCount));
            } else {
              // Not retryable or max retries reached
              throw error;
            }
          }
        }

        // If we exhausted all retries, throw the last error
        if (retryCount > MAX_RETRIES && lastError) {
          throw lastError;
        }

        // Completion message is now handled by stats-step.tsx when isGenerating changes to false
      }

    } catch (e) {
      const errorName = (e as Error).name;
      // Handle abort-related errors (AbortError, AI SDK errors, or user-initiated stop)
      const isAbortRelated = errorName === "AbortError" ||
        errorName === "AI_NoOutputGeneratedError" ||
        isUserStoppedRef.current;

      if (isAbortRelated) {
        // User stop or abort-related error: keep hasAttemptedGeneration=true so Regenerate button shows
        if (isUserStoppedRef.current) {
          isUserStoppedRef.current = false;
        }
        setStatsGenerating(false);
        return;
      }

      logger.error("[CreateSession] Stats generation failed", e);
      toastError("Failed to generate data schema", {
        description: e instanceof Error ? e.message : "An unknown error occurred",
      });
      // Allow retry on error
      setStatsAttempted(false);
      setStatsGenerating(false);
    } finally {
      setStatsGenerating(false);
    }
  }, [templateFieldToStatsDataStore, dataSchemaEntryToStatsDataStore, setStatsAttempted, setStatsGenerating, generatedWorkflow]);

  // Keep ref updated to latest handleGenerateStats (avoids dependency chain in handleStepChange)
  handleGenerateStatsRef.current = handleGenerateStats;

  // Stop stats generation (user-initiated)
  const handleStopStatsGeneration = useCallback(() => {
    if (statsAbortControllerRef.current) {
      isUserStoppedRef.current = true;
      // Persist across navigation - prevents auto-regeneration when going back to Scenario then forward
      userExplicitlyStoppedRef.current = true;
      statsAbortControllerRef.current.abort();
      statsAbortControllerRef.current = null;
    }
    setStatsGenerating(false);
  }, [setStatsGenerating]);

  // Centralized step change handler - handles both Next button and Stepper clicks
  // Ensures stats generation is triggered exactly once when leaving Scenario step
  const handleStepChange = useCallback(
    (targetStep: SessionStep) => {
      const currentIndex = SESSION_STEPS.findIndex((s) => s.id === currentStep);
      const targetIndex = SESSION_STEPS.findIndex((s) => s.id === targetStep);

      // Don't navigate to the same step
      if (currentStep === targetStep) return;

      // When leaving Scenario step (going forward), trigger stats generation once
      // Skip if already attempted or user explicitly stopped (they can use Regenerate button manually)
      if (
        currentStep === "scenario" &&
        targetIndex > currentIndex &&
        !hasAttemptedStatsGenerationRef.current &&
        !userExplicitlyStoppedRef.current
      ) {
        handleGenerateStatsRef.current();
      }

      setCurrentStep(targetStep);
    },
    [currentStep, addChatMessage],
  );

  const handlePrevious = useCallback(() => {
    const currentIndex = SESSION_STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      const prevStep = SESSION_STEPS[currentIndex - 1].id as SessionStep;
      handleStepChange(prevStep);
    }
  }, [currentStep, handleStepChange]);

  // Generate workflow handler (separate from session creation for testing)
  // Returns a promise that resolves when workflow is generated
  // Uses the selected template from HUD step as the initial state for AI to enhance
  const handleGenerateWorkflow =
    useCallback(async (): Promise<{ state: WorkflowState; sessionName: string } | null> => {
      // Use the selected template from HUD step, or fall back to Simple_vf.json
      const templateFilename =
        selectedFlowTemplate?.filename || "Simple_vf.json";

      setIsWorkflowGenerating(true);

      // IMPORTANT: Use ref instead of state to get current stats data stores
      // State can be stale due to closure capture in useCallback
      const currentStatsDataStores = generatingStoresRef.current;

      try {
        // Convert StatsDataStore to StatsDataStoreField for workflow context
        const dataStoreSchema: StatsDataStoreField[] = currentStatsDataStores.map(
          (store) => ({
            id: store.id,
            name: store.name,
            type: store.type,
            description: store.description,
            initial: store.initial,
            min: store.min,
            max: store.max,
          }),
        );

        const currentScenario = scenarioBackgroundRef.current;
        const workflowContext: WorkflowBuilderContext = {
          scenario: currentScenario,
          dataStoreSchema,
        };

        // Load template and build initial state
        const response = await fetch(`/default/flow/${templateFilename}`);
        if (!response.ok) {
          throw new Error(`Failed to load flow template: ${templateFilename}`);
        }
        const flowJson = await response.json();

        // Build initial state from the selected flow template
        // This preserves the entire template structure for AI to enhance
        // Mark all template nodes with isFromTemplate: true so they can't be deleted
        const initialState: WorkflowState = {
          nodes: (flowJson.nodes || []).map((node: any) => ({
            ...node,
            data: { ...node.data, isFromTemplate: true },
          })),
          edges: flowJson.edges || [],
          agents: new Map(),
          ifNodes: new Map(),
          dataStoreNodes: new Map(),
          // Use the HUD data stores (which include template fields + user additions)
          dataStoreSchema: dataStoreSchema.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            description: field.description,
            initialValue: String(field.initial),
          })),
          };

          // Convert agents from template (keyed by node ID)
          if (flowJson.agents) {
            for (const [nodeId, agentConfig] of Object.entries(flowJson.agents)) {
              const config = agentConfig as any;
              initialState.agents.set(nodeId, {
                id: nodeId,
                nodeId: nodeId,
                name: config.name || "Agent",
                description: config.description || "",
                modelTier:
                  config.modelTier === "heavy"
                    ? ModelTier.Heavy
                    : ModelTier.Light,
                promptMessages: config.promptMessages || [],
                historyEnabled: config.historyEnabled ?? true,
                historyCount: config.historyCount ?? 10,
                enabledStructuredOutput: config.enabledStructuredOutput || false,
                schemaFields: config.schemaFields || [],
              });
            }
          }

          // Extract if nodes from template nodes
          for (const node of flowJson.nodes || []) {
            if (node.type === "if" && node.data) {
              initialState.ifNodes.set(node.id, {
                id: node.id,
                nodeId: node.id,
                name: node.data.name || "Condition",
                logicOperator: node.data.logicOperator || "AND",
                conditions: node.data.conditions || [],
              });
            }
          }

          // Extract data store nodes from template nodes
          for (const node of flowJson.nodes || []) {
            if (node.type === "dataStore" && node.data) {
              initialState.dataStoreNodes.set(node.id, {
                id: node.id,
                nodeId: node.id,
                name: node.data.name || "Data Store",
                fields: node.data.dataStoreFields || [],
              });
            }
          }

        // Generate workflow using AI, starting from the template's initial state
        const workflowResult = await generateWorkflow({
          context: workflowContext,
          initialState,
          callbacks: {
            onStateChange: () => {
              // State changes are logged via console.log in service
            },
            onProgress: (progress) => {
              setWorkflowProgress(progress);
            },
          },
        });

      // Store the generated workflow and session name for use in handleFinish
      setGeneratedWorkflow(workflowResult.state);
      setGeneratedSessionName(workflowResult.sessionName);

        return {
          state: workflowResult.state,
          sessionName: workflowResult.sessionName,
        };
      } catch (workflowError) {
        logger.error("Workflow generation failed", workflowError);
        toastError("Workflow generation failed", {
          description:
            workflowError instanceof Error
              ? workflowError.message
              : "Unknown error",
        });
        return null;
      } finally {
        setIsWorkflowGenerating(false);
      }
    }, [
      selectedFlowTemplate,
      defaultLiteModel,
      defaultStrongModel,
      flowResponseTemplate,
    ]);

  const handleFinish = useCallback(async () => {
    // Set local loading state immediately (synchronous) - MUST be first!
    setIsCreatingSession(true);

    try {
      // Must have at least one character
      const allCharacters = [
        ...(playerCharacter ? [playerCharacter] : []),
        ...aiCharacters,
      ];
      if (allCharacters.length === 0) {
        toastError("No characters selected", {
          description: "Please select at least one character.",
        });
        setIsCreatingSession(false);
        return;
      }

      // Don't wait for workflow - pass promise to hook for background generation
      let workflowToUse: WorkflowState | null = generatedWorkflow;
      const workflowPromiseToUse = workflowGenerationPromiseRef.current;
      let sessionNameToUse = generatedSessionName;

      // If we still don't have a session name (e.g., no data stores = no workflow generation),
      // generate it directly from the scenario
      if (!sessionNameToUse && scenarioBackground.trim().length >= 50) {
        const { generateSessionName } = await import("@/app/services/system-agents/session-name-generator");
        sessionNameToUse = await generateSessionName(scenarioBackground);
      }

      // Use session creation hook - it will create session with default flow immediately
      // (or import Simple template if no default flow exists)
      // Then replace with AI workflow in background
      const sessionName = sessionNameToUse || "New Session";

      // Start session creation (async)
      createSession({
        sessionName,
        workflow: workflowToUse, // Already generated workflow (or null)
        workflowPromise: workflowPromiseToUse, // Promise to resolve in background (or null)
        characters: allCharacters,
        playerCharacterId: playerCharacter?.tempId,
        scenarioBackground,
        scenarioFirstMessages,
        scenarioLorebook,
        chatStyles: defaultChatStyles,
        defaultFlow,
        flowResponseTemplate,
        defaultLiteModel,
        defaultStrongModel,
        createCharacterMutation,
      }).then((result) => {
        setIsCreatingSession(false);
        if (result) {
          // Navigate back to sessions list after creation completes
          navigate({ to: "/sessions" });
        }
      }).catch((error) => {
        setIsCreatingSession(false);
        logger.error("[CreateSession] Error in createSession", error);
      });
    } catch (error) {
      // Handle any errors in the synchronous part (before createSession call)
      setIsCreatingSession(false);
      logger.error("[CreateSession] Error in handleFinish", error);
    }
  }, [
    createSession,
    playerCharacter,
    aiCharacters,
    generatedWorkflow,
    generatedSessionName,
    workflowGenerationPromiseRef,
    scenarioBackground,
    scenarioFirstMessages,
    scenarioLorebook,
    defaultFlow,
    navigate,
    defaultLiteModel,
    defaultStrongModel,
    flowResponseTemplate,
    createCharacterMutation,
  ]);

  const handleNext = () => {
    const currentIndex = SESSION_STEPS.findIndex((s) => s.id === currentStep);

    // When on last step (Stats), run workflow generation then finish
    if (currentStep === "stats") {
      // Start workflow generation when user clicks "Start Session"
      if (statsDataStores.length > 0) {
        workflowGenerationPromiseRef.current = handleGenerateWorkflow();
      }
      // handleFinish will await the workflow generation if in progress
      handleFinish();
      return;
    }

    if (currentIndex < SESSION_STEPS.length - 1) {
      const nextStep = SESSION_STEPS[currentIndex + 1].id as SessionStep;
      // Use centralized handler (triggers stats generation when leaving Scenario)
      handleStepChange(nextStep);
    }
  };

  // Minimum scenario description length required to proceed
  const MIN_SCENARIO_LENGTH = 400;

  // Step requirement validation functions
  // Returns true if the step's requirements are met
  const isStepComplete = useCallback(
    (stepId: SessionStep): boolean => {
      switch (stepId) {
        case "scenario":
          // Scenario step: requires minimum 400 characters
          return scenarioBackground.trim().length >= MIN_SCENARIO_LENGTH;
        case "cast":
          // Cast step: needs at least one character (player or AI)
          return playerCharacter !== null || aiCharacters.length > 0;
        case "stats":
          // Stats step: optional, always complete
          return true;
        default:
          return false;
      }
    },
    [scenarioBackground, playerCharacter, aiCharacters],
  );

  // Calculate which steps are accessible (all previous steps must be complete)
  // Returns the maximum step index that can be navigated to
  // Also considers generating states to sync with Next button disabled conditions
  const getAccessibleStepIndex = useCallback((): number => {
    // Block all navigation during scenario generation
    if (isScenarioGenerating) {
      return SESSION_STEPS.findIndex((s) => s.id === currentStep);
    }

    // Can access step N only if steps 0 to N-1 are all complete
    for (let i = 0; i < SESSION_STEPS.length; i++) {
      if (!isStepComplete(SESSION_STEPS[i].id)) {
        return i; // Can only access up to this step (inclusive)
      }
    }
    return SESSION_STEPS.length - 1; // All steps complete
  }, [isStepComplete, isScenarioGenerating, currentStep]);

  // Determine when Next button should be enabled based on current step
  // Step order: Scenario → Cast → Stats
  const canProceed = isStepComplete(currentStep);

  // Show Previous button only from 2nd step onwards
  const currentStepIndex = SESSION_STEPS.findIndex((s) => s.id === currentStep);
  const showPreviousButton = currentStepIndex > 0;
  const isLastStep = currentStepIndex === SESSION_STEPS.length - 1;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black">
      {/* Hidden file input for character import */}
      <input
        ref={characterImportRef}
        type="file"
        accept="image/png,.json,application/json"
        onChange={handleCharacterImport}
        className="hidden"
      />

      {/* Background Ambience */}
      <div className="from-brand-900/20 pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-black to-transparent" />

      {/* Main stepper content */}
      <>
        {/* Header */}
        <div className="bg-surface/80 relative z-30 flex flex-shrink-0 items-center justify-between px-4 py-3 backdrop-blur-md md:px-6">
          {/* Center: Title (absolute positioned to prevent layout shift) */}
          <h1 className="text-fg-default pointer-events-none absolute inset-x-0 text-center text-sm font-semibold md:text-base">
            New Session
          </h1>

          {/* Left: Cancel/Back button */}
          <div className="relative z-10 flex items-center">
            {/* Mobile: Back or X */}
            <div className="md:hidden">
              {showPreviousButton ? (
                <button
                  onClick={handlePrevious}
                  disabled={isScenarioGenerating}
                  className="text-fg-muted hover:text-fg-default flex items-center gap-1 text-sm transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="text-fg-muted hover:text-fg-default flex items-center justify-center p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {/* Desktop: Cancel */}
            <button
              onClick={handleCancel}
              className="text-fg-muted hover:text-fg-default hidden items-center gap-2 text-sm transition-colors md:flex"
            >
              <X size={18} />
              Cancel
            </button>
          </div>

          {/* Right: Next/Create button */}
          <div className="relative z-10 flex items-center gap-2">
            {/* Desktop: Previous button */}
            {showPreviousButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isScenarioGenerating}
                icon={<ChevronLeft size={16} />}
                className="hidden md:flex"
              >
                Previous
              </Button>
            )}
            {/* Next/Create button (both mobile and desktop) */}
            <Button
              size="sm"
              onClick={handleNext}
              disabled={
                !canProceed ||
                isScenarioGenerating ||
                (currentStep === "stats" && isStatsGenerating)
              }
              loading={isCreatingSession || isSaving || isWaitingForWorkflow}
            >
              <span className="md:hidden">{isLastStep ? "Create" : "Next"}</span>
              <span className="hidden md:inline">{isLastStep ? "Create Session" : "Next"}</span>
              {!isLastStep && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <SessionStepper
          currentStep={currentStep}
          onStepClick={handleStepChange}
          isStatsGenerating={isStatsGenerating}
          maxAccessibleStepIndex={getAccessibleStepIndex()}
        />

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-hidden">
          {currentStep === "cast" && (
            <CastStep
              currentStep={currentStep}
              playerCharacter={playerCharacter}
              aiCharacters={aiCharacters}
              onPlayerCharacterChange={setPlayerCharacter}
              onAiCharactersChange={setAiCharacters}
              draftCharacters={draftCharacters}
              onDraftCharactersChange={setDraftCharacters}
              onCreateCharacter={() => {
                setShowCharacterCreateDialog(true);
              }}
              onImportCharacter={() => {
                characterImportRef.current?.click();
              }}
              mobileTab={mobileCastTab}
              onMobileTabChange={setMobileCastTab}
              chatMessages={chatMessages}
              onChatMessagesChange={setChatMessages}
              addChatMessage={addChatMessage}
              onCharacterCreatedFromChat={(draftCharacter) => {
                // Add new draft character at the front of library (not directly to roster)
                setDraftCharacters((prev) => [draftCharacter, ...prev]);
              }}
              scenarioBackground={scenarioBackground}
              firstMessages={scenarioFirstMessages}
            />
          )}

          {currentStep === "scenario" && (
            <ScenarioStep
              currentStep={currentStep}
              background={scenarioBackground}
              onBackgroundChange={setScenarioBackground}
              firstMessages={scenarioFirstMessages}
              onFirstMessagesChange={setScenarioFirstMessages}
              lorebook={scenarioLorebook}
              onLorebookChange={setScenarioLorebook}
              chatMessages={chatMessages}
              onChatMessagesChange={setChatMessages}
              playerCharacter={
                playerCharacter
                  ? {
                      name: getDraftCharacterName(playerCharacter),
                      description: (
                        playerCharacter.data?.description || ""
                      ).substring(0, 500),
                    }
                  : undefined
              }
              aiCharacters={aiCharacters.map((char) => ({
                name: getDraftCharacterName(char),
                description: (char.data?.description || "").substring(0, 500),
              }))}
              isGenerating={isScenarioGenerating}
              onIsGeneratingChange={setIsScenarioGenerating}
              mobileTab={mobileScenarioTab}
              onMobileTabChange={setMobileScenarioTab}
            />
          )}

          {currentStep === "stats" && (
            <div className="h-full overflow-hidden">
              <StatsStep
                currentStep={currentStep}
                dataStores={statsDataStores}
                onDataStoresChange={handleStatsDataStoresChange}
                sessionContext={{
                  scenario: scenarioBackground,
                  character: playerCharacter
                    ? getDraftCharacterName(playerCharacter)
                    : undefined,
                  cast: aiCharacters.map((c) => getDraftCharacterName(c)),
                  firstMessages: scenarioFirstMessages.map((m) => ({
                    title: m.title,
                    content: m.content,
                  })),
                  lorebook: scenarioLorebook.map((l) => ({
                    title: l.title,
                    keys: l.keys,
                    desc: l.desc,
                  })),
                }}
                isGenerating={isStatsGenerating}
                onIsGeneratingChange={setIsStatsGenerating}
                hasAttemptedGeneration={hasAttemptedStatsGeneration}
                onHasAttemptedGenerationChange={setStatsAttempted}
                onStopGeneration={handleStopStatsGeneration}
                onRegenerate={handleGenerateStats}
                selectedTemplate={selectedFlowTemplate}
                onSelectedTemplateChange={setSelectedFlowTemplate}
                onResponseTemplateChange={setFlowResponseTemplate}
                chatMessages={chatMessages}
                onChatMessagesChange={setChatMessages}
                mobileTab={mobileHudTab}
                onMobileTabChange={setMobileHudTab}
              />
            </div>
          )}
        </div>

      </>

      {/* Navigation Confirmation Dialog */}
      {status === "blocked" && (
        <DialogConfirm
          open={true}
          onOpenChange={(open) => {
            if (!open) reset();
          }}
          title="You've got unsaved changes!"
          description="Are you sure you want to leave? Your changes will be lost."
          cancelLabel="Go back"
          confirmLabel="Yes, leave"
          confirmVariant="destructive"
          onConfirm={handleCleanupAndLeave}
        />
      )}

      {/* Character Create Dialog - deferred mode, creates DraftCharacter */}
      <CharacterCreateDialog
        open={showCharacterCreateDialog}
        onOpenChange={setShowCharacterCreateDialog}
        deferCreation={true}
        onPendingCharacterCreated={(pendingData) => {
          // Convert PendingCharacterData to DraftCharacter
          const draftCharacter: DraftCharacter = {
            tempId: pendingData.id,
            source: "chat", // Treat manually created characters same as chat-created
            data: {
              name: pendingData.name,
              description: pendingData.description,
              tags: pendingData.tags,
              cardSummary: pendingData.cardSummary,
              imageFile: pendingData.imageFile,
              imageUrl: pendingData.previewImageUrl,
              lorebook: pendingData.lorebookEntries,
            },
          };
          // Add to draft characters at the front of library (user can select to assign to roster)
          setDraftCharacters((prev) => [draftCharacter, ...prev]);
        }}
      />

      {/* Workflow Generation Waiting Dialog - only shown when user tries to create session */}
      <Dialog.Root open={isWaitingForWorkflow}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="border-border-default bg-surface fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-brand-500/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Loader2 size={24} className="text-brand-400 animate-spin" />
              </div>
              <Dialog.Title className="text-fg-default text-lg font-semibold">
                Generating Workflow
              </Dialog.Title>
              <Dialog.Description className="text-fg-muted text-center text-sm">
                Please wait while we finish building your workflow...
              </Dialog.Description>

              {/* Progress Steps */}
              <div className="w-full space-y-2 rounded-lg bg-black/20 p-3">
                {/* Phase indicator */}
                <div className="flex items-center gap-2">
                  {workflowProgress?.phase === "initializing" && (
                    <>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                      <span className="text-xs text-yellow-400">Initializing...</span>
                    </>
                  )}
                  {workflowProgress?.phase === "building" && (
                    <>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
                      <span className="text-xs text-brand-400">Building workflow...</span>
                    </>
                  )}
                  {workflowProgress?.phase === "validating" && (
                    <>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                      <span className="text-xs text-blue-400">Validating...</span>
                    </>
                  )}
                  {workflowProgress?.phase === "fixing" && (
                    <>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                      <span className="text-xs text-orange-400">Fixing issues...</span>
                    </>
                  )}
                  {workflowProgress?.phase === "complete" && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="text-xs text-green-400">Complete!</span>
                    </>
                  )}
                  {!workflowProgress && (
                    <>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-fg-subtle" />
                      <span className="text-xs text-fg-subtle">Preparing...</span>
                    </>
                  )}
                </div>

                {/* Current action message */}
                {workflowProgress?.message && (
                  <div className="flex items-center gap-2 text-fg-muted">
                    <Sparkles size={12} className="text-brand-400 flex-shrink-0" />
                    <span className="text-xs truncate">{workflowProgress.message}</span>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
