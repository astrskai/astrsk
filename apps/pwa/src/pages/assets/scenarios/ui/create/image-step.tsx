import { Input, FileUploadButton } from "@/shared/ui/forms";
import PlotPreview from "@/features/plot/ui/plot-preview";

interface ScenarioImageStepProps {
  scenarioName: string;
  onScenarioNameChange: (name: string) => void;
  imageAssetId?: string;
  onFileUpload: (file: File) => void;
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
export function ScenarioImageStep({
  scenarioName,
  onScenarioNameChange,
  imageAssetId,
  onFileUpload,
}: ScenarioImageStepProps) {
  // imageAssetId is now a blob URL (e.g., "blob:http://localhost:3000/...")
  // Use it directly for ScenarioPreview

  return (
    <div className="flex flex-col gap-8">
      {/* Section 1: Scenario Name */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="mb-1 text-lg font-semibold text-gray-50">
              Name your scenario{" "}
              <span className="text-normal-secondary">*</span>
            </h3>
            <p className="text-sm text-gray-200">Give your scenario a name</p>
          </div>

          {/* Scenario Name Input */}
          <Input
            type="text"
            value={scenarioName}
            onChange={(e) => onScenarioNameChange(e.target.value)}
            placeholder="Enter scenario name..."
            required
          />
        </div>
      </div>

      {/* Section 2: Scenario Image */}
      <div>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 lg:gap-6">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Upload scenario image
            </h3>
            <p className="text-text-secondary text-sm">
              Any JPG, JPEG, or PNG. 1920x614 pixels for best display.
            </p>
          </div>

          {/* Scenario Preview - Center */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl space-y-2">
              <span className="text-text-secondary flex items-center justify-center text-xs">
                Scenario Preview
              </span>
              <PlotPreview
                title={scenarioName || "New Scenario"}
                imageUrl={
                  imageAssetId || "/img/placeholder/scenario-card-image.png"
                }
                summary="Scenario summary"
                tags={["tag1", "tag2"]}
                tokenCount={0}
                firstMessages={0}
                isShowActions={false}
              />
            </div>

            {/* Upload Button - Below card */}
            <FileUploadButton
              accept={ACCEPTED_FILE_TYPES}
              onChange={onFileUpload}
              className="w-full max-w-[320px]"
            >
              Upload Scenario Image
            </FileUploadButton>

            <p className="text-text-secondary text-center text-xs">
              Supported formats: JPG, PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
