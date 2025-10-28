import { useRef, useMemo } from "react";
import { Input, Button } from "@/shared/ui/forms";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { CardType } from "@/entities/card/domain";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a temporary card for preview (only if image uploaded)
  const previewCard = useMemo(() => {
    if (!imageAssetId) return null;

    const result = PlotCard.create({
      title: plotName || DEFAULT_PLOT_NAME,
      iconAssetId: new UniqueEntityID(imageAssetId),
      type: CardType.Plot,
      tags: [],
    });

    return result.isSuccess ? result.getValue() : null;
  }, [plotName, imageAssetId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onFileUpload(file);
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
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileChange}
        className="hidden"
      />

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
      <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-6 md:p-8">
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
            {previewCard ? (
              <div className="@container w-full max-w-[320px]">
                <CardDisplay
                  card={previewCard}
                  isSelected={false}
                  showActions={false}
                  previewImageUrl={imageAssetId}
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
            <Button
              onClick={handleUploadClick}
              size="lg"
              className="w-full max-w-[320px]"
            >
              Upload Plot Image
            </Button>

            <p className="text-text-secondary text-center text-xs">
              Supported formats: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
