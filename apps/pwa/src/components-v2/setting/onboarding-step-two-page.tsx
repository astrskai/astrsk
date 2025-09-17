import {
  Page,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { ArrowLeft, Key, Sparkles } from "lucide-react";

function FloatingActionButton({
  className,
  onClick,
  ref,
  position,
  icon,
  label,
  openned,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  label?: string;
  position: "top-left" | "top-right";
  openned?: boolean;
}) {
  return (
    <Button
      className={cn(
        "group/fab z-10 absolute top-[24px] rounded-full cursor-pointer",
        "bg-button-background-floating border-[1px] border-border-light text-text-primary",
        "hover:bg-background-card hover:text-text-primary",
        position === "top-left" ? "left-[40px]" : "right-[40px]",
        "!transition-all ease-out duration-300",
        "min-w-[40px] h-[40px] p-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
      }}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          "h-full flex flex-row items-center",
          "transition-[margin-inline] ease-out duration-300",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] ease-out duration-300",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden font-medium text-[14px] leading-[20px]">
            {label}
          </span>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </Button>
  );
}

const OnboardingStepTwoPage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setSettingSubPage = useAppStore.use.setSettingSubPage();

  return (
    <div className={cn("z-40 absolute inset-0 top-[38px]")}>
      {/* Back */}
      <FloatingActionButton
        icon={<ArrowLeft className="min-w-[24px] min-h-[24px]" />}
        label="Back"
        position="top-left"
        onClick={() => {
          setActivePage(Page.OnboardingStepOne);
        }}
      />

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
      <div className="absolute inset-0 bg-linear-to-b from-background-surface-0 to-background-surface-3 grid place-content-center">
        <div className="flex flex-row gap-[37px]">
          {/* Left section */}
          <div className="w-[640px] h-[728px] bg-background-surface-0 rounded-[12px] flex flex-col items-center justify-center">
            <div className="font-[600] text-[32px] leading-[40px] text-text-primary mb-[24px]">
              Dive into astrsk
            </div>
            <div className="font-[600] text-[20px] leading-[24px] text-text-body mb-[8px]">
              The open source app is completely free to use
            </div>
            <div className="font-[500] text-[16px] leading-[25.6px] text-text-info mb-[50px]">
              Build and play powerful multi-agent roleplays without any
              limitations.
            </div>
            <div className="flex flex-col gap-4 mb-[46px]">
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-background-surface-3 grid place-content-center">
                  <SvgIcon name="agents" size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    AI Workflow and Agents Incorporated into Roleplay
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-subtle">
                    Create as many AI agents as you need
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-background-surface-3 grid place-content-center">
                  <SvgIcon name="cards" size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    Create and Manage Cards & Sessions
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-subtle">
                    Build V2, V3 cards and play sessions in infinite
                    combinations
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-background-surface-3 grid place-content-center">
                  <Sparkles size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    Structured Output and Data Management
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-subtle">
                    Structure and manage data relevant to your session from AI
                    <br />
                    output, character output format to session environment stats
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-background-surface-3 grid place-content-center">
                  <Key size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    Bring Your Own API Keys
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-subtle">
                    Connect your own AI provider to power your roleplay
                  </div>
                </div>
              </div>
              <div className="font-[600] text-[12px] leading-[15px] text-text-body text-center">
                .<br />
                .<br />.
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="w-[474px]"
              onClick={() => {
                setActivePage(Page.Settings);
                setSettingPageLevel(SettingPageLevel.sub);
                setSettingSubPage(SettingSubPageType.providers);
              }}
            >
              Start astrsk
            </Button>
          </div>

          {/* Right section */}
          <div className="relative w-[768px] h-[728px] rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
            <div className="w-full h-full bg-[#000] rounded-[12px] flex flex-col items-center justify-center">
              <div className="w-[532px] h-[320px] mt-[-114px] mb-[8px] bg-[url('/img/onboarding/step-two-main.png')] bg-contain" />
              <div className="font-[900] text-[32px] leading-[50px] text-text-primary uppercase">
                instant immersion with{" "}
                <span className="text-[#B59EFF]">astrsk+</span>
              </div>
              <div className="font-[500] text-[14px] leading-[20px] text-text-body mb-[20px]">
                Automatic Setup? Yes. Images & Videos? Yes!
              </div>
              <div className="flex flex-row gap-[8px] mb-[32px]">
                <div className="relative size-[224px] rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px] overflow-hidden">
                  <div className="w-full h-full rounded-[8px] bg-[url('/img/onboarding/step-two-sub-1.jpg')] bg-contain text-center pb-[16px] flex flex-col justify-end">
                    <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary mb-[4px]">
                      AI Image Generator
                    </div>
                    <div className="font-[400] text-[12px] leading-[15px] text-text-body">
                      Create stunning visuals
                    </div>
                  </div>
                </div>
                <div className="relative size-[224px] rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px] overflow-hidden">
                  <div className="w-full h-full rounded-[8px] bg-[url('/img/onboarding/step-two-sub-2.jpg')] bg-contain text-center pb-[16px] flex flex-col justify-end">
                    <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary mb-[4px]">
                      AI Video Generator
                    </div>
                    <div className="font-[400] text-[12px] leading-[15px] text-text-body">
                      Bring sessions to life
                    </div>
                  </div>
                </div>
                <div className="relative size-[224px] rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px] overflow-hidden">
                  <div className="w-full h-full rounded-[8px] size-[224px] bg-[url('/img/onboarding/step-two-sub-3.jpg')] bg-contain text-center pb-[16px] flex flex-col justify-end">
                    <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary mb-[4px]">
                      AI-Assisted Card Creation
                    </div>
                    <div className="font-[400] text-[12px] leading-[15px] text-text-body">
                      Write faster, easier, better
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="w-[474px]"
                onClick={() => {
                  setActivePage(Page.Subscribe);
                }}
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OnboardingStepTwoPage };
