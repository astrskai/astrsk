import { useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { useState } from "react";
import QRCode from "react-qr-code";

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

const screenImages = [
  { src: "/img/onboarding/screen-1.png", alt: "Edit flow" },
  { src: "/img/onboarding/screen-2.png", alt: "Session play" },
  { src: "/img/onboarding/screen-3.png", alt: "Session settings" },
  { src: "/img/onboarding/screen-4.png", alt: "Edit card" },
];

const OnboardingDialog = () => {
  const isPassedOnboarding = useAppStore.use.isPassedOnboarding();
  const setIsPassedOnboarding = useAppStore.use.setIsPassedOnboarding();
  const [step, setStep] = useState(1);

  // Screen carousel
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    AutoScroll({
      speed: 0.5,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ]);

  // Telemetry
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  return (
    <Dialog open={!isPassedOnboarding}>
      <DialogContent hideClose className="min-w-[720px] outline-none">
        {step === 1 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={3} currentStep={step} />
              <DialogTitle>
                <div className="flex flex-row items-center gap-2">

                <div className="font-[500] text-[24px] leading-[40px] text-[#F1F1F1]">
                  Welcome to
                </div>
                <SvgIcon name="astrsk_logo_full" width={85} height={20} />
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className="font-[400] text-[16px] leading-[25.6px] text-[#A1A1A1]">
                  Design your prompts, bring characters to life, and begin your
                  AI storytelling journey!
                </div>
              </DialogDescription>
            </DialogHeader>
            <div
              className={cn(
                "relative w-full h-[348px] rounded-[12px] flex flex-col justify-center overflow-hidden",
                "bg-[url(/img/onboarding/screen-background.jpg)] bg-cover bg-center",
              )}
            >
              <div ref={emblaRef} className="embla embla-onboarding">
                <div className="embla__container">
                  {screenImages.map((image, index) => (
                    <div
                      key={index}
                      className="embla__slide mr-6 rounded-[12px] border-[1px] border-[#1B1B1B]"
                      style={{
                        backgroundImage: `url(${image.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <span className="sr-only">{image.alt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-y-0 left-0 w-[40px] bg-linear-to-r from-[#111111] to-[#11111100] pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-[40px] bg-linear-to-l from-[#111111] to-[#11111100] pointer-events-none" />
            </div>
            <div className="flex flex-row justify-end gap-2">
              <Button size="lg" onClick={() => setStep((prev) => prev + 1)}>
                Process to next
              </Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={3} currentStep={step} />
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
                  setStep((prev) => prev + 1);
                }}
              >
                No thanks
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  setIsTelemetryEnabled(true);
                  setStep((prev) => prev + 1);
                }}
              >
                Share anonymously
              </Button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <DialogHeader>
              <StepIndicator totalSteps={3} currentStep={step} />
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
      </DialogContent>
    </Dialog>
  );
};

export { OnboardingDialog };
