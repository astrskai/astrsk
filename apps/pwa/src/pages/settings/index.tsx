import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Button,
  Separator,
  Typo2XLarge,
  TypoXLarge,
  TypoBase,
  SvgIcon,
} from "@/shared/ui";
import { TopNavigation } from "@/widgets/top-navigation";
import { MobileMenuDrawer } from "@/widgets/mobile-menu-drawer";
import { useEffect, useState } from "react";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function SettingsPage() {
  // 1. State hooks
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 2. Context hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on settings root or sub-route
  const isSettingsRoot = location.pathname === "/settings";

  // Close mobile menu when viewport changes to desktop size
  useEffect(() => {
    const handleResize = () => {
      // Close menu when viewport width is >= 768px (md breakpoint)
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  // 3. Event handlers
  const handleBack = () => {
    navigate({ to: "/settings" });
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

  {
    /** disabled subscribe */
  }
  // Sign up with SSO
  // const { userId } = useAuth();
  // const { isLoaded: isLoadedSignUp, signUp } = useSignUp();

  // const signUpWithDiscord = useCallback(async () => {
  //   // Check sign up is loaded
  //   if (!isLoadedSignUp) {
  //     return;
  //   }

  //   // Check already signed in
  //   if (userId) {
  //     toast.info("You already signed in");
  //     return;
  //   }

  //   try {
  //     // Try to sign up with google
  //     setIsLoading(true);

  //     await signUp.authenticateWithRedirect({
  //       strategy: "oauth_discord",
  //       redirectUrl: "/sso-callback",
  //       redirectUrlComplete: "/",
  //     });
  //   } catch (error) {
  //     setIsLoading(false);
  //     logger.error(error);
  //     toast.error("Failed to sign up", {
  //       description: JSON.stringify(error),
  //     });
  //   }
  // }, [isLoadedSignUp, signUp, userId]);

  // const onClickAccount = () => {
  //   navigate({ to: "/settings/account" });
  // };

  return (
    <>
      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />

      <div className="flex h-full flex-col overflow-hidden">
        {/* Mobile Header - only show on mobile (<768px) when on settings root */}
        {isSettingsRoot && (
          <div className="md:hidden">
            <TopNavigation
              title="Settings"
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />
          </div>
        )}

        {/* Mobile Sub-route Header with Back Button - only show on mobile when NOT on settings root */}
        {!isSettingsRoot && (
          <div className="md:hidden">
            <TopNavigation
              title="Settings"
              leftAction={
                <Button
                  variant="ghost_white"
                  size="icon"
                  className="h-[40px] w-[40px] p-[8px]"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              }
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-lg px-4 py-4 md:py-6 md:pt-20 md:pb-6">
            {/* Desktop title - hidden on mobile */}
            <Typo2XLarge className="text-text-primary mb-12 hidden font-semibold md:block">
              Settings
            </Typo2XLarge>

            {/* App Preferences Section */}
            <section className="mb-8 space-y-8 md:mb-12">
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
            </section>

            <Separator />

            {/* Community Section */}
            <section className="my-8 space-y-8 md:my-13">
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
            </section>

            <Separator />

            {/* Support Section */}
            <section className="my-8 space-y-8 md:my-13">
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
                <TypoBase className="text-text-body font-semibold">
                  Legal
                </TypoBase>
                <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
              </div>
            </section>

            <Separator />

            {/* Advanced Section */}
            <section className="my-8 space-y-8 md:my-13">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={onClickAdvanced}
              >
                <TypoBase className="text-text-body font-semibold">
                  Advanced Preferences
                </TypoBase>
                <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
