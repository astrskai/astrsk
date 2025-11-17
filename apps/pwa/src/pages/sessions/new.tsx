import { useState, useCallback, useEffect } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms";
import { CreatePageHeader } from "@/widgets/create-page-header";
import {
  BasicInfoStep,
  FlowSelectionStep,
  AiCharacterSelectionStep,
  UserCharacterSelectionStep,
  ScenarioSelectionStep,
} from "./ui/create";
import { StepIndicator } from "@/shared/ui/step-indicator";
import { logger } from "@/shared/lib";
import { Flow } from "@/entities/flow/domain/flow";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType } from "@/entities/card/domain";
import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { SessionService } from "@/app/services/session-service";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { queryClient } from "@/shared/api/query-client";
import { TableName } from "@/db/schema/table-name";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { DialogConfirm } from "@/shared/ui/dialogs";

type Step =
  | "basic-info"
  | "flow"
  | "ai-character"
  | "user-character"
  | "scenario";

const STEPS: { id: Step; label: string; number: number; required: boolean }[] =
  [
    { id: "basic-info", label: "Basic Info", number: 1, required: true },
    { id: "flow", label: "Flow", number: 2, required: true },
    { id: "ai-character", label: "AI Character", number: 3, required: true },
    {
      id: "user-character",
      label: "User Character",
      number: 4,
      required: false,
    },
    { id: "scenario", label: "Scenario", number: 5, required: false },
  ];

/**
 * Create Session Page
 * Multi-step wizard for creating a new session
 *
 * Steps:
 * 1. Basic Info - Session name and background image (Name required, image optional)
 * 2. Flow - Select flow and agents
 * 3. AI Character - Select AI character cards
 * 4. User Character - Select user character card
 * 5. Scenario - Select scenario card
 */
