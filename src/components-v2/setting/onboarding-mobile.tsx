import { useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { useState } from "react";

const StepIndicator = ({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) => {
  return (
    <div className="w-full px-6 flex justify-center items-center">
      <div className="w-full flex justify-start items-center gap-1">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 h-0.5 rounded-lg transition-colors",
              currentStep === 2 || index === currentStep - 1
                ? "bg-text-primary"
                : "opacity-30 bg-text-primary",
            )}
          />
        ))}
      </div>
    </div>
  );
};

const OnboardingMobile = () => {
  const isPassedOnboarding = useAppStore.use.isPassedOnboarding();
  const setIsPassedOnboarding = useAppStore.use.setIsPassedOnboarding();
  const [step, setStep] = useState(1);

  // Telemetry
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  if (isPassedOnboarding) {
    return null;
  }

  const getBackgroundImage = () => {
    if (step === 2) {
      return "url(/img/onboarding/data-collection-mobile.png)";
    }
    return "url(/img/onboarding/create-mobile.png)";
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full h-dvh overflow-hidden flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: getBackgroundImage() }}
    >
      {/* Background gradient */}
      {step === 2 ? (
        <div className="w-[456px] h-[459px] left-[-41px] top-[466px] absolute opacity-50 bg-gradient-to-l from-blue-300/70 to-sky-900/70 rounded-full blur-3xl"></div>
      ) : (
        <div className="w-[512px] h-[516px] left-1/2 top-2/3 absolute bg-gradient-to-l from-blue-300 to-sky-900 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      )}

      {/* Step indicator */}
      <div className="pt-[35px]">
        <StepIndicator totalSteps={2} currentStep={step} />
      </div>

      {/* Main content area */}
      {step === 1 && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col justify-center items-center gap-4 text-center translate-y-[-40px]">
            <div className="inline-flex justify-start items-center gap-[3px]">
              <div className="text-center justify-start text-text-body text-base font-semibold leading-snug">
                Welcome to
              </div>
              <div className="text-center justify-start text-text-body text-base font-semibold leading-snug">
                <SvgIcon name="astrsk_logo_full" width={59.5} height={14} />
              </div>
            </div>
            <div className="text-center text-text-primary text-3xl font-bold leading-10">
              Create, customize,
              <br />
              and chat with your
              <br />
              own AI agents
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Data Collection */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <div className="px-6" style={{ marginTop: "35px" }}>
            <div className="text-center text-text-primary text-3xl font-bold leading-10">
              Help us improve
              <br />
              only if you want to
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="px-6" style={{ marginBottom: "180px" }}>
            <div className="text-center text-text-primary text-base leading-relaxed">
              Allow anonymous data sharing to help us understand how astrsk.ai
              is used.
            </div>
          </div>
        </div>
      )}

      {/* Bottom section with buttons */}
      <div className="absolute bottom-[50px] inset-x-[24px]">
        {step === 1 && (
          <Button
            size="lg"
            className="w-full h-10 bg-button-background-primary rounded-[20px] flex justify-center items-center"
            onClick={() => setStep(2)}
          >
            <div className="inline-flex justify-start items-center gap-2">
              <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
                Let's get started
              </div>
            </div>
          </Button>
        )}

        {step === 2 && (
          <div className="w-full flex flex-col gap-2">
            <Button
              size="lg"
              className="h-10 bg-button-background-primary rounded-[20px] flex justify-center items-center"
              onClick={() => {
                setIsTelemetryEnabled(true);
                setIsPassedOnboarding(true);
              }}
            >
              <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
                Share anonymous usage data
              </div>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-[20px] flex justify-center items-center"
              onClick={() => {
                setIsTelemetryEnabled(false);
                setIsPassedOnboarding(true);
              }}
            >
              <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
                No thanks
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { OnboardingMobile };
