import { Page, useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";

// TODO: update
const screenImages = [
  { src: "/img/subscription/feature-slide-1.png", alt: "Image Generator" },
  { src: "/img/subscription/feature-slide-2.png", alt: "Video Generator" },
  {
    src: "/img/subscription/feature-slide-3.png",
    alt: "AI-Assisted Card Creation",
  },
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
            <div className="text-text-primary text-[24px] leading-[40px] font-[500]">
              This is an astrsk+ feature
            </div>
          </DialogTitle>
          <DialogDescription>
            <div className="text-text-placeholder text-[16px] leading-[25.6px] font-[400]">
              This feature requires an astrsk+ subscription to use.
              <br />
              Upgrade now to unlock all premium AI tools
            </div>
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "relative flex h-[258px] w-full flex-col justify-center overflow-hidden",
          )}
        >
          <div ref={emblaRef} className="embla embla-subscription-nudge">
            <div className="embla__container">
              {screenImages.map((image, index) => (
                <div
                  key={index}
                  className="embla__slide mr-[12px] overflow-hidden rounded-[8px] bg-gradient-to-br from-[#fff]/30 to-[#000] p-[1px]"
                >
                  <div
                    className="h-full w-full rounded-[8px]"
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
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[50px] bg-linear-to-r from-[#272727] to-[#27272700]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[50px] bg-linear-to-l from-[#272727] to-[#27272700]" />
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
            Learn more
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SubscribeNudgeDialog };
