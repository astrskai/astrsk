import { useState, useEffect } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CreatePageHeader } from "@/widgets/create-page-header";
import {
  ScenarioBasicInfoStep,
  ScenarioDescriptionStep,
  ScenarioLorebookStep,
  ScenarioFirstMessagesStep,
  type FirstMessage,
} from "./ui/create";
import type { LorebookEntry } from "@/shared/ui/panels";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { CardService } from "@/app/services/card-service";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "@/entities/card/api";
import { toast } from "sonner";
import { DialogConfirm } from "@/shared/ui/dialogs";

type ScenarioStep = "basic-info" | "info" | "first-messages" | "lorebook";

/**
 * Create Scenario Card Page
 * Multi-step wizard for creating a new scenario card
 *
 * Steps:
 * 1. Basic Info - Scenario name and image (Name required, image optional)
 * 2. Info - Description (Required)
 * 3. First Messages - Initial first messages and story setup (Optional)
 * 4. Lorebook - World-building and lore entries (Optional)
 */
export default function CreateScenarioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scenarioName, setScenarioName] = useState<string>("New Scenario");
  const [currentStep, setCurrentStep] = useState<ScenarioStep>("basic-info");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageDimensions, setImageDimensions] = useState<
    { width: number; height: number } | undefined
  >();
  const [description, setDescription] = useState<string>("");
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([]);
  const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([]);

  const [isCreatingCard, setIsCreatingCard] = useState<boolean>(false);

  // Track if user has made changes
  const hasUnsavedChanges =
    scenarioName !== "New Scenario" ||
    !!imageFile ||
    description.trim().length > 0 ||
    firstMessages.length > 0 ||
    lorebookEntries.length > 0;

  // Block navigation when there are unsaved changes (but not during save)
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges && !isCreatingCard,
    withResolver: true,
    enableBeforeUnload: hasUnsavedChanges && !isCreatingCard,
  });

  const STEPS: StepConfig<ScenarioStep>[] = [
    { id: "basic-info", number: 1, label: "Basic Info", required: true },
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
            prompt: `Scenario image for ${scenarioName}`,
            style: "uploaded",
            associatedCardId: undefined, // Will be associated when card is created
          });
        } else {
          toast.error("Failed to upload file", {
            description: assetResult.getError(),
          });
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

      // Step 3: Transform scenarios to the format ScenarioCard expects
      const firstMessagesData = firstMessages.map((firstMessage) => ({
        name: firstMessage.name,
        description: firstMessage.description,
      }));

      // Step 4: Create scenario card (new format)
      const cardResult = ScenarioCard.create({
        title: scenarioName,
        name: scenarioName, // ScenarioCard requires name field
        description: description,
        firstMessages: firstMessagesData.length > 0 ? firstMessagesData : undefined,
        iconAssetId: uploadedAssetId
          ? new UniqueEntityID(uploadedAssetId)
          : undefined,
        type: CardType.Scenario,
        tags: [],
        lorebook: lorebook,
      });

      if (cardResult.isFailure) {
        toast.error("Failed to create card", {
          description: cardResult.getError(),
        });
        setIsCreatingCard(false);
        return;
      }

      const card = cardResult.getValue();

      // Step 5: Save card to database
      const saveResult = await CardService.saveCard.execute(card);

      if (saveResult.isFailure) {
        toast.error("Failed to save card", {
          description: saveResult.getError(),
        });
        setIsCreatingCard(false);
        return;
      }

      // Step 6: Invalidate queries to refresh card list
      await queryClient.invalidateQueries({
        queryKey: cardKeys.lists(),
      });

      // Navigate to scenario list (no unsaved changes after successful save)
      navigate({ to: "/assets/scenarios" });
    } catch (error) {
      toast.error("Error creating scenario card", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsCreatingCard(false);
    }
  };

  // Validation logic for each step
  const canProceed = (() => {
    switch (currentStep) {
      case "basic-info":
        // Image step requires only name (image is optional)
        return !!scenarioName.trim();
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

  // Cleanup blob URL on unmount or when imageUrl changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <CreatePageHeader
        category="Scenario"
        itemName={scenarioName}
        onCancel={handleCancel}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showPreviousButton={showPreviousButton}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={isCreatingCard}
        showCancelButton={true}
        currentStepLabel={currentStepLabel}
      />

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div className="mb-13 flex-1 overflow-y-auto md:mb-0">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === "basic-info" && (
            <ScenarioBasicInfoStep
              scenarioName={scenarioName}
              onScenarioNameChange={setScenarioName}
              imageUrl={imageUrl}
              imageDimensions={imageDimensions}
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
            disabled={!canProceed || isCreatingCard}
            className="flex-1"
          >
            {isCreatingCard ? "Creating..." : isLastStep ? "Finish" : "Next"}
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
