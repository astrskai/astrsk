import { Input, FileUploadButton } from "@/shared/ui/forms";
import { CardType } from "@/entities/card/domain";
import CardDisplay from "@/features/card/ui/card-display";

interface PlotImageStepProps {
  plotName: string;
  onPlotNameChange: (name: string) => void;
  imageAssetId?: string;
  onFileUpload: (file: File) => void;
}

const DEFAULT_PLOT_NAME = "New Plot";
const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png";

/**
 * Basic Info Step Component
 * Step 1 of the Create Plot Card wizard
 *
 * Layout:
 * - Section 1: Plot Name (Required)
 * - Section 2: Plot Image (Optional)
 */
export function PlotImageStep({
  plotName,
  onPlotNameChange,
  imageAssetId,
  onFileUpload,
}: PlotImageStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Basic Info
        </h2>
        <p className="text-text-secondary text-sm">
          Set up the basic information for your plot.
        </p>
      </div>

      {/* Section 1: Plot Name */}
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Name your plot <span className="text-status-required">*</span>
            </h3>
            <p className="text-text-secondary text-sm">Give your plot a name</p>
          </div>

          {/* Plot Name Input */}
          <Input
            type="text"
            value={plotName}
            onChange={(e) => onPlotNameChange(e.target.value)}
            placeholder="Enter plot name..."
            required
          />
        </div>
      </div>

      {/* Section 2: Plot Image */}
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <h3 className="text-text-primary mb-1 text-lg font-semibold">
              Upload plot image
            </h3>
            <p className="text-text-secondary text-sm">
              Any JPG, JPEG, or PNG. 1920x614 pixels for best display.
            </p>
          </div>

          {/* Card Preview - Centered */}
          <div className="flex flex-col items-center gap-4">
            <div className="@container w-full max-w-[320px]">
              <CardDisplay
                title={plotName || DEFAULT_PLOT_NAME}
                type={CardType.Plot}
                tags={[]}
                tokenCount={0}
                previewImageUrl={
                  imageAssetId || "/img/placeholder/plot-card-image.png"
                }
                isSelected={false}
                showActions={false}
              />
            </div>

            {/* Upload Button - Below card */}
            <FileUploadButton
              accept={ACCEPTED_FILE_TYPES}
              onChange={onFileUpload}
              className="w-full max-w-[320px]"
            >
              Upload Plot Image
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
