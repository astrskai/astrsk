import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { CharacterImageStep } from "@/features/asset/ui/create-character/image-step";
import { CharacterInfoStep } from "@/features/asset/ui/create-character/info-step";
import {
  CharacterLorebookStep,
  type LorebookEntry,
} from "@/features/asset/ui/create-character/lorebook-step";
import { AssetService } from "@/app/services/asset-service";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { CardService } from "@/app/services/card-service";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { Entry } from "@/entities/card/domain/entry";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "@/app/queries/card";

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
  const queryClient = useQueryClient();
  const [characterName, setCharacterName] = useState("New Character");
  const [currentStep, setCurrentStep] = useState<CharacterStep>("image");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [avatarAssetId, setAvatarAssetId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [exampleDialogue, setExampleDialogue] = useState("");
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([]);

  const steps: StepConfig<CharacterStep>[] = [
    { id: "image", number: 1, label: "Upload Image", required: true },
    { id: "info", number: 2, label: "Character Info", required: true },
    { id: "lorebook", number: 3, label: "Lorebook", required: false },
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

  const handleNext = async () => {
    if (isLastStep) {
      setIsCreatingCard(true);
      try {
        // Create lorebook if entries exist
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

        // Create character card
        const cardResult = CharacterCard.create({
          title: characterName,
          name: characterName,
          description: description,
          exampleDialogue: exampleDialogue || undefined,
          iconAssetId: avatarAssetId
            ? new UniqueEntityID(avatarAssetId)
            : undefined,
          type: CardType.Character,
          tags: [],
          lorebook: lorebook,
        });

        if (cardResult.isFailure) {
          console.error("Failed to create card:", cardResult.getError());
          setIsCreatingCard(false);
          return;
        }

        const card = cardResult.getValue();

        // Save card to database
        const saveResult = await CardService.saveCard.execute(card);

        if (saveResult.isFailure) {
          console.error("Failed to save card:", saveResult.getError());
          setIsCreatingCard(false);
          return;
        }

        // Invalidate queries to refresh card list
        await queryClient.invalidateQueries({
          queryKey: cardKeys.lists(),
        });

        // Navigate to assets page
        navigate({ to: "/assets" });
      } catch (error) {
        console.error("Error creating character card:", error);
        setIsCreatingCard(false);
      }
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

  // Validation logic for each step
  const canProceed = (() => {
    switch (currentStep) {
      case "image":
        return characterName.trim().length > 0 && avatarAssetId !== undefined;
      case "info":
        return description.trim().length > 0;
      case "lorebook":
        return true; // Optional step
      default:
        return false;
    }
  })();

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
              Create Character
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
          <Button onClick={handleNext} disabled={!canProceed || isCreatingCard}>
            {isCreatingCard ? "Creating..." : isLastStep ? "Finish" : "Next"}
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
            <CharacterInfoStep
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
