import {
  LegalPageType,
  Page,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { Bot, Clapperboard, Sparkles, Zap } from "lucide-react";

const SubscribePage = () => {
  const setActivePage = useAppStore.use.setActivePage();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setSettingSubPage = useAppStore.use.setSettingSubPage();
  const setSettingDetailPage = useAppStore.use.setSettingDetailPage();

  return (
    <div
      className={cn(
        "z-40 absolute inset-0 top-[38px] grid place-content-center",
        "bg-background-surface-2",
        // "bg-[url('/img/subscription/bg-subscribe.jpg')] bg-cover bg-center",
      )}
    >
      {/* Close */}
      <button
        className="absolute top-[34px] right-[40px] text-text-subtle"
        onClick={() => {
          setActivePage(Page.Init);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center">
          <SvgIcon name="astrsk_symbol_fit" size={50} />
          <div className="text-[32px] leading-[40px] font-semibold">
            Start your 2 months free trial
          </div>
          <div className="text-[16px] leading-[25.6px] font-medium text-text-body">
            Upgrade to astrsk+
          </div>
        </div>

        {/* Main */}
        <div className="relative p-6 rounded-xl">
          {/* Gradient blur background */}
          <div
            className="absolute inset-0 rounded-xl backdrop-blur-xl bg-[#1B1B1B80]"
            style={{
              maskImage: "linear-gradient(to bottom, black, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="text-[18px] leading-[28px] font-semibold">
                30,000 Credits per month
              </div>
              <div className="text-[16px] leading-[22.4px] font-normal text-text-body">
                Unlock all AI-powered features — Vibe Coding, Images, and Videos
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 border-b border-border-selected-inverse opacity-10" />

            {/* Features */}
            <div className="my-6 flex flex-col gap-4">
              <div className="flex flex-row gap-4 items-start">
                <div className="p-1.5 rounded-lg bg-text-primary text-background-surface-3">
                  <Zap size={20} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center justify-start gap-2">
                    <div className="text-[16px] leading-[25.6px] font-semibold">
                      Vibe Coding
                    </div>
                    <div className="text-[14px] leading-[20px] font-medium text-text-body">
                      Powered by credits
                    </div>
                  </div>
                  <div className="text-[14px] leading-[20px] font-medium text-text-body">
                    Transform your sessions instantly — customize UI, flows, and
                    panels with ease.
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-start">
                <div className="p-1.5 rounded-lg bg-text-primary text-background-surface-3">
                  <Sparkles size={20} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center justify-start gap-2">
                    <div className="text-[16px] leading-[25.6px] font-semibold">
                      Built-in AI Image Generator
                    </div>
                    <div className="text-[14px] leading-[20px] font-medium text-text-body">
                      Powered by credits
                    </div>
                  </div>
                  <div className="text-[14px] leading-[20px] font-medium text-text-body">
                    Create stunning card visuals without leaving the editor. —
                    Coming soon!
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-start">
                <div className="p-1.5 rounded-lg bg-text-primary text-background-surface-3">
                  <Clapperboard size={20} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center justify-start gap-2">
                    <div className="text-[16px] leading-[25.6px] font-semibold">
                      AI Video Generator
                    </div>
                    <div className="text-[14px] leading-[20px] font-medium text-text-body">
                      Powered by credits
                    </div>
                  </div>
                  <div className="text-[14px] leading-[20px] font-medium text-text-body">
                    Turn scenes into immersive videos — perfect for bringing
                    moments to life.
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-start">
                <div className="p-1.5 rounded-lg bg-text-primary text-background-surface-3">
                  <Bot size={20} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center justify-start gap-2">
                    <div className="text-[16px] leading-[25.6px] font-semibold">
                      Auto Model Allocation
                    </div>
                  </div>
                  <div className="text-[14px] leading-[20px] font-medium text-text-body">
                    Always connect to the right model without manual setup. —
                    Coming soon!
                  </div>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="flex flex-row gap-2 mt-6">
              {/* Yearly Plan */}
              <div className="flex-1 p-6 lg:p-8 rounded-xl backdrop-blur-xl bg-[#11111180]">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                      <div className="text-[16px] leading-[25.6px] font-medium text-text-body">
                        Yearly Plan
                      </div>
                      <div className="px-2 py-1 rounded-xl bg-border-selected-primary text-button-foreground-primary text-[12px] font-semibold">
                        20% Discount
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-row items-center gap-2">
                        <span className="text-[14px] leading-[20px] font-medium text-text-body line-through">
                          $84.00
                        </span>
                        <span className="text-[14px] leading-[20px] font-medium text-text-body">
                          $67.20
                        </span>
                        <span className="text-[12px] font-normal text-text-placeholder">
                          (billed yearly)
                        </span>
                      </div>
                      <div className="flex flex-row items-baseline gap-1">
                        <div className="text-[24px] leading-[40px] font-semibold">
                          $5.60 USD
                        </div>
                        <div className="text-[16px] leading-[25.6px] font-normal text-text-body">
                          / month
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      // TODO: subscribe yearly plan
                      setActivePage(Page.SignUp);
                    }}
                  >
                    Upgrade now
                  </Button>
                </div>
              </div>

              {/* Monthly Plan */}
              <div className="flex-1 p-6 lg:p-8 rounded-xl backdrop-blur-xl bg-[#11111180]">
                <div className="flex flex-col gap-6 h-full justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="text-[16px] leading-[25.6px] font-medium text-text-body">
                      Monthly Plan
                    </div>
                    <div className="flex flex-row items-baseline gap-1">
                      <div className="text-[24px] leading-[40px] font-semibold">
                        $7.00 USD
                      </div>
                      <div className="text-[16px] leading-[25.6px] font-normal text-text-body">
                        / month
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      // TODO: subscribe monthly plan
                      setActivePage(Page.SignUp);
                    }}
                  >
                    Upgrade now
                  </Button>
                </div>
              </div>
            </div>

            {/* Legals */}
            <div className="text-center mt-4">
              <div className="text-[14px] leading-[20px] font-semibold text-text-body">
                <button
                  className="text-secondary-normal"
                  onClick={() => {
                    setActivePage(Page.Settings);
                    setSettingPageLevel(SettingPageLevel.detail);
                    setSettingSubPage(SettingSubPageType.legal);
                    setSettingDetailPage(LegalPageType.termOfService);
                  }}
                >
                  Terms of Use
                </button>
                <span> and </span>
                <button
                  className="text-secondary-normal"
                  onClick={() => {
                    setActivePage(Page.Settings);
                    setSettingPageLevel(SettingPageLevel.detail);
                    setSettingSubPage(SettingSubPageType.legal);
                    setSettingDetailPage(LegalPageType.privacyPolicy);
                  }}
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SubscribePage };
