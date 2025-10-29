import { Avatar } from "@/shared/ui";
import { Input, FileUploadButton } from "@/shared/ui/forms";
import { CardType } from "@/entities/card/domain";
import CardDisplay from "@/features/card/ui/card-display";

interface CharacterImageStepProps {
  characterName: string;
  onCharacterNameChange: (name: string) => void;
  avatarAssetId?: string;
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
  onFileUpload,
}: CharacterImageStepProps) {
  // avatarAssetId is now a blob URL (e.g., "blob:http://localhost:3000/...")
  // Use it directly for both Avatar and CardDisplay preview

  return (
    <div className="flex flex-col gap-6">
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
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
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
                src={avatarAssetId}
                alt={characterName || "New Character"}
                size={96}
                className="ring-border ring-2"
              />
              <span className="text-text-secondary text-xs">
                Avatar Preview
              </span>
            </div>

            {/* Card Preview - Center */}
            <div className="flex flex-1 flex-col items-center gap-4">
              {avatarAssetId ? (
                <div className="@container w-full max-w-[320px]">
                  <CardDisplay
                    title={characterName || "New Character"}
                    name={characterName || "New Character"}
                    type={CardType.Character}
                    tags={[]}
                    tokenCount={0}
                    previewImageUrl={avatarAssetId}
                    isSelected={false}
                    showActions={false}
                  />
                </div>
              ) : (
                <div className="bg-background-surface-3 relative flex aspect-[196/289] w-full max-w-[320px] items-center justify-center rounded-[8px]">
                  <div className="text-text-placeholder px-4 text-center text-sm">
                    Upload an image to see your card preview
                  </div>
                </div>
              )}

              {/* Upload Button - Below card */}
              <FileUploadButton
                accept=".jpg,.jpeg,.png,.webp"
                onChange={onFileUpload}
                size="lg"
                className="w-full max-w-[320px]"
              >
                Upload Character Image
              </FileUploadButton>

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
