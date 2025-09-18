import { useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { useState } from "react";
// import QRCode from "react-qr-code"; // Uncomment if mobile page is re-enabled

const StepIndicator = ({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) => {
  return (
    <div className="mb-[10px] flex flex-row gap-2 items-center justify-center">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            index === currentStep - 1 ? "bg-[#F1F1F1]" : "bg-[#757575]",
          )}
        />
      ))}
    </div>
  );
};

const OnboardingDialog = () => {
  const isPassedOnboarding = useAppStore.use.isPassedOnboarding();
  const setIsPassedOnboarding = useAppStore.use.setIsPassedOnboarding();
  const [step, setStep] = useState(1);

  // Telemetry
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  return (
    <Dialog open={!isPassedOnboarding}>
      <DialogContent hideClose className="min-w-[720px] outline-none">
        {step === 1 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={2} currentStep={step} />
              <DialogTitle>
                <div className="font-[500] text-[24px] leading-[40px] text-[#F1F1F1]">
                  2 short minutes to understand how astrsk works!
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className="font-[400] text-[16px] leading-[25.6px] text-[#A1A1A1]">
                  Get to know the high-level structure of the application
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[349px] rounded-[12px] overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/vO6JFL6R_mc?autoplay=1&mute=1&cc_load_policy=1&start=0"
                title="astrsk Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex flex-row justify-end gap-2">
              <Button size="lg" onClick={() => setStep((prev) => prev + 1)}>
                Next
              </Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={2} currentStep={step} />
              <DialogTitle>
                <div className="font-[500] text-[24px] leading-[40px] text-[#F1F1F1]">
                  Help us improve—but only if you choose to
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className="font-[400] text-[16px] leading-[25.6px] text-[#A1A1A1]">
                  Data collection can be disabled anytime in the Settings tab
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[306px] rounded-[12px] bg-[url(/img/onboarding/data-collection.jpg)] bg-cover bg-center">
              <span className="sr-only">Data collection anonymously</span>
            </div>
            <div className="font-[500] text-[12px] leading-[18px] text-text-info">
              For detailed information about what data is being shared, Check{" "}
              <span className="text-[#B59EFF]">
                Settings &gt; Legal &gt; Privacy Policy
              </span>
            </div>
            <div className="flex flex-row justify-end gap-2">
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  setIsTelemetryEnabled(false);
                  setIsPassedOnboarding(true);
                }}
              >
                No thanks
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  setIsTelemetryEnabled(true);
                  setIsPassedOnboarding(true);
                }}
              >
                Share anonymously
              </Button>
            </div>
          </>
        )}
        {/* Mobile support page - commented out for now, can be added later
        {step === 5 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={5} currentStep={step} />
              <DialogTitle>
                <div className="font-[500] text-[24px] leading-[40px] text-[#F1F1F1]">
                  Now on mobile, always with you
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className="font-[400] text-[16px] leading-[25.6px] text-[#A1A1A1]">
                  Available for iPhone and Android
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-[306px] rounded-[12px] bg-[url(/img/onboarding/mobile.jpg)] bg-cover bg-center">
              <div className="absolute top-[75.83px] left-[375px] size-[200px] p-[20px]">
                <QRCode
                  className="w-full h-full"
                  bgColor="transparent"
                  fgColor="#F1F1F1"
                  value="https://app.astrsk.ai"
                />
              </div>
              <span className="sr-only">Mobile app</span>
            </div>
            <div className="font-[500] text-[12px] leading-[18px] text-text-subtle">
              Visit the <span className="text-[#B59EFF]">astrsk.ai</span>, or
              scan the QR code with your phone to download instantly
            </div>
            <div className="flex flex-row justify-end gap-2">
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setStep((prev) => prev - 1)}
              >
                Back
              </Button>
              <Button size="lg" onClick={() => setIsPassedOnboarding(true)}>
                Begin
              </Button>
            </div>
          </>
        )}
        */}
      </DialogContent>
    </Dialog>
  );
};

export { OnboardingDialog };
