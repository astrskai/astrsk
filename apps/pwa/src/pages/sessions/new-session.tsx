import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Route } from "@/routes/_layout/sessions/new";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import {
  FlowSelectionStep,
  AiCharacterSelectionStep,
  UserCharacterSelectionStep,
  PlotSelectionStep,
} from "@/features/session/ui/create-session";
import { StepIndicator } from "@/shared/ui/step-indicator";
import { logger } from "@/shared/lib";
import { Flow } from "@/entities/flow/domain/flow";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { Session, CardListItem } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";
import { SessionService } from "@/app/services/session-service";
import { queryClient } from "@/app/queries/query-client";
import { TableName } from "@/db/schema/table-name";

type Step = "flow" | "ai-character" | "user-character" | "plot";

const STEPS: { id: Step; label: string; number: number; required: boolean }[] =
  [
    { id: "flow", label: "Flow", number: 1, required: true },
    { id: "ai-character", label: "AI Character", number: 2, required: true },
    {
      id: "user-character",
      label: "User Character",
      number: 3,
      required: false,
    },
    { id: "plot", label: "Plot", number: 4, required: false },
  ];

/**
 * Create Session Page
 * Multi-step wizard for creating a new session
 *
 * Steps:
 * 1. Flow - Select flow and agents
 * 2. AI Character - Select AI character cards
 * 3. User Character - Select user character card
 * 4. Plot - Select plot card
 */
export function CreateSessionPage() {
  const navigate = useNavigate();
  const { sessionName } = Route.useSearch();
  const [currentStep, setCurrentStep] = useState<Step>("flow");

  // Selection state (simplified - each step component handles its own UI state)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterCard[]>(
    [],
  );
  const [selectedUserCharacter, setSelectedUserCharacter] =
    useState<CharacterCard | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<CharacterCard | null>(null);

  const [isOpenCancelDialog, setIsOpenCancelDialog] = useState<boolean>(false);

  const selectSession = useSessionStore.use.selectSession();

  const handleCancelClick = () => {
    setIsOpenCancelDialog(true);
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
      // Build allCards array from all selected cards
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

      // Create session
      const sessionOrError = Session.create({
        title: sessionName,
        flowId: selectedFlow.id,
        allCards,
        userCharacterCardId: selectedUserCharacter?.id,
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
    currentStep === "flow"
      ? selectedFlow !== null
      : currentStep === "ai-character"
        ? selectedCharacters.length > 0
        : true; // user-character and plot are optional

  // Show Previous button only from 2nd step onwards
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const showPreviousButton = currentStepIndex > 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  return (
    <div className="bg-background-surface-2 relative flex h-full w-full flex-col">
      {/* Mobile Header */}
      <div className="border-border flex items-center border-b px-4 py-4 md:hidden">
        <button
          onClick={handleCancelClick}
          className="text-text-primary hover:text-text-secondary mr-3 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
          <span className="text-text-secondary text-xs font-medium">
            Create Session
          </span>
          <h1 className="text-text-primary text-lg font-semibold">
            {sessionName}
          </h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="border-border hidden items-center justify-between border-b px-8 py-6 md:flex">
        {/* Title with Session Name */}
        <h1 className="flex items-center gap-2 text-2xl">
          <span className="text-text-secondary font-medium">
            Create Session
          </span>
          <span>&nbsp;</span>
          <span className="text-text-primary font-semibold">{sessionName}</span>
        </h1>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleCancelClick}>
            Cancel
          </Button>
          {showPreviousButton && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ActionConfirm
        open={isOpenCancelDialog}
        onOpenChange={setIsOpenCancelDialog}
        title="You've got unsaved changes!"
        description="Are you sure you want to close?"
        cancelLabel="Go back"
        confirmLabel="Close without saving"
        confirmVariant="destructive"
        onConfirm={() => navigate({ to: "/sessions" })}
      />

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-8 pb-24 md:pb-8">
          {currentStep === "flow" && (
            <FlowSelectionStep
              selectedFlow={selectedFlow}
              onFlowSelected={setSelectedFlow}
            />
          )}

          {currentStep === "ai-character" && (
            <AiCharacterSelectionStep
              selectedCharacters={selectedCharacters}
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

          {currentStep === "plot" && (
            <PlotSelectionStep
              selectedPlot={selectedPlot}
              onPlotSelected={setSelectedPlot}
            />
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="border-border bg-background-surface-1 fixed right-0 bottom-0 left-0 border-t p-4 md:hidden">
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
