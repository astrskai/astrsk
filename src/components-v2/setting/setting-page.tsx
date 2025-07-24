import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  LegalPageType,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import ContentPolicy from "@/components-v2/setting/content-policy";
import ModelPage from "@/components-v2/setting/model-page";
import PrivacyPolicy from "@/components-v2/setting/privacy-policy";
import RefundPolicy from "@/components-v2/setting/refund-policy";
import TermOfService from "@/components-v2/setting/terms-of-service";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Typo2XLarge, TypoBase, TypoXLarge } from "@/components-v2/typo";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Separator } from "@/components-v2/ui/separator";
import { Switch } from "@/components-v2/ui/switch";
import OssNotice from "@/components-v2/setting/oss-notice";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const LegalPage = ({
  setSettingPageLevel,
  setLegalPage,
}: {
  setSettingPageLevel: (value: SettingPageLevel) => void;
  setLegalPage: (value: LegalPageType) => void;
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="mb-12 flex flex-col gap-8 text-text-body">
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(LegalPageType.privacyPolicy);
              setSettingPageLevel(SettingPageLevel.detail);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Privacy Policy
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(LegalPageType.termOfService);
              setSettingPageLevel(SettingPageLevel.detail);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Term of Use
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(LegalPageType.contentPolicy);
              setSettingPageLevel(SettingPageLevel.detail);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Content Policy
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(LegalPageType.refundPolicy);
              setSettingPageLevel(SettingPageLevel.detail);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Refund Policy
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(LegalPageType.ossNotice);
              setSettingPageLevel(SettingPageLevel.detail);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Open-source Software Notice
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
        </div>
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
};

const MainPage = () => {
  // Providers
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setSettingSubPage = useAppStore.use.setSettingSubPage();

  // Telemetry
  const isTelemetryEnabled = useAppStore.use.isTelemetryEnabled();
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  // Legal
  const setSettingDetailPage = useAppStore.use.setSettingDetailPage();

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <Typo2XLarge className="mb-12 text-text-primary font-semibold">
          Settings
        </Typo2XLarge>

        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            App Preferences
          </TypoXLarge>

          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              setSettingPageLevel(SettingPageLevel.sub);
              setSettingSubPage(SettingSubPageType.providers);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Providers
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>

          <div className="flex i tems-center justify-between">
            <div className="flex flex-col gap-[8px]">
              <TypoBase className="font-semibold text-text-body">
                Telemetry settings
              </TypoBase>
              <TypoBase className="text-text-placeholder">
                Share usage data anonymously
              </TypoBase>
              <div className="font-[400] text-[12px] leading-[15px] text-text-info">
                For detailed information about what data is being shared,{" "}
                <span
                  className="text-secondary-normal cursor-pointer"
                  onClick={() => {
                    setSettingPageLevel(SettingPageLevel.detail);
                    setSettingDetailPage(LegalPageType.privacyPolicy);
                  }}
                >
                  [click here]
                </span>
              </div>
            </div>
            <Switch
              checked={isTelemetryEnabled}
              onCheckedChange={setIsTelemetryEnabled}
            />
          </div>
        </div>
        <Separator />
        <div className="my-13 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Community
          </TypoXLarge>

          <div
            className="flex items-center text-text-body justify-between cursor-pointer"
            onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
          >
            <div className="flex items-center gap-2">
              <SvgIcon name="discord" className="h-5 w-5 text-[#5865F2]" />
              <TypoBase className="font-semibold text-text-body">
                Join our Discord
              </TypoBase>
            </div>
          </div>

          <div
            className="flex items-center text-text-body justify-between cursor-pointer"
            onClick={() => {
              openInNewTab("https://www.reddit.com/r/astrsk_ai/");
            }}
          >
            <div className="flex items-center gap-2">
              <SvgIcon
                name="reddit_color"
                className="h-5 w-5 text-orange-500"
              />
              <TypoBase className="font-semibold text-text-body">
                Visit our Reddit
              </TypoBase>
            </div>
          </div>
        </div>
        <Separator />
        <div className="my-13 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Support
          </TypoXLarge>

          <div
            className="flex items-center text-text-body justify-between cursor-pointer"
            onClick={() =>
              openInNewTab("https://astrskai.github.io/astrsk-ai-docs/")
            }
          >
            <TypoBase className="font-semibold text-text-body">
              User manual
            </TypoBase>
          </div>

          <div
            className="flex items-center text-text-body justify-between cursor-pointer"
            onClick={() => openInNewTab("https://join.astrsk.ai")}
          >
            <TypoBase className="font-semibold text-text-body">
              About astrsk.ai
            </TypoBase>
          </div>

          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              setSettingPageLevel(SettingPageLevel.sub);
              setSettingSubPage(SettingSubPageType.legal);
            }}
          >
            <TypoBase className="font-semibold text-text-body">Legal</TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
        </div>
        <Separator />
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
};

export default function SettingPage({ className }: { className?: string }) {
  const settingPageLevel = useAppStore.use.settingPageLevel();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const settingSubPage = useAppStore.use.settingSubPage();
  const settingDetailPage = useAppStore.use.settingDetailPage();
  const setSettingDetailPage = useAppStore.use.setSettingDetailPage();

  return (
    <ScrollArea className={cn("h-full bg-background-surface-1", className)}>
      <FloatingActionButton
        icon={<ArrowLeft className="min-w-[24px] min-h-[24px]" />}
        label={settingPageLevel === SettingPageLevel.sub ? "Settings" : "Legal"}
        position="top-left"
        className={cn(
          "transition-opacity duration-[600ms] ease-in-out opacity-100",
          settingPageLevel === SettingPageLevel.main &&
            "opacity-0 pointer-events-none",
        )}
        onClick={() => {
          if (settingPageLevel === SettingPageLevel.detail) {
            setSettingPageLevel(SettingPageLevel.sub);
          } else {
            setSettingPageLevel(SettingPageLevel.main);
          }
        }}
      />

      {/* Page Level 1 */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out",
          settingPageLevel !== SettingPageLevel.main && "-translate-x-full",
        )}
      >
        <MainPage />
      </div>

      {/* Page Level 2 */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out translate-x-full",
          settingPageLevel === SettingPageLevel.sub
            ? "translate-x-0"
            : settingPageLevel === SettingPageLevel.detail &&
                "-translate-x-full",
        )}
      >
        {settingSubPage === SettingSubPageType.providers && <ModelPage />}
        {settingSubPage === SettingSubPageType.legal && (
          <LegalPage
            setSettingPageLevel={setSettingPageLevel}
            setLegalPage={setSettingDetailPage}
          />
        )}
      </div>

      {/* Page Level 3 */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out translate-x-full",
          settingPageLevel === SettingPageLevel.detail && "translate-x-0",
        )}
      >
        {settingDetailPage === LegalPageType.refundPolicy && <RefundPolicy />}
        {settingDetailPage === LegalPageType.privacyPolicy && <PrivacyPolicy />}
        {settingDetailPage === LegalPageType.termOfService && <TermOfService />}
        {settingDetailPage === LegalPageType.contentPolicy && <ContentPolicy />}
        {settingDetailPage === LegalPageType.ossNotice && <OssNotice />}
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
}
