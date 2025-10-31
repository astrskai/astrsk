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
const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.webp";

/**
 * Plot Image Step Component
 * Step 1 of the Create Plot Card wizard
 *
 * Simplified version of Character Image Step without Avatar preview
 * Uses object URL for immediate preview without uploading
 *
 * Layout:
 * - Top: Plot name input
 * - Center: Trading card preview
 * - Bottom: Upload button
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
          Upload Image <span className="text-status-required">*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Upload an image for your plot and enter a name.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Plot Name Input */}
          <Input
            label="Plot Name"
            type="text"
            value={plotName}
            onChange={(e) => onPlotNameChange(e.target.value)}
            placeholder="Enter plot name..."
            required
          />

          {/* Card Preview - Centered */}
          <div className="flex flex-col items-center gap-4">
            {imageAssetId ? (
              <div className="@container w-full max-w-[320px]">
                <CardDisplay
                  title={plotName || DEFAULT_PLOT_NAME}
                  type={CardType.Plot}
                  tags={[]}
                  tokenCount={0}
                  previewImageUrl={imageAssetId}
                  isSelected={false}
                  showActions={false}
                />
              </div>
            ) : (
              <div className="bg-background-surface-3 relative flex aspect-[196/289] w-full max-w-[320px] items-center justify-center rounded-[8px]">
                <div className="text-text-placeholder px-4 text-center text-sm">
                  Upload an image to see your plot card preview
                </div>
              </div>
            )}

            {/* Upload Button - Below card */}
            <FileUploadButton
              accept={ACCEPTED_FILE_TYPES}
              onChange={onFileUpload}
              className="w-full max-w-[320px]"
            >
              Upload Plot Image
            </FileUploadButton>

            <p className="text-text-secondary text-center text-xs">
              Supported formats: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
