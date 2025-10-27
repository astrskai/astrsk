import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CharacterImageStep } from "@/features/asset/ui/create-character/image-step";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";

type CharacterStep = "image" | "info" | "lorebook";

/**
 * Create Character Card Page
 * Multi-step wizard for creating a new character card
 *
 * Steps:
 * 1. Character Image - Upload or select character image (Required)
 * 2. Character Info - Name, personality, description (Required)
 * 3. Character Lorebook - Additional lore and details (Optional)
 */
export function CreateCharacterPage() {
  const navigate = useNavigate();
  const [characterName, setCharacterName] = useState("New Character");
  const [currentStep, setCurrentStep] = useState<CharacterStep>("image");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [avatarAssetId, setAvatarAssetId] = useState<string | undefined>();

  const steps: StepConfig<CharacterStep>[] = [
    { id: "image", number: 1, label: "Character Image", required: true },
    { id: "info", number: 2, label: "Character Info", required: true },
    { id: "lorebook", number: 3, label: "Character Lorebook", required: false },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const showPreviousButton = currentStepIndex > 0;

  const handleFileUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      // Step 1: Create asset from uploaded file
      const assetResult = await AssetService.saveFileToAsset.execute({ file });

      if (assetResult.isSuccess) {
        const asset = assetResult.getValue();
        setAvatarAssetId(asset.id.toString());

        // Step 2: Save to generated images gallery
        const generatedImageResult =
          await GeneratedImageService.saveGeneratedImageFromAsset.execute({
            assetId: asset.id,
            name: file.name.replace(/\.[^/.]+$/, ""),
            prompt: `Character avatar for ${characterName}`,
            style: "uploaded",
            associatedCardId: undefined, // Will be associated when card is created
          });

        if (!generatedImageResult.isSuccess) {
          console.error(
            "Failed to add image to gallery:",
            generatedImageResult.getError(),
          );
        }
      } else {
        console.error("Failed to upload file:", assetResult.getError());
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      // TODO: Create character card with all collected data
      console.log("Creating character card:", {
        characterName,
        avatarAssetId,
      });
      navigate({ to: "/assets" });
    } else {
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleCancelClick = () => {
    // TODO: Show confirmation dialog if changes exist
    navigate({ to: "/assets" });
  };

  // Validation: Step 1 requires name and image
  const canProceed =
    currentStep === "image"
      ? characterName.trim().length > 0 && avatarAssetId !== undefined
      : true;

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
            Create Character
          </span>
          <h1 className="text-text-primary text-lg font-semibold">
            {characterName}
          </h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="border-border hidden items-center justify-between border-b px-8 py-6 md:flex">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancelClick}
            className="text-text-primary hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-text-primary text-2xl font-semibold">
              Create Character Card
            </h1>
            <p className="text-text-secondary text-sm">{characterName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showPreviousButton && (
            <Button variant="secondary" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Content */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-4 pb-24 md:p-8 md:pb-8">
          {/* Step 1: Character Image */}
          {currentStep === "image" && (
            <CharacterImageStep
              characterName={characterName}
              onCharacterNameChange={setCharacterName}
              avatarAssetId={avatarAssetId}
              isUploading={isUploadingImage}
              onFileUpload={handleFileUpload}
            />
          )}

          {/* Step 2: Character Info */}
          {currentStep === "info" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  2. Character Info
                </h2>
                <p className="text-text-secondary text-sm">
                  Enter the personality and description for your character.
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 2 content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Character Lorebook */}
          {currentStep === "lorebook" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  3. Character Lorebook
                </h2>
                <p className="text-text-secondary text-sm">
                  Add additional lore and details for your character (optional).
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 3 content will be implemented here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="border-border fixed bottom-0 left-0 right-0 border-t bg-background-surface-1 p-4 md:hidden">
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
