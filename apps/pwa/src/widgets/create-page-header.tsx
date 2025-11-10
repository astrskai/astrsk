import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";

export interface CreatePageHeaderProps {
  /**
   * The category being created (e.g., "Character", "Plot", "Session")
   */
  category: string;

  /**
   * The current name/title of the item being created
   */
  itemName: string;

  /**
   * Handler for the back/cancel button (called after user confirms)
   */
  onCancel: () => void;

  /**
   * Handler for the previous step button
   */
  onPrevious?: () => void;

  /**
   * Handler for the next/finish button
   */
  onNext: () => void;

  /**
   * Whether the previous button should be shown
   */
  showPreviousButton: boolean;

  /**
   * Whether this is the last step
   */
  isLastStep: boolean;

  /**
   * Whether the user can proceed to the next step
   */
  canProceed: boolean;

  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;

  /**
   * Show explicit Cancel button on desktop instead of back arrow
   * Default: false (shows back arrow)
   */
  showCancelButton?: boolean;

  /**
   * Current step information for mobile display
   * Format: "Step 1 : Basic Info"
   */
  currentStepLabel?: string;
}

/**
 * CreatePageHeader - Reusable header for multi-step create pages
 *
 * Provides consistent navigation UI across character/plot/session creation flows:
 * - Back button with category label
 * - Item name display
 * - Previous/Next/Finish navigation buttons
 * - Responsive mobile and desktop layouts
 *
 * @example
 * ```tsx
 * <CreatePageHeader
 *   category="Character"
 *   itemName={characterName}
 *   onCancel={() => navigate("/assets/characters")}
 *   onPrevious={handlePrevious}
 *   onNext={handleNext}
 *   showPreviousButton={currentStepIndex > 0}
 *   isLastStep={currentStepIndex === STEPS.length - 1}
 *   canProceed={canProceed}
 *   isSubmitting={isCreatingCard}
 * />
 * ```
 */
export function CreatePageHeader({
  category,
  itemName,
  onCancel,
  onPrevious,
  onNext,
  showPreviousButton,
  isLastStep,
  canProceed,
  isSubmitting,
  showCancelButton = false,
  currentStepLabel,
}: CreatePageHeaderProps) {
  const [isOpenCancelDialog, setIsOpenCancelDialog] = useState<boolean>(false);

  const nextButtonLabel = isSubmitting
    ? "Creating..."
    : isLastStep
      ? "Finish"
      : "Next";

  const handleCancelClick = () => {
    setIsOpenCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setIsOpenCancelDialog(false);
    onCancel();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center gap-5 px-4 py-2 md:hidden">
        <button
          onClick={handleCancelClick}
          className="text-text-primary hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
          <span className="text-text-secondary text-xs font-medium">
            Create {category}
          </span>
          <h1 className="text-text-primary text-lg font-semibold">
            {currentStepLabel || itemName}
          </h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden items-center justify-between bg-gray-900 px-8 py-4 md:flex">
        {showCancelButton ? (
          // Session-style: No back button, title only
          <h1 className="flex items-center gap-2 text-2xl">
            <span className="text-text-secondary font-medium">
              Create {category}
            </span>
            <span>&nbsp;</span>
            <span className="text-text-primary text-xl font-semibold">
              {itemName}
            </span>
          </h1>
        ) : (
          // Character/Plot-style: Back button + title/subtitle
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancelClick}
              className="text-text-primary hover:text-text-secondary transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-text-primary text-2xl font-semibold">
                Create {category}
              </h1>
              <p className="text-text-secondary text-sm">{itemName}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {showCancelButton && (
            <Button variant="ghost" onClick={handleCancelClick}>
              Cancel
            </Button>
          )}
          {showPreviousButton && onPrevious && (
            <Button
              variant={showCancelButton ? "outline" : "secondary"}
              onClick={onPrevious}
            >
              Previous
            </Button>
          )}
          <Button onClick={onNext} disabled={!canProceed || isSubmitting}>
            {nextButtonLabel}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ActionConfirm
        open={isOpenCancelDialog}
        onOpenChange={setIsOpenCancelDialog}
        title="You've got unsaved changes!"
        description="Are you sure you want to close?"
        cancelLabel="Go back"
        confirmLabel="Close without saving"
        confirmVariant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
