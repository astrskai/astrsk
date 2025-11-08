import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CreatePageHeader } from "@/widgets/create-page-header";
import {
  CharacterBasicInfoStep,
  CharacterDescriptionStep,
  CharacterLorebookStep,
} from "./ui/create";
import type { LorebookEntry } from "@/shared/ui/panels";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { CardService } from "@/app/services/card-service";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "@/entities/card/api";
import { toast } from "sonner";

type CharacterStep = "basic-info" | "info" | "lorebook";

/**
 * Create Character Card Page
 * Multi-step wizard for creating a new character card
 *
 * Steps:
 * 1. Basic Info - Character name and image (Name required, image optional)
 * 2. Character Description - Personality, description (Required)
 * 3. Character Lorebook - Additional lore and details (Optional)
 */
export function CreateCharacterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<CharacterStep>("basic-info");
  const [characterName, setCharacterName] = useState<string>("New Character");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageDimensions, setImageDimensions] = useState<
    { width: number; height: number } | undefined
  >();
  const [description, setDescription] = useState<string>("");
  const [exampleDialogue, setExampleDialogue] = useState<string>("");
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([]);

  const [isCreatingCard, setIsCreatingCard] = useState<boolean>(false);

  const STEPS: StepConfig<CharacterStep>[] = [
    { id: "basic-info", number: 1, label: "Basic Info", required: true },
    { id: "info", number: 2, label: "Character Description", required: true },
    { id: "lorebook", number: 3, label: "Lorebook", required: false },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const showPreviousButton = currentStepIndex > 0;
  const currentStepConfig = STEPS[currentStepIndex];
  const currentStepLabel = currentStepConfig
    ? `Step ${currentStepConfig.number} : ${currentStepConfig.label}`
    : undefined;

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
            const generatedImageResult =
              await GeneratedImageService.saveGeneratedImageFromAsset.execute({
                assetId: asset.id,
                name: imageFile.name.replace(/\.[^/.]+$/, ""),
                prompt: `Character avatar for ${characterName}`,
                style: "uploaded",
                associatedCardId: undefined, // Will be associated when card is created
              });

            if (!generatedImageResult.isSuccess) {
              toast.error("Failed to add image to gallery", {
                description: generatedImageResult.getError(),
              });
            }
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

          const lorebookResult = Lorebook.create({
            entries,
          });

          if (lorebookResult.isSuccess) {
            lorebook = lorebookResult.getValue();
          }
        }

        // Step 3: Create character card
        const cardResult = CharacterCard.create({
          title: characterName,
          name: characterName,
          description: description,
          exampleDialogue: exampleDialogue || undefined,
          iconAssetId: uploadedAssetId
            ? new UniqueEntityID(uploadedAssetId)
            : undefined,
          type: CardType.Character,
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

        // Step 4: Save card to database
        const saveResult = await CardService.saveCard.execute(card);

        if (saveResult.isFailure) {
          toast.error("Failed to save card", {
            description: saveResult.getError(),
          });
          setIsCreatingCard(false);
          return;
        }

        // Step 5: Invalidate queries to refresh card list
        await queryClient.invalidateQueries({
          queryKey: cardKeys.lists(),
        });

        // Step 6: Navigate to characters list page
        navigate({ to: "/assets/characters" });
      } catch (error) {
        toast.error("Failed to create character card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setIsCreatingCard(false);
      }
    } else {
      const nextStep = STEPS[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleCancel = () => {
    navigate({ to: "/assets/characters" });
  };

  // Validation logic for each step
  const canProceed = (() => {
    switch (currentStep) {
      case "basic-info":
        return characterName.trim().length > 0; // Image is optional
      case "info":
        return description.trim().length > 0;
      case "lorebook":
        return true; // Optional step
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
        category="Character"
        itemName={characterName}
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
          {/* Step 1: Character Basic Info */}
          {currentStep === "basic-info" && (
            <CharacterBasicInfoStep
              characterName={characterName}
              onCharacterNameChange={setCharacterName}
              imageUrl={imageUrl}
              imageDimensions={imageDimensions}
              onFileUpload={handleFileUpload}
            />
          )}

          {/* Step 2: Character Description */}
          {currentStep === "info" && (
            <CharacterDescriptionStep
              description={description}
              onDescriptionChange={setDescription}
              exampleDialogue={exampleDialogue}
              onExampleDialogueChange={setExampleDialogue}
            />
          )}

          {/* Step 3: Character Lorebook */}
          {currentStep === "lorebook" && (
            <CharacterLorebookStep
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
    </div>
  );
}
