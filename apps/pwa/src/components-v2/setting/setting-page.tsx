import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  SettingDetailPageType,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/app/stores/app-store";
import { useSupermemoryDebugStore } from "@/app/stores/supermemory-debug-store";
import { ConvexReady } from "@/components-v2/convex-ready";
import { cn } from "@/components-v2/lib/utils";
import { AccountPage } from "@/components-v2/setting/account-page";
import ContentPolicy from "@/components-v2/setting/content-policy";
import CreditUsagePage from "@/components-v2/setting/credit-usage-page";
import ModelPage from "@/components-v2/setting/model-page";
import OssNotice from "@/components-v2/setting/oss-notice";
import PrivacyPolicy from "@/components-v2/setting/privacy-policy";
import RefundPolicy from "@/components-v2/setting/refund-policy";
import TermOfService from "@/components-v2/setting/terms-of-service";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Typo2XLarge, TypoBase, TypoXLarge } from "@/components-v2/typo";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Separator } from "@/components-v2/ui/separator";
import { Switch } from "@/components-v2/ui/switch";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuth, useSignUp } from "@clerk/clerk-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const LegalPage = ({
  setSettingPageLevel,
  setLegalPage,
}: {
  setSettingPageLevel: (value: SettingPageLevel) => void;
  setLegalPage: (value: SettingDetailPageType) => void;
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="mb-12 flex flex-col gap-8 text-text-body">
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setLegalPage(SettingDetailPageType.privacyPolicy);
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
              setLegalPage(SettingDetailPageType.termOfService);
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
              setLegalPage(SettingDetailPageType.contentPolicy);
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
              setLegalPage(SettingDetailPageType.refundPolicy);
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
              setLegalPage(SettingDetailPageType.ossNotice);
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

const AdvancedPage = () => {
  const [allowInsecureContent, setAllowInsecureContent] = useState(false);
  const isSupermemoryDebugEnabled = useSupermemoryDebugStore.use.isDebugEnabled();
  const setIsSupermemoryDebugEnabled = useSupermemoryDebugStore.use.setIsDebugEnabled();
  const setIsPanelOpen = useSupermemoryDebugStore.use.setIsPanelOpen();

  useEffect(() => {
    const getConfigs = async () => {
      if (!window.api?.config) {
        return;
      }
      setAllowInsecureContent(
        await window.api.config.getConfig("allowInsecureContent"),
      );
    };
    getConfigs();
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Advanced Preferences
          </TypoXLarge>

          <div className="flex justify-between">
            <div className="flex flex-col gap-[8px]">
              <TypoBase className="font-semibold text-text-body">
                Allow HTTP connection
              </TypoBase>
              <div className="font-[400] text-[12px] leading-[15px] text-text-info">
                Enable this option if you want to connect providers serving on
                non-local devices via HTTP.
                <br />
                This option will take effect after the app restarts.
                <br />
                <span className="text-status-destructive-light">
                  Allowing HTTP connection lowers the security level of the app.
                </span>
              </div>
            </div>
            <Switch
              checked={allowInsecureContent}
              onCheckedChange={(checked) => {
                setAllowInsecureContent(checked);
                if (!window.api?.config) {
                  return;
                }
                window.api.config.setConfig("allowInsecureContent", checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex justify-between">
            <div className="flex flex-col gap-[8px]">
              <TypoBase className="font-semibold text-text-body">
                Supermemory Debug Mode
              </TypoBase>
              <div className="font-[400] text-[12px] leading-[15px] text-text-info">
                Enable detailed debugging for roleplay memory system.
                <br />
                Shows data flow: initialization, retrieval, World Agent execution, and distribution.
                <br />
                <button
                  className="text-text-link underline cursor-pointer"
                  onClick={() => {
                    if (isSupermemoryDebugEnabled) {
                      setIsPanelOpen(true);
                    } else {
                      toast.info("Enable debug mode first to view the panel");
                    }
                  }}
                >
                  Open debug panel
                </button>
              </div>
            </div>
            <Switch
              checked={isSupermemoryDebugEnabled}
              onCheckedChange={(checked) => {
                setIsSupermemoryDebugEnabled(checked);
                if (checked) {
                  toast.success("Supermemory debug mode enabled");
                } else {
                  toast.info("Supermemory debug mode disabled");
                }
              }}
            />
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

  // Sign up with SSO
  const { userId } = useAuth();
  const { isLoaded: isLoadedSignUp, signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const signUpWithDiscord = useCallback(() => {
    // Check sign up is loaded
    if (!isLoadedSignUp) {
      return;
    }

    // Check already signed in
    if (userId) {
      toast.info("You already signed in");
      return;
    }

    try {
      // Try to sign up with google
      setIsLoading(true);
      signUp.authenticateWithRedirect({
        strategy: "oauth_discord",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      setIsLoading(false);
      logger.error(error);
      toast.error("Failed to sign up", {
        description: JSON.stringify(error),
      });
    }
  }, [isLoadedSignUp, signUp, userId]);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 pb-6 w-full max-w-[587px] pt-[80px]">
        <Typo2XLarge className="mb-12 text-text-primary font-semibold">
          Settings
        </Typo2XLarge>

        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            App Preferences
          </TypoXLarge>

          <ConvexReady>
            <Authenticated>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setSettingPageLevel(SettingPageLevel.sub);
                  setSettingSubPage(SettingSubPageType.account);
                }}
              >
                <TypoBase className="font-semibold text-text-body">
                  Account and subscription
                </TypoBase>
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              </div>
            </Authenticated>
            <Unauthenticated>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  signUpWithDiscord();
                }}
              >
                <TypoBase className="font-semibold text-text-body">
                  Sign in
                </TypoBase>
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              </div>
            </Unauthenticated>
          </ConvexReady>

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
            onClick={() => openInNewTab("https://docs.astrsk.ai/")}
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
        <div className="my-13 flex flex-col gap-8 text-text-primary">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              setSettingPageLevel(SettingPageLevel.sub);
              setSettingSubPage(SettingSubPageType.advanced);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Advanced Preferences
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
        </div>
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
        label={
          settingPageLevel === SettingPageLevel.sub
            ? "Settings"
            : settingDetailPage === SettingDetailPageType.creditUsage
              ? "Account and subscription"
              : "Legal"
        }
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
        {settingSubPage === SettingSubPageType.advanced && <AdvancedPage />}
        <ConvexReady>
          {settingSubPage === SettingSubPageType.account && <AccountPage />}
        </ConvexReady>
      </div>

      {/* Page Level 3 */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out translate-x-full",
          settingPageLevel === SettingPageLevel.detail && "translate-x-0",
        )}
      >
        {settingDetailPage === SettingDetailPageType.refundPolicy && (
          <RefundPolicy />
        )}
        {settingDetailPage === SettingDetailPageType.privacyPolicy && (
          <PrivacyPolicy />
        )}
        {settingDetailPage === SettingDetailPageType.termOfService && (
          <TermOfService />
        )}
        {settingDetailPage === SettingDetailPageType.contentPolicy && (
          <ContentPolicy />
        )}
        {settingDetailPage === SettingDetailPageType.ossNotice && <OssNotice />}
        <ConvexReady>
          {settingDetailPage === SettingDetailPageType.creditUsage && (
            <CreditUsagePage />
          )}
        </ConvexReady>
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
}
