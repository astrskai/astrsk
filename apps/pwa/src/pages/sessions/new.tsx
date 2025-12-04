import { useState, useCallback, useRef } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { Users, Globe, Database, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  CastStep,
  ScenarioStep,
  HudStep,
  CharacterCreateDialog,
  type FirstMessage,
  type LorebookEntry,
  type HudDataStore,
  type ChatMessage,
} from "./ui/create";
import { logger, cn } from "@/shared/lib";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType, Lorebook, Entry } from "@/entities/card/domain";
import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { useAppStore } from "@/shared/stores/app-store";
import { useModelStore } from "@/shared/stores/model-store";
import { SessionService } from "@/app/services/session-service";
import { CardService } from "@/app/services/card-service";
import { FlowService } from "@/app/services/flow-service";
import { cardQueries } from "@/entities/card/api/card-queries";
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
  type HudDataStoreField,
  type WorkflowState,
  ModelTier,
} from "@/app/services/system-agents/workflow-builder";
import type { TemplateSelectionResult } from "./ui/create/hud-step";
import { Sparkles, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

type Step = "scenario" | "hud" | "cast";

const STEPS: { id: Step; label: string; number: number; icon: typeof Users }[] = [
  { id: "scenario", label: "Scenario", number: 1, icon: Globe },
  { id: "hud", label: "HUD", number: 2, icon: Database },
  { id: "cast", label: "Cast", number: 3, icon: Users },
];

/**
 * New Stepper Component
 * Full-width sticky bar style stepper matching hud_create design
 */
function Stepper({
  currentStep,
  onStepClick,
}: {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}) {
  return (
    <div className="relative z-20 hidden w-full justify-center border-b border-border-default bg-canvas py-4 shadow-xl md:flex">
      <div className="flex items-center gap-2 overflow-x-auto px-4 md:gap-8">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
          const isCompleted = index < currentIndex;
          const isClickable = isCompleted; // Only completed steps are clickable
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex min-w-max items-center gap-3">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && !isActive && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                    isActive &&
                      "border-brand-500 bg-brand-500/10 text-brand-400 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.3)]",
                    isCompleted &&
                      "border-border-default bg-surface-overlay text-fg-muted",
                    !isActive &&
                      !isCompleted &&
                      "border-border-subtle bg-surface text-fg-subtle",
                  )}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={cn(
                    "text-xs font-bold",
                    isActive && "text-fg-default",
                    isCompleted && "text-fg-muted",
                    !isActive && !isCompleted && "text-fg-subtle",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index !== STEPS.length - 1 && (
                <div className="h-[1px] w-8 bg-border-default" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


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

  const [currentStep, setCurrentStep] = useState<Step>("scenario");

  // Mobile cast tab state (lifted from CastStep for navigation control)
  const [mobileCastTab, setMobileCastTab] = useState<"library" | "cast">("library");

  // Character create dialog state
  const [showCharacterCreateDialog, setShowCharacterCreateDialog] = useState(false);

  // Character import file input ref
  const characterImportRef = useRef<HTMLInputElement>(null);

  // Cast state - existing characters from library
  const [playerCharacter, setPlayerCharacter] = useState<CharacterCard | null>(
    null,
  );
  const [aiCharacters, setAiCharacters] = useState<CharacterCard[]>([]);

  // Track characters created/imported during this session (for cleanup on cancel)
  const [createdCharacterIds, setCreatedCharacterIds] = useState<string[]>([]);


  // Scenario state
  const defaultScenarioTemplate = `Scene:
Location:
Time Period:
Ground Rules:`;
  const [scenarioBackground, setScenarioBackground] = useState(defaultScenarioTemplate);
  const [scenarioFirstMessages, setScenarioFirstMessages] = useState<
    FirstMessage[]
  >([]);
  const [scenarioLorebook, setScenarioLorebook] = useState<LorebookEntry[]>([]);
  const [scenarioChatMessages, setScenarioChatMessages] = useState<ChatMessage[]>([]);
  const [isScenarioGenerating, setIsScenarioGenerating] = useState(false);

  // HUD state
  const [hudDataStores, setHudDataStores] = useState<HudDataStore[]>([]);
  const [isHudGenerating, setIsHudGenerating] = useState(false);
  // Selected flow template from HUD step (determined by AI based on scenario)
  const [selectedFlowTemplate, setSelectedFlowTemplate] = useState<TemplateSelectionResult | null>(null);
  // Response template from selected flow template (for final output formatting)
  const [flowResponseTemplate, setFlowResponseTemplate] = useState<string>("");

  // Workflow generation state
  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowState | null>(null);
  const [isWorkflowGenerating, setIsWorkflowGenerating] = useState(false);
  const workflowGenerationPromiseRef = useRef<Promise<WorkflowState | null> | null>(null);
  // Show waiting dialog only when user tries to create session and workflow is still generating
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);

  const selectSession = useSessionStore.use.selectSession();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Get default model settings for workflow generation
  const defaultLiteModel = useModelStore.use.defaultLiteModel();
  const defaultStrongModel = useModelStore.use.defaultStrongModel();

  // Confirmation dialog for missing player character
  const [showNoPlayerCharacterDialog, setShowNoPlayerCharacterDialog] = useState(false);
  const isSkipPlayerCharacterConfirm = useAppStore.use.isSkipPlayerCharacterConfirm();
  const setIsSkipPlayerCharacterConfirm = useAppStore.use.setIsSkipPlayerCharacterConfirm();
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);

  // Get default flow (first available)
  const { data: flows } = useQuery(flowQueries.list());
  const defaultFlow = flows?.[0];

  // Track if user has made changes (including created characters)
  const hasUnsavedChanges =
    playerCharacter !== null ||
    aiCharacters.length > 0 ||
    scenarioBackground !== defaultScenarioTemplate ||
    hudDataStores.length > 0 ||
    createdCharacterIds.length > 0;

  // Block navigation when there are unsaved changes (but not during save)
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges && !isSaving,
    withResolver: true,
    enableBeforeUnload: hasUnsavedChanges && !isSaving,
  });

  // Cleanup created characters when leaving
  const handleCleanupAndLeave = useCallback(() => {
    // Delete characters in the background, don't wait
    if (createdCharacterIds.length > 0) {
      // Fire and forget - delete all characters created during this session
      Promise.all(
        createdCharacterIds.map((cardId) =>
          CardService.deleteCard.execute(new UniqueEntityID(cardId)).catch((error) => {
            logger.error("Failed to delete character", cardId, error);
          })
        )
      ).then(() => {
        // Refresh character list after deletion
        queryClient.invalidateQueries({
          queryKey: cardQueries.lists(),
        });
      });
    }
    // Proceed immediately - don't wait for cleanup
    proceed?.();
  }, [createdCharacterIds, proceed]);

  const handleCancel = () => {
    navigate({ to: "/sessions" });
  };

  // Handle character import from file (PNG or JSON)
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
          description: "Only PNG and JSON files are supported for character import",
        });
        return;
      }

      try {
        const result = await CardService.importCardFromFile.execute({ file });

        if (result.isFailure) {
          toastError("Failed to import character", {
            description: result.getError(),
          });
          return;
        }

        const importedCards = result.getValue();

        // Filter for character cards only
        const characterCards = importedCards.filter(
          (card) => card.props.type === CardType.Character,
        );

        if (characterCards.length === 0) {
          toastError("No character found", {
            description: "The imported file does not contain a character card",
          });
          return;
        }

        // Track imported character IDs for cleanup on cancel
        const importedIds = characterCards.map((card) => card.id.toString());
        setCreatedCharacterIds((prev) => [...prev, ...importedIds]);

        // Refresh character list (invalidate card queries used by CastStep)
        await queryClient.invalidateQueries({
          queryKey: cardQueries.lists(),
        });

        toastSuccess("Character imported!", {
          description: `Imported ${characterCards.length} character(s)`,
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

  const handlePrevious = () => {
    // On mobile, in cast step, if on roster tab -> go back to library tab first
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile && currentStep === "cast" && mobileCastTab === "cast") {
      setMobileCastTab("library");
      return;
    }

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
      // Reset mobile tab to roster when going back (so Previous from Scenario goes to Roster)
      if (isMobile) {
        setMobileCastTab("cast");
      }
    }
  };

  // Generate workflow handler (separate from session creation for testing)
  // Returns a promise that resolves when workflow is generated
  // Now uses the selected template from HUD step as the initial state for AI to enhance
  const handleGenerateWorkflow = useCallback(async (): Promise<WorkflowState | null> => {
    // Use the selected template from HUD step, or fall back to Simple_vf.json
    const templateFilename = selectedFlowTemplate?.filename || "Simple_vf.json";

    setIsWorkflowGenerating(true);
    logger.info("[CreateSession] Starting workflow generation...", {
      template: templateFilename,
      dataStoreCount: hudDataStores.length,
    });

    try {
      // Load the selected flow template JSON
      const response = await fetch(`/default/flow/${templateFilename}`);
      if (!response.ok) {
        throw new Error(`Failed to load flow template: ${templateFilename}`);
      }
      const flowJson = await response.json();

      // Convert HudDataStore to HudDataStoreField for workflow context
      const dataStoreSchema: HudDataStoreField[] = hudDataStores.map((store) => ({
        id: store.id,
        name: store.name,
        type: store.type,
        description: store.description,
        initial: store.initial,
        min: store.min,
        max: store.max,
      }));

      const workflowContext: WorkflowBuilderContext = {
        scenario: scenarioBackground,
        dataStoreSchema,
      };

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
            modelTier: config.modelTier === "heavy" ? ModelTier.Heavy : ModelTier.Light,
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

      logger.info("[CreateSession] Initial state from template", {
        template: selectedFlowTemplate?.templateName || "Simple",
        nodeCount: initialState.nodes.length,
        edgeCount: initialState.edges.length,
        agentCount: initialState.agents.size,
        ifNodeCount: initialState.ifNodes.size,
        dataStoreNodeCount: initialState.dataStoreNodes.size,
      });

      // Generate workflow using AI, starting from the template's initial state
      const workflowResult = await generateWorkflow({
        context: workflowContext,
        initialState,
        callbacks: {
          onStateChange: () => {
            // State changes are logged via console.log in service
          },
          onProgress: (progress) => {
            logger.info("[CreateSession] Workflow progress", progress);
          },
        },
      });

      logger.info("[CreateSession] Workflow generated", {
        template: selectedFlowTemplate?.templateName || "Simple",
        nodeCount: workflowResult.state.nodes.length,
        edgeCount: workflowResult.state.edges.length,
        agentCount: workflowResult.state.agents.size,
      });

      // Store the generated workflow for use in handleFinish
      setGeneratedWorkflow(workflowResult.state);

      toastSuccess("Workflow generated!", {
        description: `Enhanced ${selectedFlowTemplate?.templateName || "Simple"} template with ${workflowResult.state.agents.size} agents`,
      });

      console.log("[CreateSession] Generated workflow state:", workflowResult.state);

      return workflowResult.state;
    } catch (workflowError) {
      logger.error("Workflow generation failed", workflowError);
      toastError("Workflow generation failed", {
        description: workflowError instanceof Error ? workflowError.message : "Unknown error",
      });
      return null;
    } finally {
      setIsWorkflowGenerating(false);
    }
  }, [hudDataStores, scenarioBackground, selectedFlowTemplate]);

  const handleFinish = useCallback(async () => {
    // Must have at least one character
    const allCharacters = [
      ...(playerCharacter ? [playerCharacter] : []),
      ...aiCharacters,
    ];
    if (allCharacters.length === 0) {
      toastError("No characters selected", {
        description: "Please select at least one character.",
      });
      return;
    }

    // Wait for workflow generation if still in progress
    let workflowToUse = generatedWorkflow;
    if (isWorkflowGenerating && workflowGenerationPromiseRef.current) {
      setIsWaitingForWorkflow(true);
      workflowToUse = await workflowGenerationPromiseRef.current;
      setIsWaitingForWorkflow(false);
    }

    // Need either generated workflow or default flow
    if (!workflowToUse && !defaultFlow) {
      toastError("No flow available", {
        description: "Please generate a workflow or create a flow first.",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Generate session name
      const sessionName =
        playerCharacter?.props.name ||
        aiCharacters[0]?.props.name ||
        "New Session";

      // Step 1: Create session FIRST (without resources) to satisfy foreign key constraints
      // Resources with session_id require the session to exist first
      // Mark as play session so it appears in the sidebar
      const sessionOrError = Session.create({
        title: sessionName,
        flowId: undefined, // Will be set after cloning flow
        allCards: [], // Will be populated after cloning cards
        userCharacterCardId: undefined, // Will be set after cloning player character
        turnIds: [],
        autoReply: AutoReply.Random,
        chatStyles: defaultChatStyles,
        isPlaySession: true, // Play sessions appear in sidebar
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (sessionOrError.isFailure) {
        logger.error("Failed to create session", sessionOrError.getError());
        toastError("Failed to create session", {
          description: "Could not initialize session.",
        });
        setIsSaving(false);
        return;
      }

      const session = sessionOrError.getValue();
      const sessionId = session.id;

      // Save the empty session first (so foreign keys will work)
      const initialSaveResult = await SessionService.saveSession.execute({
        session,
      });

      if (initialSaveResult.isFailure) {
        logger.error("Failed to save initial session", initialSaveResult.getError());
        toastError("Failed to create session", {
          description: "Could not save session.",
        });
        setIsSaving(false);
        return;
      }

      // Step 2: Create or clone the flow with sessionId
      let clonedFlow;

      if (workflowToUse) {
        // Use the AI-generated workflow
        const flowData = workflowStateToFlowData(
          workflowToUse,
          "Session Workflow",
          {
            liteModel: defaultLiteModel,
            strongModel: defaultStrongModel,
          },
          flowResponseTemplate, // Pass responseTemplate from the selected flow template
        );
        const importResult = await FlowService.importFlowWithNodes.importFromJson(
          flowData,
          sessionId,
        );

        if (importResult.isFailure) {
          logger.error("Failed to import generated workflow", importResult.getError());
          toastError("Failed to create session", {
            description: "Could not import generated workflow.",
          });
          setIsSaving(false);
          return;
        }

        clonedFlow = importResult.getValue();
        logger.info("[CreateSession] Imported generated workflow", {
          flowId: clonedFlow.id.toString(),
          nodeCount: clonedFlow.props.nodes.length,
        });
      } else {
        // Fall back to cloning the default flow
        const clonedFlowResult = await FlowService.cloneFlow.execute({
          flowId: defaultFlow!.id,
          sessionId: sessionId,
          shouldRename: false, // Don't rename for session-local copy
        });

        if (clonedFlowResult.isFailure) {
          logger.error("Failed to clone flow", clonedFlowResult.getError());
          toastError("Failed to create session", {
            description: "Could not copy workflow for session.",
          });
          setIsSaving(false);
          return;
        }

        clonedFlow = clonedFlowResult.getValue();
      }

      // Step 3: Clone all character cards with sessionId
      const allCards: CardListItem[] = [];
      let clonedPlayerCharacterId: UniqueEntityID | undefined;

      for (const card of allCharacters) {
        const clonedCardResult = await CardService.cloneCard.execute({
          cardId: card.id,
          sessionId: sessionId,
        });

        if (clonedCardResult.isFailure) {
          logger.error("Failed to clone character card", clonedCardResult.getError());
          toastError("Failed to create session", {
            description: `Could not copy character "${card.props.name}" for session.`,
          });
          setIsSaving(false);
          return;
        }

        const clonedCard = clonedCardResult.getValue();

        // Track the cloned player character ID
        if (playerCharacter && card.id.equals(playerCharacter.id)) {
          clonedPlayerCharacterId = clonedCard.id;
        }

        allCards.push({
          id: clonedCard.id,
          type: CardType.Character,
          enabled: true,
        });
      }

      // Step 4: Create scenario card with sessionId if there's any scenario data
      const hasScenarioData =
        scenarioBackground.trim() !== "" ||
        scenarioFirstMessages.length > 0 ||
        scenarioLorebook.length > 0;

      if (hasScenarioData) {
        // Convert lorebook entries to domain Entry objects
        // LorebookEntry type: { id, title, keys (string), desc, range, expanded }
        const lorebookEntries = scenarioLorebook.map((entry) =>
          Entry.create({
            id: new UniqueEntityID(entry.id),
            name: entry.title,
            enabled: true,
            keys: entry.keys.split(",").map((k) => k.trim()).filter(Boolean),
            recallRange: entry.range,
            content: entry.desc,
          }).getValue(),
        );

        // Create lorebook
        const lorebookResult = Lorebook.create({ entries: lorebookEntries });
        const lorebook = lorebookResult.isSuccess
          ? lorebookResult.getValue()
          : undefined;

        // Convert first messages to the expected format
        // FirstMessage type: { id, title, content, expanded }
        const firstMessages = scenarioFirstMessages.map((msg) => ({
          name: msg.title,
          description: msg.content,
        }));

        // Create scenario card with sessionId (session-local)
        const scenarioCardResult = ScenarioCard.create({
          title: `Scenario - ${sessionName}`,
          name: `Scenario - ${sessionName}`,
          type: CardType.Scenario,
          description: scenarioBackground,
          firstMessages: firstMessages.length > 0 ? firstMessages : undefined,
          lorebook,
          sessionId: sessionId, // Session-local resource
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (scenarioCardResult.isFailure) {
          logger.error("Failed to create scenario card", scenarioCardResult.getError());
          toastError("Failed to create scenario", {
            description: scenarioCardResult.getError(),
          });
          setIsSaving(false);
          return;
        }

        const scenarioCard = scenarioCardResult.getValue();

        // Save the scenario card
        const savedCardResult = await CardService.saveCard.execute(scenarioCard);

        if (savedCardResult.isFailure) {
          logger.error("Failed to save scenario card", savedCardResult.getError());
          toastError("Failed to save scenario", {
            description: savedCardResult.getError(),
          });
          setIsSaving(false);
          return;
        }

        const savedScenarioCard = savedCardResult.getValue() as ScenarioCard;

        // Add scenario card to allCards
        allCards.push({
          id: savedScenarioCard.id,
          type: CardType.Scenario,
          enabled: true,
        });
      }

      // Step 5: Update session with cloned resources
      session.update({
        flowId: clonedFlow.id,
        allCards,
        userCharacterCardId: clonedPlayerCharacterId,
      });

      // Save the updated session
      const savedSessionOrError = await SessionService.saveSession.execute({
        session,
      });

      if (savedSessionOrError.isFailure) {
        logger.error("Failed to save session", savedSessionOrError.getError());
        setIsSaving(false);
        return;
      }

      const savedSession = savedSessionOrError.getValue();

      // Update session store and invalidate queries
      selectSession(savedSession.id, savedSession.title);
      queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

      // Navigate to session
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: savedSession.id.toString() },
      });
    } catch (error) {
      logger.error("Error creating session", error);
      setIsSaving(false);
    }
  }, [
    defaultFlow,
    generatedWorkflow,
    isWorkflowGenerating,
    playerCharacter,
    aiCharacters,
    scenarioBackground,
    scenarioFirstMessages,
    scenarioLorebook,
    selectSession,
    navigate,
    defaultLiteModel,
    defaultStrongModel,
    flowResponseTemplate,
  ]);

  const handleNext = () => {
    // On mobile, in cast step, if on library tab -> go to roster tab first
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile && currentStep === "cast" && mobileCastTab === "library") {
      setMobileCastTab("cast");
      return;
    }

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    // When leaving HUD step, start workflow generation in background
    if (currentStep === "hud" && hudDataStores.length > 0 && !generatedWorkflow && !isWorkflowGenerating) {
      // Start workflow generation (don't await - runs in background)
      const promise = handleGenerateWorkflow();
      workflowGenerationPromiseRef.current = promise;
    }

    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
      // Reset mobile tab to library when moving to a new step
      if (isMobile) {
        setMobileCastTab("library");
      }
    } else {
      // Last step (cast) - check if player character is missing
      if (!playerCharacter && !isSkipPlayerCharacterConfirm) {
        setShowNoPlayerCharacterDialog(true);
        return;
      }
      // Finish and create session
      handleFinish();
    }
  };

  // Minimum scenario description length required to proceed
  const MIN_SCENARIO_LENGTH = 400;

  // Determine when Next button should be enabled based on current step
  const canProceed = (() => {
    if (currentStep === "scenario") {
      // Scenario step: requires minimum 400 characters
      return scenarioBackground.trim().length >= MIN_SCENARIO_LENGTH;
    }

    if (currentStep === "hud") {
      // HUD step is optional
      return true;
    }

    // Cast step: needs at least one character (player or AI)
    // If no player character, user will be prompted with confirmation dialog
    return playerCharacter !== null || aiCharacters.length > 0;
  })();

  // Show Previous button only from 2nd step onwards
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const showPreviousButton = currentStepIndex > 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-black to-transparent" />

      {/* Main stepper content */}
      <>
        {/* Header */}
          <div className="relative z-30 flex flex-shrink-0 items-center justify-between border-b border-border-subtle bg-surface/80 px-4 py-3 backdrop-blur-md md:px-6">
            <button
              onClick={handleCancel}
              className="hidden items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg-default md:flex"
            >
              <X size={18} />
              Cancel
            </button>

            {/* Mobile: Empty space for layout balance */}
            <div className="w-7 md:hidden" />

            {/* Desktop: New Session title */}
            <h1 className="hidden text-base font-semibold text-fg-default md:block">
              New Session
            </h1>

            {/* Mobile: Step title with number */}
            <div className="flex flex-col items-center md:hidden">
              <span className="text-xs font-medium text-fg-muted">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <h1 className="text-sm font-semibold text-fg-default">
                {STEPS.find((s) => s.id === currentStep)?.label}
              </h1>
            </div>

            {/* Desktop: Previous + Next buttons */}
            <div className="hidden items-center gap-2 md:flex">
              {showPreviousButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isScenarioGenerating || isHudGenerating}
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canProceed || isScenarioGenerating || isHudGenerating}
                loading={isSaving || isWaitingForWorkflow}
              >
                {isLastStep ? "Create Session" : "Next"}
                {!isLastStep && <ChevronRight size={16} />}
              </Button>
            </div>

            {/* Mobile: X button to exit */}
            <button
              onClick={handleCancel}
              className="flex items-center justify-center p-1 text-fg-muted transition-colors hover:text-fg-default md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper */}
          <Stepper currentStep={currentStep} onStepClick={setCurrentStep} />

          {/* Content */}
          <div className="relative z-10 mb-16 flex-1 overflow-hidden md:mb-0">
            {currentStep === "cast" && (
              <CastStep
                playerCharacter={playerCharacter}
                aiCharacters={aiCharacters}
                onPlayerCharacterChange={setPlayerCharacter}
                onAiCharactersChange={setAiCharacters}
                onCreateCharacter={() => {
                  setShowCharacterCreateDialog(true);
                }}
                onImportCharacter={() => {
                  characterImportRef.current?.click();
                }}
                mobileTab={mobileCastTab}
                onMobileTabChange={setMobileCastTab}
              />
            )}

            {currentStep === "scenario" && (
              <ScenarioStep
                background={scenarioBackground}
                onBackgroundChange={setScenarioBackground}
                firstMessages={scenarioFirstMessages}
                onFirstMessagesChange={setScenarioFirstMessages}
                lorebook={scenarioLorebook}
                onLorebookChange={setScenarioLorebook}
                chatMessages={scenarioChatMessages}
                onChatMessagesChange={setScenarioChatMessages}
                playerCharacter={
                  playerCharacter
                    ? {
                        name: playerCharacter.props.name || "Unknown",
                        description: (playerCharacter.props.description || "").substring(0, 500),
                      }
                    : undefined
                }
                aiCharacters={aiCharacters.map((char) => ({
                  name: char.props.name || "Unknown",
                  description: (char.props.description || "").substring(0, 500),
                }))}
                isGenerating={isScenarioGenerating}
                onIsGeneratingChange={setIsScenarioGenerating}
              />
            )}

            {currentStep === "hud" && (
              <div className="h-full overflow-hidden">
                <HudStep
                  dataStores={hudDataStores}
                  onDataStoresChange={setHudDataStores}
                  sessionContext={{
                    scenario: scenarioBackground,
                    character: playerCharacter?.props.name || undefined,
                    cast: aiCharacters.map((c) => c.props.name || "Unknown"),
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
                  isGenerating={isHudGenerating}
                  onIsGeneratingChange={setIsHudGenerating}
                  selectedTemplate={selectedFlowTemplate}
                  onSelectedTemplateChange={setSelectedFlowTemplate}
                  onResponseTemplateChange={setFlowResponseTemplate}
                />
              </div>
            )}
          </div>

          {/* Mobile Floating Buttons */}
          <div className="absolute right-0 bottom-0 left-0 z-20 border-t border-border-subtle bg-surface/95 p-3 backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between gap-3">
              {/* Show Previous if: on 2nd+ step OR on Cast step with Roster tab */}
              {showPreviousButton || (currentStep === "cast" && mobileCastTab === "cast") ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isScenarioGenerating || isHudGenerating}
                  className="flex-1"
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
              ) : (
                <div className="flex-1" />
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed || isScenarioGenerating || isHudGenerating}
                loading={isSaving || isWaitingForWorkflow}
                className="flex-1"
              >
                {isLastStep ? "Create" : "Next"}
                {!isLastStep && <ChevronRight size={16} />}
              </Button>
            </div>
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

      {/* Character Create Dialog - saves to global library, tracks ID for cleanup */}
      <CharacterCreateDialog
        open={showCharacterCreateDialog}
        onOpenChange={setShowCharacterCreateDialog}
        onCharacterCreated={(character) => {
          // Track created character ID for cleanup on cancel
          setCreatedCharacterIds((prev) => [...prev, character.id.toString()]);
        }}
      />

      {/* Workflow Generation Waiting Dialog - only shown when user tries to create session */}
      <Dialog.Root open={isWaitingForWorkflow}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                <Loader2 size={24} className="animate-spin text-brand-400" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-fg-default">
                Generating Workflow
              </Dialog.Title>
              <Dialog.Description className="text-center text-sm text-fg-muted">
                Please wait while we finish building your workflow...
              </Dialog.Description>
              <div className="flex items-center gap-2 text-xs text-fg-subtle">
                <Sparkles size={14} className="text-brand-400" />
                <span>AI is building your workflow...</span>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* No Player Character Confirmation Dialog */}
      <Dialog.Root open={showNoPlayerCharacterDialog} onOpenChange={setShowNoPlayerCharacterDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface p-6 shadow-xl">
            <div className="flex flex-col gap-4">
              <Dialog.Title className="text-lg font-semibold text-fg-default">
                No Player Character Selected
              </Dialog.Title>
              <Dialog.Description className="text-sm text-fg-muted">
                You haven't selected a player character. Do you want to continue without one?
              </Dialog.Description>

              {/* Don't show again checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgainChecked}
                  onChange={(e) => setDontShowAgainChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-border-default bg-surface text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-fg-muted">Don't show this again</span>
              </label>

              <div className="flex gap-3 justify-end mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNoPlayerCharacterDialog(false);
                    setDontShowAgainChecked(false);
                  }}
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => {
                    if (dontShowAgainChecked) {
                      setIsSkipPlayerCharacterConfirm(true);
                    }
                    setShowNoPlayerCharacterDialog(false);
                    setDontShowAgainChecked(false);
                    handleFinish();
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
