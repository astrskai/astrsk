import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/forms";

/**
 * Create Plot Card Page
 * Multi-step wizard for creating a new plot card
 *
 * Steps:
 * 1. Basic Info - Name, title, description
 * 2. Image - Upload or select plot image
 * 3. Details - Tags, story elements, etc.
 * 4. Review - Preview and confirm
 */
export function CreatePlotPage() {
  const navigate = useNavigate();
  const [plotName, setPlotName] = useState("New Plot");
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, number: 1, label: "Basic Info", required: true },
    { id: 2, number: 2, label: "Image", required: false },
    { id: 3, number: 3, label: "Details", required: false },
    { id: 4, number: 4, label: "Review", required: false },
  ];

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps;
  const showPreviousButton = currentStep > 1;

  const handleNext = () => {
    if (isLastStep) {
      // TODO: Create plot card
      console.log("Creating plot card:", plotName);
      navigate({ to: "/assets" });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCancelClick = () => {
    // TODO: Show confirmation dialog if changes exist
    navigate({ to: "/assets" });
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
              Create Plot Card
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
      <div className="border-border border-b px-4 py-3 md:px-8 md:py-4">
        {/* Mobile: Horizontal Bar Layout */}
        <div className="flex gap-1 md:hidden">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                className={`relative flex flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : isCompleted
                      ? "bg-primary/30 text-text-primary"
                      : "bg-background-surface-3 text-text-secondary"
                }`}
              >
                <span className="truncate">
                  {step.number}. {step.label}
                  {step.required && (
                    <span className="ml-0.5 text-red-400">*</span>
                  )}
                </span>
                {isActive && (
                  <div className="bg-primary-dark absolute bottom-1 left-2 right-2 h-0.5 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: Circle & Connector Layout */}
        <div className="hidden items-center justify-center gap-2 md:flex">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : isCompleted
                          ? "bg-primary/30 text-text-primary"
                          : "bg-background-surface-3 text-text-secondary"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {step.label}
                    {step.required && (
                      <span className="ml-0.5 text-red-400">*</span>
                    )}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-16 ${
                      isCompleted ? "bg-primary/30" : "bg-background-surface-3"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-8 pb-24 md:pb-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  1. Basic Information
                </h2>
                <p className="text-text-secondary text-sm">
                  Enter the basic information for your plot card.
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 1 content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Image */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  2. Plot Image
                </h2>
                <p className="text-text-secondary text-sm">
                  Upload or select an image for your plot.
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 2 content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  3. Plot Details
                </h2>
                <p className="text-text-secondary text-sm">
                  Add tags, story elements, and other details.
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 3 content will be implemented here
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-text-primary mb-2 text-xl font-semibold">
                  4. Review & Create
                </h2>
                <p className="text-text-secondary text-sm">
                  Review your plot card before creating it.
                </p>
              </div>
              <div className="bg-background-surface-1 rounded-2xl border-2 border-border p-6">
                <p className="text-text-secondary">
                  Step 4 content will be implemented here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="border-border fixed bottom-0 left-0 right-0 border-t bg-background-surface-1 p-4 md:hidden">
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
