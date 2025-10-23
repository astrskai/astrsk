import { Page, useAppStore } from "@/app/stores/app-store";
import { cn } from "@/shared/lib";
import { Button, SvgIcon } from "@/shared/ui";
import { useNavigate } from "@tanstack/react-router";

const OnboardingStepOnePage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();
  const navigate = useNavigate();

  return (
    <div className={cn("absolute inset-0 top-[var(--topbar-height)] z-40")}>
      {/* Close */}
      <button
        className="text-text-subtle absolute top-[34px] right-[40px] z-50 cursor-pointer"
        onClick={() => {
          setActivePage(Page.Init);
          navigate({ to: "/settings/providers", replace: true });
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Main */}
      <div className="from-background-surface-0 to-background-surface-3 absolute inset-0 grid place-content-center gap-[49px] bg-linear-to-b">
        <div className="flex flex-col items-center gap-[8px]">
          <div className="text-text-primary text-[32px] leading-[40px] font-[600]">
            Two short minutes to understand how astrsk works!
          </div>
          <div className="text-text-placeholder text-[16px] leading-[25.6px] font-[400]">
            Get a sense of the overall structure of astrsk
          </div>
        </div>
        <div className="aspect-video w-[1000px] overflow-hidden rounded-[12px]">
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
