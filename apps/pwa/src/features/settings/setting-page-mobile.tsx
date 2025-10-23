import { ChevronLeft, ChevronRight } from "lucide-react";

import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
import {
  SettingDetailPageType,
  SettingPageLevel,
  useAppStore,
} from "@/app/stores/app-store";
import {
  ContentPolicy,
  PrivacyPolicy,
  RefundPolicy,
  TermsOfService as TermOfService,
  OssNotice,
} from "@/features/settings/legal";
import { SvgIcon } from "@/shared/ui/svg-icon";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Typo2XLarge, TypoBase, TypoXLarge } from "@/shared/ui/typo";
import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";

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
    <div className="bg-background-surface-2 flex h-dvh flex-col">
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
          <div className="text-text-muted-title mb-12 flex flex-col gap-8">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                setLegalPage(SettingDetailPageType.privacyPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Privacy Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                setLegalPage(SettingDetailPageType.termOfService);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Term of Use
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                setLegalPage(SettingDetailPageType.contentPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Content Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                setLegalPage(SettingDetailPageType.refundPolicy);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Refund Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                setLegalPage(SettingDetailPageType.ossNotice);
                setSettingPageLevel(SettingPageLevel.detail);
              }}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Open-source Software Notice
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
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
    <div className="bg-background-surface-2 flex h-dvh flex-col">
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
          <div className="[&>div]:!static [&>div]:!inset-auto [&>div]:!z-auto [&>div]:!mx-0 [&>div]:!max-w-none [&>div]:!overflow-visible [&>div]:!pt-0">
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
    <div className="bg-background-surface-2 flex h-dvh flex-col">
      {/* Header */}
      <TopNavigation title="Settings" onMenuClick={() => setIsOpen(true)} />

      <ScrollArea className="flex-1">
        <div className="mx-auto my-6 w-full max-w-[587px] px-4">
          <div className="text-text-muted-title mb-[32px] flex flex-col gap-8">
            <TypoXLarge className="text-text-muted-title font-semibold">
              App Preferences
            </TypoXLarge>

            <div className="flex items-center justify-between"></div>
          </div>

          <Separator />

          <div className="text-text-muted-title my-[32px] flex flex-col gap-8">
            <TypoXLarge className="text-text-muted-title font-semibold">
              Support & Community
            </TypoXLarge>

            <div
              className="text-text-muted-title flex cursor-pointer items-center justify-between"
              onClick={() => openInNewTab("https://docs.astrsk.ai/")}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                User documentation
              </TypoBase>
            </div>

            <div
              className="text-text-muted-title flex cursor-pointer items-center justify-between"
              onClick={() => openInNewTab("https://astrsk.ai")}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                About astrsk.ai
              </TypoBase>
            </div>

            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setSettingPageLevel(SettingPageLevel.sub)}
            >
              <TypoBase className="text-text-muted-title font-semibold">
                Legal
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>

            <div
              className="text-text-muted-title flex cursor-pointer items-center justify-between"
              onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
            >
              <div className="flex items-center gap-2">
                <SvgIcon name="discord" className="h-5 w-5 text-[#5865F2]" />
                <TypoBase className="text-text-muted-title font-semibold">
                  Join our Discord
                </TypoBase>
              </div>
            </div>

            <div
              className="text-text-muted-title flex cursor-pointer items-center justify-between"
              onClick={() => {
                openInNewTab("https://www.reddit.com/r/astrsk_ai/");
              }}
            >
              <div className="flex items-center gap-2">
                <SvgIcon
                  name="reddit_color"
                  className="h-5 w-5 text-orange-500"
                />
                <TypoBase className="text-text-muted-title font-semibold">
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
  const {
    settingPageLevel,
    setSettingPageLevel,
    settingDetailPage,
    setSettingDetailPage,
  } = useAppStore();

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
