import { Trash2 } from "lucide-react";

import { FileDropZone } from "@/shared/ui";
import { Input, FileUploadButton } from "@/shared/ui/forms";
import { cn } from "@/shared/lib/cn";

interface ScenarioBasicInfoStepProps {
  scenarioName: string;
  onScenarioNameChange: (name: string) => void;
  imageUrl?: string;
  imageDimensions?: { width: number; height: number };
  onFileUpload: (file: File | null) => void;
}

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png";

/**
 * Basic Info Step Component
 * Step 1 of the Create Scenario Card wizard
 *
 * Layout:
 * - Section 1: Scenario Name (Required)
 * - Section 2: Scenario Image (Optional)
 */
export function ScenarioBasicInfoStep({
  scenarioName = "Untitled Scenario",
  onScenarioNameChange,
  imageUrl,
  imageDimensions,
  onFileUpload,
}: ScenarioBasicInfoStepProps) {
  // imageUrl is now a blob URL (e.g., "blob:http://localhost:3000/...")
  // Use it directly for both Avatar and CardDisplay preview

  const handleDeleteImage = () => {
    onFileUpload(null);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Section 1: Scenario Name */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-50 md:text-[1.2rem]">
              Name your scenario{" "}
              <span className="text-normal-secondary">*</span>
            </h3>
            <p className="text-xs text-gray-200 md:text-sm">
              Give your scenario a name
            </p>
          </div>

          {/* Scenario Name Input */}
          <Input
            type="text"
            value={scenarioName}
            onChange={(e) => onScenarioNameChange(e.target.value)}
            placeholder="Enter scenario name..."
            maxLength={50}
            required
            label="Scenario Name"
            labelPosition="inner"
          />
        </div>
      </div>

      {/* Section 2: Scenario Image */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col justify-between gap-1 md:flex-row">
            <div>
              <h3 className="text-text-primary mb-1 text-base font-semibold md:text-[1.2rem]">
                Upload scenario image
              </h3>
              <p className="text-text-secondary text-xs md:text-sm">
                Any JPG, JPEG, or PNG. 500x416 pixels for best display.
              </p>
            </div>

            {/* Change Image Button - Below previews */}
            {imageUrl && (
              <div className="hidden items-center justify-center gap-4 md:flex">
                <button
                  className={cn(
                    "hidden cursor-pointer text-sm text-gray-200 hover:text-gray-50 md:block",
                  )}
                  onClick={handleDeleteImage}
                >
                  <Trash2 size={20} />
                </button>
                <FileUploadButton
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={onFileUpload}
                  className="w-full max-w-[120px] py-1.5 text-xs md:max-w-[200px] md:text-sm"
                >
                  Change Image
                </FileUploadButton>
              </div>
            )}
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
            <div className="relative mx-auto flex w-fit flex-col items-center gap-2">
              <img
                src={imageUrl}
                alt={scenarioName || "Untitled Scenario"}
                className={cn(
                  "h-auto w-full rounded-lg border-2 border-gray-100 object-cover",
                  imageDimensions &&
                    imageDimensions.width > imageDimensions.height
                    ? "max-w-[280px] md:max-w-[480px]"
                    : "max-w-[140px] md:max-w-[320px]",
                )}
              />
              {imageDimensions && (
                <p className="text-text-secondary text-xs">
                  {imageDimensions.width} x {imageDimensions.height} pixels
                </p>
              )}
              <FileUploadButton
                accept={ACCEPTED_FILE_TYPES}
                onChange={onFileUpload}
                className="absolute top-[-10px] right-[-10px] block md:hidden"
                size="sm"
                iconOnly
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
