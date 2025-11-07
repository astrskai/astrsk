import { Trash2 } from "lucide-react";

import CharacterPreview from "@/features/character/ui/character-preview";

import { FileDropZone, ChatBubble, AvatarSimple } from "@/shared/ui";
import { Input, FileUploadButton } from "@/shared/ui/forms";
import { cn } from "@/shared/lib/cn";

interface CharacterBasicInfoStepProps {
  characterName: string;
  onCharacterNameChange: (name: string) => void;
  imageUrl?: string;
  onFileUpload: (file: File | null) => void;
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
export function CharacterBasicInfoStep({
  characterName = "Untitled Character",
  onCharacterNameChange,
  imageUrl,
  onFileUpload,
}: CharacterBasicInfoStepProps) {
  // avatarAssetId is now a blob URL (e.g., "blob:http://localhost:3000/...")
  // Use it directly for both Avatar and CardDisplay preview

  const handleDeleteImage = () => {
    onFileUpload(null);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Section 1: Character Name */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-50 md:text-lg">
              Name your character{" "}
              <span className="text-normal-secondary">*</span>
            </h3>
            <p className="text-xs text-gray-200 md:text-sm">
              Give your character a name
            </p>
          </div>

          {/* Character Name Input */}
          <Input
            type="text"
            value={characterName}
            onChange={(e) => onCharacterNameChange(e.target.value)}
            placeholder="Enter character name..."
            maxLength={50}
            required
            label="Character Name"
            labelPosition="inner"
          />
        </div>
      </div>

      {/* Section 2: Character Image */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 lg:gap-6">
          <div className="flex flex-col justify-between gap-1">
            <h3 className="text-text-primary mb-1 text-base font-semibold md:text-lg">
              Upload character image and preview
            </h3>
            <p className="text-text-secondary text-xs md:text-sm">
              Any JPG, JPEG, or PNG. 500x416 pixels for best display.
            </p>
          </div>

          {/* Avatar and Card Display */}
          {!imageUrl ? (
            /* File Drop Zone - Before Upload */
            <FileDropZone
              onDrop={(files) => files[0] && onFileUpload(files[0])}
              accept={{ "image/*": [".jpg", ".jpeg", ".png"] }}
              maxFiles={1}
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img
                src={imageUrl}
                alt={characterName || "Untitled Character"}
                className="aspect-[4/6] h-auto w-full max-w-[200px] rounded-lg object-cover md:max-w-[320px]"
              />

              {/* Change Image Button - Below previews */}
              <div className="flex items-center gap-4">
                <button
                  className={cn(
                    "cursor-pointer text-sm text-gray-200 hover:text-gray-50",
                  )}
                  onClick={handleDeleteImage}
                >
                  <Trash2 size={20} />
                </button>
                <FileUploadButton
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={onFileUpload}
                  className="w-full max-w-[180px] text-xs md:max-w-[240px] md:text-sm"
                >
                  Change Character Image
                </FileUploadButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
