import { ChevronLeft, ChevronRight } from "lucide-react";

import { useMobileNavigation } from "@/App";
import {
  LegalPageType,
  SettingPageLevel,
  useAppStore,
} from "@/app/stores/app-store";
import ContentPolicy from "@/components-v2/setting/content-policy";
import PrivacyPolicy from "@/components-v2/setting/privacy-policy";
import RefundPolicy from "@/components-v2/setting/refund-policy";
import TermOfService from "@/components-v2/setting/terms-of-service";
import { SvgIcon } from "@/components-v2/svg-icon";
import { TopNavigation } from "@/components-v2/top-navigation";
import { Typo2XLarge, TypoBase, TypoXLarge } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Separator } from "@/components-v2/ui/separator";
import { Switch } from "@/components-v2/ui/switch";
import OssNotice from "@/components-v2/setting/oss-notice";

export function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const LegalPageMobile = ({
  setSettingPageLevel,
  setLegalPage,
}: {
  setSettingPageLevel: (value: SettingPageLevel) => void;
  setLegalPage: (value: LegalPageType) => void;
}) => {
  return (
    <div className="flex flex-col h-dvh bg-background-surface-2">
      {/* Header */}
      <TopNavigation
        title="Legal"
        leftAction={
          <Button
            variant="ghost_white"
            size="icon"
            className="h-[40px] w-[40px] p-[8px]"
            onClick={() => setSettingPageLevel(SettingPageLevel.main)}
          >
            <ChevronLeft className="min-h-6 min-w-6" />
          </Button>
        }
      />

      <ScrollArea className="flex-1">
        <div className="mx-auto my-4 w-full max-w-[587px] px-4">

          <div className="mb-12 flex flex-col gap-8 text-text-muted-title">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                setLegalPage(LegalPageType.privacyPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Privacy Policy
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                setLegalPage(LegalPageType.termOfService);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Term of Use
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                setLegalPage(LegalPageType.contentPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Content Policy
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                setLegalPage(LegalPageType.refundPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Refund Policy
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                setLegalPage(LegalPageType.ossNotice);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Open-source Software Notice
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>
    </div>
  );
};

const LegalDetailPageMobile = ({
  setSettingPageLevel,
  legalPage,
}: {
  setSettingPageLevel: (value: SettingPageLevel) => void;
  legalPage: LegalPageType;
}) => {
  const getTitleByLegalPage = (type: LegalPageType) => {
    switch (type) {
      case LegalPageType.privacyPolicy:
        return "Privacy Policy";
      case LegalPageType.termOfService:
        return "Term of Use";
      case LegalPageType.contentPolicy:
        return "Content Policy";
      case LegalPageType.refundPolicy:
        return "Refund Policy";
      case LegalPageType.ossNotice:
        return "Open-source Software Notice";
      default:
        return "Legal";
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background-surface-2">
      {/* Header */}
      <TopNavigation
        title={getTitleByLegalPage(legalPage)}
        leftAction={
          <Button
            variant="ghost_white"
            size="icon"
            className="h-[40px] w-[40px] p-[8px]"
            onClick={() => setSettingPageLevel(SettingPageLevel.sub)}
          >
            <ChevronLeft className="min-h-6 min-w-6" />
          </Button>
        }
      />

      <ScrollArea className="flex-1">
        <div className="mx-auto my-6 w-full max-w-[587px] px-4">
          <div className="[&>div]:!static [&>div]:!inset-auto [&>div]:!z-auto [&>div]:!overflow-visible [&>div]:!pt-0 [&>div]:!max-w-none [&>div]:!mx-0">
            {legalPage === LegalPageType.refundPolicy ? (
              <RefundPolicy />
            ) : legalPage === LegalPageType.privacyPolicy ? (
              <PrivacyPolicy />
            ) : legalPage === LegalPageType.termOfService ? (
              <TermOfService />
            ) : legalPage === LegalPageType.contentPolicy ? (
              <ContentPolicy />
            ) : legalPage === LegalPageType.ossNotice ? (
              <OssNotice />
            ) : (
              <div className="text-text-primary">Loading...</div>
            )}
          </div>
        </div>
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>
    </div>
  );
};

const MainPageMobile = ({
  setSettingPageLevel,
}: {
  setSettingPageLevel: (value: SettingPageLevel) => void;
}) => {
  const { setIsOpen } = useMobileNavigation();

  // Telemetry
  const isTelemetryEnabled = useAppStore.use.isTelemetryEnabled();
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  // Legal
  const setLegalPage = useAppStore.use.setLegalPage();

  return (
    <div className="flex flex-col h-dvh bg-background-surface-2">
      {/* Header */}
      <TopNavigation title="Settings" onMenuClick={() => setIsOpen(true)} />

      <ScrollArea className="flex-1">
        <div className="mx-auto my-6 w-full max-w-[587px] px-4">
          <div className="mb-[32px] flex flex-col gap-8 text-text-muted-title">
            <TypoXLarge className="font-semibold text-text-muted-title">
              App Preferences
            </TypoXLarge>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <TypoBase className="font-semibold text-text-muted-title">
                    Telemetry settings
                  </TypoBase>
                  <Switch
                    checked={isTelemetryEnabled}
                    onCheckedChange={setIsTelemetryEnabled}
                  />
                </div>
                <TypoBase className="text-text-placeholder">
                  Share usage data anonymously
                </TypoBase>
                <div className="font-[400] text-[12px] leading-[15px] text-text-info">
                  For detailed information about what data is being shared,{" "}
                  <span
                    className="text-secondary-normal cursor-pointer"
                    onClick={() => {
                      setSettingPageLevel(SettingPageLevel.detail);
                      setLegalPage(LegalPageType.privacyPolicy);
                    }}
                  >
                    [click here]
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="my-[32px] flex flex-col gap-8 text-text-muted-title">
            <TypoXLarge className="font-semibold text-text-muted-title">
              Support & Community
            </TypoXLarge>

            <div
              className="flex items-center text-text-muted-title justify-between cursor-pointer"
              onClick={() =>
                openInNewTab("https://docs.astrsk.ai/")
              }
            >
              <TypoBase className="font-semibold text-text-muted-title">
                User manual
              </TypoBase>
            </div>

            <div
              className="flex items-center text-text-muted-title justify-between cursor-pointer"
              onClick={() => openInNewTab("https://join.astrsk.ai")}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                About astrsk.ai
              </TypoBase>
            </div>

            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setSettingPageLevel(SettingPageLevel.sub)}
            >
              <TypoBase className="font-semibold text-text-muted-title">
                Legal
              </TypoBase>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </div>

            <div
              className="flex items-center text-text-muted-title justify-between cursor-pointer"
              onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
            >
              <div className="flex items-center gap-2">
                <SvgIcon name="discord" className="h-5 w-5 text-[#5865F2]" />
                <TypoBase className="font-semibold text-text-muted-title">
                  Join our Discord
                </TypoBase>
              </div>
            </div>

            <div
              className="flex items-center text-text-muted-title justify-between cursor-pointer"
              onClick={() => {
                openInNewTab("https://www.reddit.com/r/astrsk_ai/");
              }}
            >
              <div className="flex items-center gap-2">
                <SvgIcon
                  name="reddit_color"
                  className="h-5 w-5 text-orange-500"
                />
                <TypoBase className="font-semibold text-text-muted-title">
                  Visit our Reddit
                </TypoBase>
              </div>
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>
    </div>
  );
};

interface SettingPageMobileProps {
  className?: string;
}

export default function SettingPageMobile({
  className,
}: SettingPageMobileProps) {
  const { settingPageLevel, setSettingPageLevel, legalPage, setLegalPage } =
    useAppStore();

  const renderCurrentPage = () => {
    switch (settingPageLevel) {
      case SettingPageLevel.detail:
        return (
          <LegalDetailPageMobile
            setSettingPageLevel={setSettingPageLevel}
            legalPage={legalPage}
          />
        );
      case SettingPageLevel.sub:
        return (
          <LegalPageMobile
            setSettingPageLevel={setSettingPageLevel}
            setLegalPage={setLegalPage}
          />
        );
      case SettingPageLevel.main:
      default:
        return <MainPageMobile setSettingPageLevel={setSettingPageLevel} />;
    }
  };

  return <div className={className}>{renderCurrentPage()}</div>;
}
