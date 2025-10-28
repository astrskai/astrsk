import { useRef, useMemo } from "react";
import { Avatar } from "@/shared/ui";
import { Input, Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useAsset } from "@/shared/hooks/use-asset";
import CardDisplay from "@/features/card/ui/card-display";

interface CharacterImageStepProps {
  characterName: string;
  onCharacterNameChange: (name: string) => void;
  avatarAssetId?: string;
  isUploading: boolean;
  onFileUpload: (file: File) => void;
}

/**
 * Character Image Step Component
 * Step 1 of the Create Character Card wizard
 *
 * Layout:
 * - Top: Character name input
 * - Left: Avatar (small circle)
 * - Center: Trading card preview
 * - Bottom: Upload button
 */
export function CharacterImageStep({
  characterName,
  onCharacterNameChange,
  avatarAssetId,
  isUploading,
  onFileUpload,
}: CharacterImageStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert asset ID to URL for Avatar component
  const avatarAssetIdEntity = avatarAssetId
    ? new UniqueEntityID(avatarAssetId)
    : undefined;
  const [avatarUrl, isAvatarVideo] = useAsset(avatarAssetIdEntity);

  // Create a temporary card for preview (only if image uploaded)
  const previewCard = useMemo(() => {
    if (!avatarAssetId) return null;

    const result = CharacterCard.create({
      title: characterName || "New Character",
      name: characterName || "New Character",
      iconAssetId: new UniqueEntityID(avatarAssetId),
      type: CardType.Character,
      tags: [],
    });

    return result.isSuccess ? result.getValue() : null;
  }, [characterName, avatarAssetId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Upload Image <span className="text-status-required">*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Upload an image for your character and enter a name.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-6 md:p-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Character Name Input */}
          <Input
            label="Character Name"
            type="text"
            value={characterName}
            onChange={(e) => onCharacterNameChange(e.target.value)}
            placeholder="Enter character name..."
            required
          />

          {/* Avatar and Card Display */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar - Left side on desktop, top on mobile */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Avatar
                src={avatarUrl}
                alt={characterName || "New Character"}
                size={96}
                isVideo={isAvatarVideo}
                className="ring-border ring-2"
              />
              <span className="text-text-secondary text-xs">
                Avatar Preview
              </span>
            </div>

            {/* Card Preview - Center */}
            <div className="flex flex-1 flex-col items-center gap-4">
              <div
                className={cn(
                  "relative w-full max-w-[320px]",
                  !previewCard &&
                    "bg-background-surface-3 flex aspect-[196/289] items-center justify-center rounded-[8px]",
                )}
              >
                {previewCard ? (
                  <div className="@container">
                    <CardDisplay
                      card={previewCard}
                      isSelected={false}
                      showActions={false}
                    />
                  </div>
                ) : (
                  <div className="text-text-placeholder px-4 text-center text-sm">
                    Upload an image to see your card preview
                  </div>
                )}
              </div>

              {/* Upload Button - Below card */}
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                size="lg"
                className="w-full max-w-[320px]"
              >
                {isUploading ? "Uploading..." : "Upload Character Image"}
              </Button>

              <p className="text-text-secondary text-center text-xs">
                Supported formats: JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
