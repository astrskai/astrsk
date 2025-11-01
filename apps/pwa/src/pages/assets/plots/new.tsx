import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CreatePageHeader } from "@/widgets/create-page-header";
import { cn } from "@/shared/lib";
import {
  PlotImageStep,
  PlotInfoStep,
  PlotLorebookStep,
  PlotScenarioStep,
  type LorebookEntry,
  type Scenario,
} from "./ui/create";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { CardService } from "@/app/services/card-service";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { CardType } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "@/app/queries/card";

type PlotStep = "image" | "info" | "lorebook" | "scenario";

// Mobile floating button height constant (56px = h-14)
const MOBILE_FLOATING_HEIGHT = 14; // Tailwind spacing units (14 * 4px = 56px)

/**
 * Create Plot Card Page
 * Multi-step wizard for creating a new plot card
 *
 * Steps:
 * 1. Image - Upload or select plot image
 * 2. Info - Basic information (name, title, description)
 * 3. Lorebook - World-building and lore entries
 * 4. Scenario - Initial scenario and story setup
 */
export function CreatePlotPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [plotName, setPlotName] = useState("New Plot");
  const [currentStep, setCurrentStep] = useState<PlotStep>("image");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageAssetId, setImageAssetId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const STEPS: StepConfig<PlotStep>[] = [
    { id: "image", number: 1, label: "Image", required: true },
    { id: "info", number: 2, label: "Info", required: true },
    { id: "lorebook", number: 3, label: "Lorebook", required: false },
    { id: "scenario", number: 4, label: "Scenario", required: false },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const showPreviousButton = currentStepIndex > 0;

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleCancel = () => {
    navigate({ to: "/assets/plots" });
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
      const scenariosData = scenarios.map((scenario) => ({
        name: scenario.name,
        description: scenario.description,
      }));

      // Step 4: Create plot card
      const cardResult = PlotCard.create({
        title: plotName,
        description: description,
        scenarios: scenariosData.length > 0 ? scenariosData : undefined,
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
      navigate({ to: "/assets/plots" });
    } catch (error) {
      console.error("Error creating plot card:", error);
      setIsCreatingCard(false);
    }
  };

  // Validation logic for each step
  const canProceed = (() => {
    switch (currentStep) {
      case "image":
        // Image step requires both name and image
        return !!plotName.trim() && !!imageAssetId;
      case "info":
        // Info step requires description
        return !!description.trim();
      case "lorebook":
        // Lorebook is optional
        return true;
      case "scenario":
        // Scenario is optional
        return true;
      default:
        return false;
    }
  })();

  return (
    <div className="bg-background-surface-2 relative flex h-full w-full flex-col">
      <CreatePageHeader
        category="Plot"
        itemName={plotName}
        onCancel={handleCancel}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showPreviousButton={showPreviousButton}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={isCreatingCard}
      />

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div
        className={cn(
          "flex flex-1 overflow-y-auto md:mb-0",
          `mb-${MOBILE_FLOATING_HEIGHT}`,
        )}
      >
        <div className="mx-auto w-full max-w-5xl p-8 pb-24 md:pb-8">
          {/* Step 1: Image */}
          {currentStep === "image" && (
            <PlotImageStep
              plotName={plotName}
              onPlotNameChange={setPlotName}
              imageAssetId={imageAssetId}
              onFileUpload={handleFileUpload}
            />
          )}

          {/* Step 2: Info */}
          {currentStep === "info" && (
            <PlotInfoStep
              description={description}
              onDescriptionChange={setDescription}
            />
          )}

          {/* Step 3: Lorebook */}
          {currentStep === "lorebook" && (
            <PlotLorebookStep
              entries={lorebookEntries}
              onEntriesChange={setLorebookEntries}
            />
          )}

          {/* Step 4: Scenario */}
          {currentStep === "scenario" && (
            <PlotScenarioStep
              scenarios={scenarios}
              onScenariosChange={setScenarios}
            />
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div
        className={cn(
          "border-border bg-background-surface-1 fixed right-0 bottom-0 left-0 flex flex-col justify-center border-t p-2 md:hidden",
          `h-${MOBILE_FLOATING_HEIGHT}`,
        )}
      >
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
