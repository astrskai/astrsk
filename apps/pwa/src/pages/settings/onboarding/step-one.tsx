import { X } from "lucide-react";
import { Page, useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";

import { useNavigate } from "@tanstack/react-router";

const OnboardingStepOnePage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();
  const navigate = useNavigate();

  return (
    <div className={cn("absolute inset-0 top-[var(--topbar-height)] z-40")}>
      {/* Close */}
      <button
        type="button"
        aria-label="Close onboarding"
        className="text-text-subtle absolute top-4 right-4 z-50 cursor-pointer md:top-[34px] md:right-[40px]"
        onClick={() => {
          setActivePage(Page.Init);
          navigate({ to: "/settings/providers", replace: true });
        }}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Main */}
      <div className="from-background-surface-0 to-background-surface-3 absolute inset-0 grid place-content-center gap-6 bg-linear-to-b px-4 md:gap-[49px] md:px-0">
        <div className="flex flex-col items-center gap-2 md:gap-[8px]">
          <div className="text-text-primary text-center text-xl font-semibold leading-tight md:text-[32px] md:leading-[40px] md:font-[600]">
            Two short minutes to understand how astrsk works!
          </div>
          <div className="text-text-placeholder text-center text-sm leading-relaxed md:text-[16px] md:leading-[25.6px] md:font-[400]">
            Get a sense of the overall structure of astrsk
          </div>
        </div>
        <div className="aspect-video w-full max-w-[1000px] overflow-hidden rounded-lg md:rounded-[12px]">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/vO6JFL6R_mc?mute=1&cc_load_policy=1&start=0"
            title="astrsk Tutorial"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {/** disabled subscribe */}
        {/* <Button
          size="lg"
          className="min-w-[80px] place-self-center py-[10px]"
          onClick={() => {
            setActivePage(Page.OnboardingStepTwo);
          }}
        >
          Next
        </Button> */}
      </div>
    </div>
  );
};

export { OnboardingStepOnePage };
