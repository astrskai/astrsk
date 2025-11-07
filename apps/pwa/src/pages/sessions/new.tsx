import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";
import { CreatePageHeader } from "@/widgets/create-page-header";
import {
  BasicInfoStep,
  FlowSelectionStep,
  AiCharacterSelectionStep,
  UserCharacterSelectionStep,
  PlotSelectionStep,
} from "./ui/create";
import { StepIndicator } from "@/shared/ui/step-indicator";
import { logger } from "@/shared/lib";
import { Flow } from "@/entities/flow/domain/flow";
import { CharacterCard } from "@/entities/card/domain/character-card";
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

type Step = "basic-info" | "flow" | "ai-character" | "user-character" | "scenario";

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
  // const [imageFile, setImageFile] = useState<File | undefined>();
  // const [imageAssetId, setImageAssetId] = useState<string | undefined>();

  // Selection state (simplified - each step component handles its own UI state)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterCard[]>(
    [],
  );
  const [selectedUserCharacter, setSelectedUserCharacter] =
    useState<CharacterCard | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<CharacterCard | null>(null);

  const selectSession = useSessionStore.use.selectSession();

  // const handleFileUpload = (file: File) => {
  //   // Store the file for preview - actual upload happens on save
  //   setImageFile(file);

  //   // Create a temporary object URL for preview
  //   const objectUrl = URL.createObjectURL(file);
  //   setImageAssetId(objectUrl);
  // };

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

    try {
      // // Step 1: Upload image if exists
      // let uploadedAssetId: string | undefined;
      // if (imageFile) {
      //   const assetResult = await AssetService.saveFileToAsset.execute({
      //     file: imageFile,
      //   });

      //   if (assetResult.isSuccess) {
      //     const asset = assetResult.getValue();
      //     uploadedAssetId = asset.id.toString();

      //     // Save to generated images gallery
      //     await GeneratedImageService.saveGeneratedImageFromAsset.execute({
      //       assetId: asset.id,
      //       name: imageFile.name.replace(/\.[^/.]+$/, ""),
      //       prompt: `Session cover image for ${sessionName}`,
      //       style: "uploaded",
      //       associatedCardId: undefined,
      //     });
      //   } else {
      //     logger.error("Failed to upload file:", assetResult.getError());
      //     return;
      //   }
      // }

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

      // Add plot card if selected
      if (selectedPlot) {
        allCards.push({
          id: selectedPlot.id,
          type: CardType.Plot,
          enabled: true,
        });
      }

      // Step 3: Create session
      const sessionOrError = Session.create({
        title: sessionName,
        flowId: selectedFlow.id,
        allCards,
        userCharacterCardId: selectedUserCharacter?.id,
        // backgroundId: uploadedAssetId
        //   ? new UniqueEntityID(uploadedAssetId)
        //   : undefined,
        turnIds: [],
        autoReply: AutoReply.Off,
        chatStyles: defaultChatStyles,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (sessionOrError.isFailure) {
        logger.error("Failed to create session", sessionOrError.getError());
        return;
      }

      const session = sessionOrError.getValue();

      // Save session
      const savedSessionOrError = await SessionService.saveSession.execute({
        session,
      });

      if (savedSessionOrError.isFailure) {
        logger.error("Failed to save session", savedSessionOrError.getError());
        return;
      }

      const savedSession = savedSessionOrError.getValue();

      // Update session store and invalidate queries
      selectSession(savedSession.id, savedSession.title);
      queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

      // Navigate to the created session
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: savedSession.id.toString() },
      });
    } catch (error) {
      logger.error("Error creating session", error);
    }
  }, [
    sessionName,
    // imageFile,
    selectedFlow,
    selectedCharacters,
    selectedUserCharacter,
    selectedPlot,
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
      <div className="mb-13 flex flex-1 overflow-y-auto md:mb-0">
        <div className="mx-auto w-full max-w-7xl p-8">
          {currentStep === "basic-info" && (
            <BasicInfoStep
              sessionName={sessionName}
              onSessionNameChange={setSessionName}
              // imageAssetId={imageAssetId}
              // onFileUpload={handleFileUpload}
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
            <PlotSelectionStep
              selectedPlot={selectedPlot}
              onPlotSelected={setSelectedPlot}
            />
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="absolute right-0 bottom-0 left-0 bg-gray-900 p-2 md:hidden">
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
    </div>
  );
}
