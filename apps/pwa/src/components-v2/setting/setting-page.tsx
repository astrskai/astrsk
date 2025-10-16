import { useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  SettingDetailPageType,
  SettingPageLevel,
  useAppStore,
} from "@/app/stores/app-store";
import { ConvexReady } from "@/components-v2/convex-ready";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Typo2XLarge, TypoBase, TypoXLarge } from "@/components-v2/typo";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Separator } from "@/components-v2/ui/separator";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuth, useSignUp } from "@clerk/clerk-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SettingsMain = () => {
  // Providers
  const navigate = useNavigate();

  // Sign up with SSO
  const { userId } = useAuth();
  const { isLoaded: isLoadedSignUp, signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);

  const signUpWithDiscord = useCallback(async () => {
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

      await signUp.authenticateWithRedirect({
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

  const onClickAccount = () => {
    navigate({ to: "/settings/account" });
  };

  const onClickProviders = () => {
    navigate({ to: "/settings/providers" });
  };

  const onClickLegal = () => {
    navigate({ to: "/settings/legal" });
  };

  const onClickAdvanced = () => {
    navigate({ to: "/settings/advanced" });
  };

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px] pb-6">
        <Typo2XLarge className="text-text-primary mb-12 font-semibold">
          Settings
        </Typo2XLarge>

        <div className="text-text-primary mb-12 flex flex-col gap-8">
          <TypoXLarge className="text-text-primary font-semibold">
            App Preferences
          </TypoXLarge>

          {/** disabled subscribe */}
          {/* <ConvexReady>
            <Authenticated>
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={onClickAccount}
              >
                <TypoBase className="text-text-body font-semibold">
                  Account and subscription
                </TypoBase>
                <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
              </div>
            </Authenticated>
            <Unauthenticated>
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => {
                  signUpWithDiscord();
                }}
              >
                <TypoBase className="text-text-body font-semibold">
                  Sign in
                </TypoBase>
                <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
              </div>
            </Unauthenticated>
          </ConvexReady> */}

          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={onClickProviders}
          >
            <TypoBase className="text-text-body font-semibold">
              Providers
            </TypoBase>
            <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
          </div>
        </div>
        <Separator />
        <div className="text-text-primary my-13 flex flex-col gap-8">
          <TypoXLarge className="text-text-primary font-semibold">
            Community
          </TypoXLarge>

          <div
            className="text-text-body flex cursor-pointer items-center justify-between"
            onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
          >
            <div className="flex items-center gap-2">
              <SvgIcon name="discord" className="h-5 w-5 text-[#5865F2]" />
              <TypoBase className="text-text-body font-semibold">
                Join our Discord
              </TypoBase>
            </div>
          </div>

          <div
            className="text-text-body flex cursor-pointer items-center justify-between"
            onClick={() => {
              openInNewTab("https://www.reddit.com/r/astrsk_ai/");
            }}
          >
            <div className="flex items-center gap-2">
              <SvgIcon
                name="reddit_color"
                className="h-5 w-5 text-orange-500"
              />
              <TypoBase className="text-text-body font-semibold">
                Visit our Reddit
              </TypoBase>
            </div>
          </div>
        </div>
        <Separator />
        <div className="text-text-primary my-13 flex flex-col gap-8">
          <TypoXLarge className="text-text-primary font-semibold">
            Support
          </TypoXLarge>

          <div
            className="text-text-body flex cursor-pointer items-center justify-between"
            onClick={() => openInNewTab("https://docs.astrsk.ai/")}
          >
            <TypoBase className="text-text-body font-semibold">
              User manual
            </TypoBase>
          </div>

          <div
            className="text-text-body flex cursor-pointer items-center justify-between"
            onClick={() => openInNewTab("https://join.astrsk.ai")}
          >
            <TypoBase className="text-text-body font-semibold">
              About astrsk.ai
            </TypoBase>
          </div>

          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={onClickLegal}
          >
            <TypoBase className="text-text-body font-semibold">Legal</TypoBase>
            <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
          </div>
        </div>
        <Separator />
        <div className="text-text-primary my-13 flex flex-col gap-8">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={onClickAdvanced}
          >
            <TypoBase className="text-text-body font-semibold">
              Advanced Preferences
            </TypoBase>
            <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
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
  const settingDetailPage = useAppStore.use.settingDetailPage();

  const location = useLocation();
  const isSettingsMainPage = location.pathname === "/settings";

  return (
    <ScrollArea className={cn("bg-background-surface-1 h-full", className)}>
      <FloatingActionButton
        icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
        label={
          settingPageLevel === SettingPageLevel.sub
            ? "Settings"
            : settingDetailPage === SettingDetailPageType.creditUsage
              ? "Account and subscription"
              : "Legal"
        }
        position="top-left"
        className={cn(
          "opacity-100 transition-opacity duration-[600ms] ease-in-out",
          isSettingsMainPage && "pointer-events-none opacity-0",
        )}
        onClick={() => {
          if (settingPageLevel === SettingPageLevel.detail) {
            setSettingPageLevel(SettingPageLevel.sub);
          } else {
            setSettingPageLevel(SettingPageLevel.main);
          }
        }}
      />

      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[600ms] ease-in-out",
        )}
      >
        <SettingsMain />
      </div>

      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
}
