import { Page, useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";

const OnboardingStepOnePage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();

  return (
    <div className={cn("z-40 absolute inset-0 top-[38px]")}>
      {/* Close */}
      <button
        className="z-50 absolute top-[34px] right-[40px] text-text-subtle"
        onClick={() => {
          setActivePage(Page.Init);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Main */}
      <div className="absolute inset-0 bg-linear-to-b from-background-surface-0 to-background-surface-3 grid place-content-center gap-[49px]">
        <div className="flex flex-col gap-[8px] items-center">
          <div className="font-[600] text-[32px] leading-[40px] text-text-primary">
            Two short minutes to understand how astrsk works!
          </div>
          <div className="font-[400] text-[16px] leading-[25.6px] text-text-placeholder">
            Get a sense of the overall structure of astrsk
          </div>
        </div>
        <div className="w-[1000px] aspect-video rounded-[12px] overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/vO6JFL6R_mc?autoplay=1&mute=1&cc_load_policy=1"
            title="astrsk Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Button
          size="lg"
          className="place-self-center min-w-[80px] py-[10px]"
          onClick={() => {
            setActivePage(Page.OnboardingStepTwo);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export { OnboardingStepOnePage };
