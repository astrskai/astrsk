import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CreatePageHeader } from "@/widgets/create-page-header";
import {
  ScenarioImageStep,
  ScenarioDescriptionStep,
  ScenarioLorebookStep,
  ScenarioFirstMessagesStep,
  type FirstMessage,
} from "./ui/create";
import type { LorebookEntry } from "@/shared/ui/panels";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { CardService } from "@/app/services/card-service";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { CardType } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "@/entities/card/api";

type ScenarioStep = "image" | "info" | "first-messages" | "lorebook";

/**
 * Create Plot Card Page
 * Multi-step wizard for creating a new scenario card
 *
 * Steps:
 * 1. Basic Info - Scenario name and image (Name required, image optional)
 * 2. Info - Description (Required)
 * 3. First Messages - Initial first messages and story setup (Optional)
 * 4. Lorebook - World-building and lore entries (Optional)
 */
export function CreatePlotPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [plotName, setPlotName] = useState("New Scenario");
  const [currentStep, setCurrentStep] = useState<ScenarioStep>("image");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageAssetId, setImageAssetId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([]);
  const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([]);

  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const STEPS: StepConfig<ScenarioStep>[] = [
    { id: "image", number: 1, label: "Basic Info", required: true },
    { id: "info", number: 2, label: "Description", required: true },
    {
      id: "first-messages",
      number: 3,
      label: "First Messages",
      required: false,
    },
    { id: "lorebook", number: 4, label: "Lorebook", required: false },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const showPreviousButton = currentStepIndex > 0;
  const currentStepConfig = STEPS[currentStepIndex];
  const currentStepLabel = currentStepConfig
    ? `Step ${currentStepConfig.number} : ${currentStepConfig.label}`
    : undefined;

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleCancel = () => {
    navigate({ to: "/assets/scenarios" });
  };

  const handleFileUpload = (file: File) => {
    // Store the file for preview - actual upload happens on save
    setImageFile(file);

    // Create a temporary object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageAssetId(objectUrl);
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleFinish();
    } else {
      const nextStep = STEPS[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handleFinish = async () => {
    setIsCreatingCard(true);
    try {
      // Step 1: Upload image if exists
      let uploadedAssetId: string | undefined;
      if (imageFile) {
        const assetResult = await AssetService.saveFileToAsset.execute({
          file: imageFile,
        });

        if (assetResult.isSuccess) {
          const asset = assetResult.getValue();
          uploadedAssetId = asset.id.toString();

          // Save to generated images gallery
          await GeneratedImageService.saveGeneratedImageFromAsset.execute({
            assetId: asset.id,
            name: imageFile.name.replace(/\.[^/.]+$/, ""),
            prompt: `Plot image for ${plotName}`,
            style: "uploaded",
            associatedCardId: undefined, // Will be associated when card is created
          });
        } else {
          console.error("Failed to upload file:", assetResult.getError());
          setIsCreatingCard(false);
          return;
        }
      }

      // Step 2: Create lorebook if entries exist
      let lorebook: Lorebook | undefined;
      if (lorebookEntries.length > 0) {
        const entries = lorebookEntries.map((entry) =>
          Entry.create({
            name: entry.name,
            content: entry.description,
            keys: entry.tags,
            enabled: true,
            recallRange: entry.recallRange,
          }).getValue(),
        );

        const lorebookResult = Lorebook.create({ entries });
        if (lorebookResult.isSuccess) {
          lorebook = lorebookResult.getValue();
        }
      }

      // Step 3: Transform scenarios to the format PlotCard expects
      const firstMessagesData = firstMessages.map((firstMessage) => ({
        name: firstMessage.name,
        description: firstMessage.description,
      }));

      // Step 4: Create plot card
      const cardResult = PlotCard.create({
        title: plotName,
        description: description,
        scenarios: firstMessagesData.length > 0 ? firstMessagesData : undefined,
        iconAssetId: uploadedAssetId
          ? new UniqueEntityID(uploadedAssetId)
          : undefined,
        type: CardType.Plot,
        tags: [],
        lorebook: lorebook,
      });

      if (cardResult.isFailure) {
        console.error("Failed to create card:", cardResult.getError());
        setIsCreatingCard(false);
        return;
      }

      const card = cardResult.getValue();

      // Step 5: Save card to database
      const saveResult = await CardService.saveCard.execute(card);

      if (saveResult.isFailure) {
        console.error("Failed to save card:", saveResult.getError());
        setIsCreatingCard(false);
        return;
      }

      // Step 6: Invalidate queries to refresh card list
      await queryClient.invalidateQueries({
        queryKey: cardKeys.lists(),
      });

      // Step 7: Navigate to plots list page
      navigate({ to: "/assets/scenarios" });
    } catch (error) {
      console.error("Error creating plot card:", error);
      setIsCreatingCard(false);
    }
  };

  // Validation logic for each step
  const canProceed = (() => {
    switch (currentStep) {
      case "image":
        // Image step requires only name (image is optional)
        return !!plotName.trim();
      case "info":
        // Info step requires description
        return !!description.trim();
      case "first-messages":
        // First messages is optional
        return true;
      case "lorebook":
        // Lorebook is optional
        return true;
      default:
        return false;
    }
  })();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <CreatePageHeader
        category="Scenario"
        itemName={plotName}
        onCancel={handleCancel}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showPreviousButton={showPreviousButton}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={isCreatingCard}
        currentStepLabel={currentStepLabel}
      />

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div className="mb-13 flex flex-1 overflow-y-auto md:mb-0">
        <div className="mx-auto w-full max-w-7xl p-8">
          {/* Step 1: Image */}
          {currentStep === "image" && (
            <ScenarioImageStep
              scenarioName={plotName}
              onScenarioNameChange={setPlotName}
              imageAssetId={imageAssetId}
              onFileUpload={handleFileUpload}
            />
          )}

          {/* Step 2: Description */}
          {currentStep === "info" && (
            <ScenarioDescriptionStep
              description={description}
              onDescriptionChange={setDescription}
            />
          )}

          {/* Step 3: First Messages */}
          {currentStep === "first-messages" && (
            <ScenarioFirstMessagesStep
              firstMessages={firstMessages}
              onFirstMessagesChange={setFirstMessages}
            />
          )}

          {/* Step 4: Lorebook */}
          {currentStep === "lorebook" && (
            <ScenarioLorebookStep
              entries={lorebookEntries}
              onEntriesChange={setLorebookEntries}
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
            disabled={!canProceed || isCreatingCard}
            className="flex-1"
          >
            {isCreatingCard ? "Creating..." : isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
