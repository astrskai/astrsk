import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { StepIndicator, type StepConfig } from "@/shared/ui";
import { PlotImageStep } from "@/features/asset/ui/create-plot";

type PlotStep = "image" | "info" | "lorebook" | "scenario";

/**
 * Create Plot Card Page
 * Multi-step wizard for creating a new plot card
 *
 * Steps:
 * 1. Image - Upload or select plot image
 * 2. Info - Basic information (name, title, description)
 * 3. Lorebook - World-building and lore entries
 * 4. Scenario - Initial scenario and story setup
 */
export function CreatePlotPage() {
  const navigate = useNavigate();
  const [plotName, setPlotName] = useState("New Plot");
  const [currentStep, setCurrentStep] = useState<PlotStep>("image");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageAssetId, setImageAssetId] = useState<string | undefined>();

  const STEPS: StepConfig<PlotStep>[] = [
    { id: "image", number: 1, label: "Image", required: true },
    { id: "info", number: 2, label: "Info", required: true },
    { id: "lorebook", number: 3, label: "Lorebook", required: false },
    { id: "scenario", number: 4, label: "Scenario", required: false },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const showPreviousButton = currentStepIndex > 0;

  const handleNext = () => {
    if (isLastStep) {
      // TODO: Create plot card
      console.log("Creating plot card:", plotName);
      navigate({ to: "/assets" });
    } else {
      const nextStep = STEPS[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleCancelClick = () => {
    // TODO: Show confirmation dialog if changes exist
    navigate({ to: "/assets" });
  };

  const handleFileUpload = (file: File) => {
    // Store the file for preview - actual upload happens on save
    setImageFile(file);

    // Create a temporary object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageAssetId(objectUrl);
  };

  // TODO: Add validation logic for each step
  const canProceed = true;

  return (
    <div className="bg-background-surface-2 relative flex h-full w-full flex-col">
      {/* Mobile Header */}
      <div className="border-border flex items-center border-b px-4 py-4 md:hidden">
        <button
          onClick={handleCancelClick}
          className="text-text-primary hover:text-text-secondary mr-3 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
          <span className="text-text-secondary text-xs font-medium">
            Create Plot
          </span>
          <h1 className="text-text-primary text-lg font-semibold">
            {plotName}
          </h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="border-border hidden items-center justify-between border-b px-8 py-6 md:flex">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancelClick}
            className="text-text-primary hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-text-primary text-2xl font-semibold">
              Create Plot
            </h1>
            <p className="text-text-secondary text-sm">{plotName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showPreviousButton && (
            <Button variant="secondary" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-8 pb-24 md:pb-8">
          {/* Step 1: Image */}
          {currentStep === "image" && (
            <PlotImageStep
              plotName={plotName}
              onPlotNameChange={setPlotName}
              imageAssetId={imageAssetId}
              onFileUpload={handleFileUpload}
            />
          )}

          {/* Step 2: Info */}
          {currentStep === "info" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  2. Basic Information
                </h2>
                <p className="text-text-secondary text-sm">
                  Enter the basic information for your plot card.
                </p>
              </div>
              <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-6">
                <p className="text-text-secondary">
                  Info step content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Lorebook */}
          {currentStep === "lorebook" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  3. Lorebook
                </h2>
                <p className="text-text-secondary text-sm">
                  Add world-building and lore entries for your plot.
                </p>
              </div>
              <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-6">
                <p className="text-text-secondary">
                  Lorebook content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Scenario */}
          {currentStep === "scenario" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  4. Scenario
                </h2>
                <p className="text-text-secondary text-sm">
                  Define the initial scenario and story setup.
                </p>
              </div>
              <div className="bg-background-surface-1 border-border rounded-2xl border-2 p-6">
                <p className="text-text-secondary">
                  Scenario content will be implemented here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="border-border bg-background-surface-1 fixed right-0 bottom-0 left-0 border-t p-4 md:hidden">
        <div className="flex items-center justify-between gap-3">
          {showPreviousButton ? (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              Previous
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1"
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