export function CreateSessionPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("basic-info");

  // Basic Info state
  const [sessionName, setSessionName] = useState("New Session");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageDimensions, setImageDimensions] = useState<
    { width: number; height: number } | undefined
  >();

  // Selection state (simplified - each step component handles its own UI state)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterCard[]>(
    [],
  );
  const [selectedUserCharacter, setSelectedUserCharacter] =
    useState<CharacterCard | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<
    PlotCard | ScenarioCard | null
  >(null);

  const selectSession = useSessionStore.use.selectSession();

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Track if user has made changes
  const hasUnsavedChanges =
    sessionName !== "New Session" ||
    !!imageFile ||
    !!selectedFlow ||
    selectedCharacters.length > 0;

  // Block navigation when there are unsaved changes (but not during save)
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges && !isSaving,
    withResolver: true,
    enableBeforeUnload: hasUnsavedChanges && !isSaving,
  });

  // Cleanup blob URL on unmount or when imageUrl changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const getImageDimensions = (
    file: File,
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      img.src = objectUrl;
    });
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      setImageFile(undefined);
      setImageUrl(undefined);
      setImageDimensions(undefined);
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    // Store the file for preview - actual upload happens on save
    setImageFile(file);

    // Create a temporary object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);

    // Get image dimensions
    try {
      const dimensions = await getImageDimensions(file);
      setImageDimensions(dimensions);
    } catch (error) {
      toast.info("Failed to get image dimensions", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setImageDimensions(undefined);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/sessions" });
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleFinish = useCallback(async () => {
    if (!selectedFlow) {
      logger.error("Flow is required");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Upload image if exists
      let uploadedCoverId: string | undefined;
      if (imageFile) {
        const assetResult = await AssetService.saveFileToAsset.execute({
          file: imageFile,
        });

        if (assetResult.isSuccess) {
          const asset = assetResult.getValue();
          uploadedCoverId = asset.id.toString();

          // Save to generated images gallery
          await GeneratedImageService.saveGeneratedImageFromAsset.execute({
            assetId: asset.id,
            name: imageFile.name.replace(/\.[^/.]+$/, ""),
            prompt: `Session cover image for ${sessionName}`,
            style: "uploaded",
            associatedCardId: undefined,
          });
        } else {
          toast.error("Failed to upload cover image", {
            description: "Please try again or continue without an image.",
          });
          logger.error("Failed to upload file:", assetResult.getError());
          setIsSaving(false);
          return;
        }
      }

      // Step 2: Build allCards array from all selected cards
      const allCards: CardListItem[] = [];

      // Add AI character cards
      for (const card of selectedCharacters) {
        allCards.push({
          id: card.id,
          type: CardType.Character,
          enabled: true,
        });
      }

      // Add user character card if selected
      if (selectedUserCharacter) {
        allCards.push({
          id: selectedUserCharacter.id,
          type: CardType.Character,
          enabled: true,
        });
      }

      // Add scenario card if selected (PlotCard or ScenarioCard)
      if (selectedScenario) {
        allCards.push({
          id: selectedScenario.id,
          type: selectedScenario.props.type, // Use actual card type (Plot or Scenario)
          enabled: true,
        });
      }

      // Step 3: Create session
      const sessionOrError = Session.create({
        title: sessionName,
        flowId: selectedFlow.id,
        allCards,
        userCharacterCardId: selectedUserCharacter?.id,
        coverId: uploadedCoverId
          ? new UniqueEntityID(uploadedCoverId)
          : undefined,
        turnIds: [],
        autoReply: AutoReply.Off,
        chatStyles: defaultChatStyles,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (sessionOrError.isFailure) {
        logger.error("Failed to create session", sessionOrError.getError());
        setIsSaving(false);
        return;
      }

      const session = sessionOrError.getValue();

      // Save session
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

      // Navigate to session (no unsaved changes after successful save)
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: savedSession.id.toString() },
      });
    } catch (error) {
      logger.error("Error creating session", error);
      setIsSaving(false);
    }
  }, [
    sessionName,
    imageFile,
    selectedFlow,
    selectedCharacters,
    selectedUserCharacter,
    selectedScenario,
    selectSession,
    navigate,
  ]);

  const handleNext = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    } else {
      // Last step - finish and create session
      handleFinish();
    }
  };

  // Determine when Next button should be enabled based on current step
  const canProceed =
    currentStep === "basic-info"
      ? !!sessionName.trim()
      : currentStep === "flow"
        ? selectedFlow !== null
        : currentStep === "ai-character"
          ? selectedCharacters.length > 0
          : true; // user-character and plot are optional

  // Show Previous button only from 2nd step onwards
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const showPreviousButton = currentStepIndex > 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const currentStepConfig = STEPS[currentStepIndex];
  const currentStepLabel = currentStepConfig
    ? `Step ${currentStepConfig.number} : ${currentStepConfig.label}`
    : undefined;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <CreatePageHeader
        category="Session"
        itemName={sessionName}
        onCancel={handleCancel}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showPreviousButton={showPreviousButton}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={false}
        showCancelButton={true}
        currentStepLabel={currentStepLabel}
      />

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div className="mb-13 flex-1 overflow-y-auto md:mb-0">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          {currentStep === "basic-info" && (
            <BasicInfoStep
              sessionName={sessionName}
              onSessionNameChange={setSessionName}
              imageUrl={imageUrl}
              imageDimensions={imageDimensions}
              onFileUpload={handleFileUpload}
            />
          )}

          {currentStep === "flow" && (
            <FlowSelectionStep
              selectedFlow={selectedFlow}
              onFlowSelected={setSelectedFlow}
            />
          )}

          {currentStep === "ai-character" && (
            <AiCharacterSelectionStep
              selectedCharacters={selectedCharacters}
              selectedUserCharacter={selectedUserCharacter}
              onCharactersSelected={setSelectedCharacters}
            />
          )}

          {currentStep === "user-character" && (
            <UserCharacterSelectionStep
              selectedUserCharacter={selectedUserCharacter}
              selectedAiCharacterIds={selectedCharacters.map((c) =>
                c.id.toString(),
              )}
              onUserCharacterSelected={setSelectedUserCharacter}
            />
          )}

          {currentStep === "scenario" && (
            <ScenarioSelectionStep
              selectedScenario={selectedScenario}
              onScenarioSelected={setSelectedScenario}
            />
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="absolute right-0 bottom-0 left-0 p-2 md:hidden">
        <div className="flex items-center justify-between gap-3">
          {showPreviousButton ? (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              Previous
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1"
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>

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
          onConfirm={proceed}
        />
      )}
    </div>
  );
}
