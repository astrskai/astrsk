import { Page, useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
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

// TODO: update
const screenImages = [
  { src: "/img/subscription/feature-slide-1.png", alt: "Image Generator" },
  { src: "/img/subscription/feature-slide-2.png", alt: "Video Generator" },
  { src: "/img/subscription/feature-slide-3.png", alt: "AI-Assisted Card Creation" },
  { src: "/img/subscription/feature-slide-4.png", alt: "1,000 Credit" },
];

const SubscribeNudgeDialog = () => {
  const isOpenSubscribeNudge = useAppStore.use.isOpenSubscribeNudge();
  const setIsOpenSubscribeNudge = useAppStore.use.setIsOpenSubscribeNudge();
  const setActivePage = useAppStore.use.setActivePage();

  // Screen carousel
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    AutoScroll({
      speed: 0.5,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ]);

  return (
    <Dialog open={isOpenSubscribeNudge}>
      <DialogContent hideClose className="min-w-[720px] outline-none">
        <DialogHeader>
          <DialogTitle>
            <div className="font-[500] text-[24px] leading-[40px] text-text-primary">
              This is an astrsk+ feature
            </div>
          </DialogTitle>
          <DialogDescription>
            <div className="font-[400] text-[16px] leading-[25.6px] text-text-placeholder">
              This feature requires an astrsk+ subscription to use.
              <br />
              Upgrade now to unlock all premium AI tools
            </div>
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "relative w-full h-[258px] flex flex-col justify-center overflow-hidden",
          )}
        >
          <div ref={emblaRef} className="embla embla-subscription-nudge">
            <div className="embla__container">
              {screenImages.map((image, index) => (
                <div
                  key={index}
                  className="embla__slide mr-[12px] rounded-[8px] bg-gradient-to-br from-[#fff]/30 to-[#000] p-[1px] overflow-hidden"
                >
                  <div
                    className="w-full h-full rounded-[8px]"
                    style={{
                      backgroundImage: `url(${image.src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className="sr-only">{image.alt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-y-0 left-0 w-[50px] bg-linear-to-r from-[#272727] to-[#27272700] pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[50px] bg-linear-to-l from-[#272727] to-[#27272700] pointer-events-none" />
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setIsOpenSubscribeNudge(false);
            }}
          >
            Maybe later
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setIsOpenSubscribeNudge(false);
              setActivePage(Page.Subscribe);
            }}
          >
            Try astrsk+ free
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SubscribeNudgeDialog };
