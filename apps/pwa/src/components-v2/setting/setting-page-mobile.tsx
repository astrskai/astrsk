import { ChevronLeft, ChevronRight } from "lucide-react";

import { useMobileNavigation } from "@/App";
import {
  SettingDetailPageType,
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
  setLegalPage: (value: SettingDetailPageType) => void;
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
                setLegalPage(SettingDetailPageType.privacyPolicy);
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
                setLegalPage(SettingDetailPageType.termOfService);
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
                setLegalPage(SettingDetailPageType.contentPolicy);
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
                setLegalPage(SettingDetailPageType.refundPolicy);
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
                setLegalPage(SettingDetailPageType.ossNotice);
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
  legalPage: SettingDetailPageType;
}) => {
  const getTitleByLegalPage = (type: SettingDetailPageType) => {
    switch (type) {
      case SettingDetailPageType.privacyPolicy:
        return "Privacy Policy";
      case SettingDetailPageType.termOfService:
        return "Term of Use";
      case SettingDetailPageType.contentPolicy:
        return "Content Policy";
      case SettingDetailPageType.refundPolicy:
        return "Refund Policy";
      case SettingDetailPageType.ossNotice:
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
            {legalPage === SettingDetailPageType.refundPolicy ? (
              <RefundPolicy />
            ) : legalPage === SettingDetailPageType.privacyPolicy ? (
              <PrivacyPolicy />
            ) : legalPage === SettingDetailPageType.termOfService ? (
              <TermOfService />
            ) : legalPage === SettingDetailPageType.contentPolicy ? (
              <ContentPolicy />
            ) : legalPage === SettingDetailPageType.ossNotice ? (
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
  const { settingPageLevel, setSettingPageLevel, settingDetailPage, setSettingDetailPage } =
    useAppStore();

  const renderCurrentPage = () => {
    switch (settingPageLevel) {
      case SettingPageLevel.detail:
        return (
          <LegalDetailPageMobile
            setSettingPageLevel={setSettingPageLevel}
            legalPage={settingDetailPage}
          />
        );
      case SettingPageLevel.sub:
        return (
          <LegalPageMobile
            setSettingPageLevel={setSettingPageLevel}
            setLegalPage={setSettingDetailPage}
          />
        );
      case SettingPageLevel.main:
      default:
        return <MainPageMobile setSettingPageLevel={setSettingPageLevel} />;
    }
  };

  return <div className={className}>{renderCurrentPage()}</div>;
}
