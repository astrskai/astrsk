import { Avatar } from "@/shared/ui";
import { Input, FileUploadButton } from "@/shared/ui/forms";
import CharacterPreview from "@/features/character/ui/character-preview";

interface CharacterImageStepProps {
  characterName: string;
  onCharacterNameChange: (name: string) => void;
  avatarAssetId?: string;
  onFileUpload: (file: File) => void;
}

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png";

/**
 * Basic Info Step Component
 * Step 1 of the Create Character Card wizard
 *
 * Layout:
 * - Section 1: Character Name (Required)
 * - Section 2: Character Image (Optional)
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
      {/* Section 1: Character Name */}
      <div className="border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Name your character{" "}
              <span className="text-status-required">*</span>
            </h3>
            <p className="text-text-secondary text-sm">
              Give your character a name
            </p>
          </div>

          {/* Character Name Input */}
          <Input
            type="text"
            value={characterName}
            onChange={(e) => onCharacterNameChange(e.target.value)}
            placeholder="Enter character name..."
            required
          />
        </div>
      </div>

      {/* Section 2: Character Image */}
      <div className="border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 lg:gap-6">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Upload character image
            </h3>
            <p className="text-text-secondary text-sm">
              Any JPG, JPEG, or PNG. 1920x614 pixels for best display.
            </p>
          </div>

          {/* Avatar and Card Display */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar - Left side on desktop, top on mobile */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="text-text-secondary text-xs">
                Avatar Preview
              </span>
              <Avatar
                src={avatarAssetId}
                alt={characterName || "New Character"}
                size={96}
                className="ring-border ring-2"
              />
            </div>

            {/* Card Preview - Center */}
            <div className="flex flex-1 flex-col items-center gap-4">
              <div className="w-full space-y-2">
                <span className="text-text-secondary flex items-center justify-center text-xs">
                  Character Preview
                </span>
                <CharacterPreview
                  title={characterName || "New Character"}
                  imageUrl={
                    avatarAssetId || "/img/placeholder/character-card-image.png"
                  }
                  summary="Character summary"
                  tags={["tag1", "tag2"]}
                  tokenCount={0}
                  isShowActions={false}
                />
              </div>

              {/* Upload Button - Below card */}
              <FileUploadButton
                accept={ACCEPTED_FILE_TYPES}
                onChange={onFileUpload}
                className="w-full max-w-[320px]"
              >
                Upload Character Image
              </FileUploadButton>

              <p className="text-text-secondary text-center text-xs">
                Supported formats: JPG, PNG
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
