import { Input, FileUploadButton } from "@/shared/ui/forms";

interface BasicInfoStepProps {
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  imageAssetId?: string;
  onFileUpload?: (file: File) => void;
}

const DEFAULT_SESSION_NAME = "New Session";
const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png";

/**
 * Basic Info Step Component
 * Step 1 of the Create Session wizard
 *
 * Layout:
 * - Section 1: Session Name (Required)
 * - Section 2: Session Background Image (Optional)
 */
export function BasicInfoStep({
  sessionName,
  onSessionNameChange,
  imageAssetId,
  onFileUpload,
}: BasicInfoStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Basic Info
        </h2>
        <p className="text-text-secondary text-sm">
          Set up the basic information for your session.
        </p>
      </div>

      {/* Section 1: Session Name */}
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Name your session <span className="text-status-required">*</span>
            </h3>
            <p className="text-text-secondary text-sm">
              Give your session a name
            </p>
          </div>

          {/* Session Name Input */}
          <Input
            type="text"
            value={sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            placeholder="Enter session name..."
            required
          />
        </div>
      </div>

      {/* Section 2: Session Background Image */}
      {onFileUpload && (
        <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <div>
              <h3 className="text-text-primary mb-1 text-lg font-semibold">
                Upload session cover
              </h3>
              <p className="text-text-secondary text-sm">
                Any JPG, JPEG, or PNG. Recommended for visual customization.
              </p>
            </div>

            {/* Background Image Preview - Centered */}
            <div className="flex flex-col items-center gap-4">
              {imageAssetId ? (
                <div className="relative w-full max-w-[640px]">
                  <img
                    src={imageAssetId}
                    alt={sessionName || DEFAULT_SESSION_NAME}
                    className="h-auto w-full rounded-lg object-cover"
                  />
                </div>
              ) : (
                <div className="bg-background-surface-3 relative flex aspect-video w-full max-w-[640px] items-center justify-center rounded-lg">
                  <div className="text-text-placeholder px-4 text-center text-sm">
                    Upload an image to see your background preview
                  </div>
                </div>
              )}

              {/* Upload Button - Below preview */}
              <FileUploadButton
                accept={ACCEPTED_FILE_TYPES}
                onChange={onFileUpload}
                className="w-full max-w-[320px]"
              >
                Upload session cover
              </FileUploadButton>

              <p className="text-text-secondary text-center text-xs">
                Supported formats: JPG, PNG
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
