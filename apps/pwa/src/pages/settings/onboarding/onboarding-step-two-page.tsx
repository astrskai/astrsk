import { useNavigate } from "@tanstack/react-router";
import { Page, useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";
import { Button, SvgIcon } from "@/shared/ui";
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
        "group/fab absolute top-[24px] z-10 cursor-pointer rounded-full",
        "bg-button-background-floating border-border-light text-text-primary border-[1px]",
        "hover:bg-background-card hover:text-text-primary",
        position === "top-left" ? "left-[40px]" : "right-[40px]",
        "!transition-all duration-300 ease-out",
        "h-[40px] min-w-[40px] p-0",
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
          "flex h-full flex-row items-center",
          "transition-[margin-inline] duration-300 ease-out",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] duration-300 ease-out",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden text-[14px] leading-[20px] font-medium">
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
  const navigate = useNavigate();

  return (
    <div className={cn("absolute inset-0 top-[var(--topbar-height)] z-40")}>
      {/* Back */}
      <FloatingActionButton
        icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
        label="Back"
        position="top-left"
        onClick={() => {
          setActivePage(Page.OnboardingStepOne);
        }}
      />

      {/* Close */}
      <button
        className="text-text-subtle absolute top-[34px] right-[40px] z-50"
        onClick={() => {
          setActivePage(Page.Init);
          navigate({ to: "/", replace: true });
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Main */}
      <div className="from-background-surface-0 to-background-surface-3 absolute inset-0 grid place-content-center bg-gradient-to-b">
        <div className="flex flex-row gap-[37px]">
          {/* Left section */}
          <div className="bg-background-surface-0 flex h-[728px] w-[640px] flex-col items-center justify-center rounded-[12px]">
            <div className="text-text-primary mb-[24px] flex flex-row items-center gap-[8px]">
              <SvgIcon
                name="dive_into_astrsk"
                width={241}
                height={25}
                className="mb-[4px]"
              />
            </div>
            <div className="text-text-body mb-[8px] text-[20px] leading-[24px] font-semibold">
              The Open Source App is Completely Free to Use
            </div>
            <div className="text-text-info mb-[50px] text-[16px] leading-[25.6px] font-medium">
              Build and play powerful multi-agent roleplays without any
              limitations.
            </div>
            <div className="mb-[46px] flex flex-col gap-4">
              <div className="flex flex-row gap-[16px]">
                <div className="bg-background-surface-3 grid size-[32px] place-content-center rounded-[8px]">
                  <SvgIcon name="agents" size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-text-primary text-[16px] leading-[25.6px] font-semibold">
                    AI Workflow and Agents Incorporated into Roleplay
                  </div>
                  <div className="text-text-subtle text-[14px] leading-[20px] font-medium">
                    Create as many AI agents as you need
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="bg-background-surface-3 grid size-[32px] place-content-center rounded-[8px]">
                  <SvgIcon name="cards" size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-text-primary text-[16px] leading-[25.6px] font-semibold">
                    Create and Manage Cards & Sessions
                  </div>
                  <div className="text-text-subtle text-[14px] leading-[20px] font-medium">
                    Build V2, V3 cards and play sessions in infinite
                    combinations
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="bg-background-surface-3 grid size-[32px] place-content-center rounded-[8px]">
                  <Sparkles size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-text-primary text-[16px] leading-[25.6px] font-semibold">
                    Structured Output and Data Management
                  </div>
                  <div className="text-text-subtle text-[14px] leading-[20px] font-medium">
                    Structure and manage data relevant to your session from AI
                    <br />
                    output, character output format to session environment stats
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="bg-background-surface-3 grid size-[32px] place-content-center rounded-[8px]">
                  <Key size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-text-primary text-[16px] leading-[25.6px] font-semibold">
                    Bring Your Own API Keys
                  </div>
                  <div className="text-text-subtle text-[14px] leading-[20px] font-medium">
                    Connect your own AI provider to power your roleplay
                  </div>
                </div>
              </div>
              <div className="text-text-body text-center text-[12px] leading-[15px] font-semibold">
                .<br />
                .<br />.
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="w-[474px]"
              onClick={() => {
                setActivePage(Page.Init);
                navigate({ to: "/settings/providers", replace: true });
              }}
            >
              Start astrsk
            </Button>
          </div>

          {/* Right section */}
          <div className="relative h-[728px] w-[768px] rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[12px] bg-[#000]">
              <div className="mt-[-114px] mb-[8px] h-[320px] w-[532px] bg-[url('/img/onboarding/step-two-main.png')] bg-contain" />
              <div className="text-text-primary text-[32px] leading-[50px] font-black uppercase">
                instant immersion with{" "}
                <span className="text-[#B59EFF]">astrsk+</span>
              </div>
              <div className="text-text-body mb-[20px] text-[14px] leading-[20px] font-medium">
                Automatic Setup? Yes. Images & Videos? Yes!
              </div>
              <div className="mb-[32px] flex flex-row gap-[8px]">
                <div className="relative size-[224px] overflow-hidden rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
                  <div className="flex h-full w-full flex-col justify-end rounded-[8px] bg-[url('/img/onboarding/step-two-sub-1.jpg')] bg-contain pb-[16px] text-center">
                    <div className="text-text-primary mb-[4px] text-[16px] leading-[25.6px] font-semibold">
                      AI Image Generator
                    </div>
                    <div className="text-text-body text-[12px] leading-[15px] font-normal">
                      Create stunning visuals
                    </div>
                  </div>
                </div>
                <div className="relative size-[224px] overflow-hidden rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
                  <div className="flex h-full w-full flex-col justify-end rounded-[8px] bg-[url('/img/onboarding/step-two-sub-2.jpg')] bg-contain pb-[16px] text-center">
                    <div className="text-text-primary mb-[4px] text-[16px] leading-[25.6px] font-semibold">
                      AI Video Generator
                    </div>
                    <div className="text-text-body text-[12px] leading-[15px] font-normal">
                      Bring sessions to life
                    </div>
                  </div>
                </div>
                <div className="relative size-[224px] overflow-hidden rounded-[8px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
                  <div className="flex size-[224px] h-full w-full flex-col justify-end rounded-[8px] bg-[url('/img/onboarding/step-two-sub-3.jpg')] bg-contain pb-[16px] text-center">
                    <div className="text-text-primary mb-[4px] text-[16px] leading-[25.6px] font-semibold">
                      AI-Assisted Card Creation
                    </div>
                    <div className="text-text-body text-[12px] leading-[15px] font-normal">
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
