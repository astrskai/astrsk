import { Page, useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { api } from "@/convex";
import { logger } from "@/shared/utils/logger";
import { useAuth, useSignUp } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { Bot, ChevronDown, Coins, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SubscribePage = () => {
  const setActivePage = useAppStore.use.setActivePage();
  const [isOpenCreditDetail, setIsOpenCreditDetail] = useState(false);

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
        redirectUrlComplete: "/sso-callback",
      });
    } catch (error) {
      setIsLoading(false);
      logger.error(error);
      toast.error("Failed to sign up", {
        description: JSON.stringify(error),
      });
    }
  }, [isLoadedSignUp, signUp, userId]);

  // Open join server dialog
  const subscribed = useAppStore.use.subscribed();
  const [isOpenJoinServer, setIsOpenJoinServer] = useState(false);
  useEffect(() => {
    if (userId && !subscribed) {
      setIsOpenJoinServer(true);
    }
  }, [subscribed, userId]);

  // Verify and Start
  const claimFreeSubscription = useMutation(
    api.payment.public.claimFreeSubscription,
  );

  // Check subscribed
  useEffect(() => {
    if (!subscribed) {
      return;
    }
    toast.success("Welcome to astrsk+!");
    setActivePage(Page.Init);
  }, [setActivePage, subscribed]);

  return (
    <div
      className={cn(
        "z-40 absolute inset-0 top-[38px]",
        "bg-[url('/img/subscription/bg-subscribe.jpg')] bg-cover bg-center",
      )}
    >
      {/* Close */}
      <button
        className="absolute top-[34px] right-[40px] text-text-subtle z-50"
        onClick={() => {
          setActivePage(Page.Init);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      <ScrollArea className="h-full">
        <div className="min-h-full py-[100px] flex flex-col gap-[48px] items-center">
          {/* Header */}
          <div className="flex flex-col gap-4 items-center">
            <div
              className={cn(
                "px-[24px] py-[8px]",
                "rounded-full bg-gradient-to-r from-[#755DC2] to-secondary-normal",
                "text-[20px] leading-[24px] font-[600] text-text-primary",
              )}
            >
              Start with astrsk+
            </div>
            <div className="text-[36px] leading-[36px] font-[600]">
              The Easiest Way to Start a Truly Immersive Roleplay
            </div>
            <div className="text-[20px] leading-[24px] font-[500] text-text-body">
              Go Straight to Creating Your Ultimate Roleplay with AI Images &
              Videos!
            </div>
          </div>

          {/* Main */}
          <div className="grid grid-cols-2 gap-4 place-items-center items-start">
            <div className="relative w-[712px] h-[452px] rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px] overflow-hidden">
              <div className="w-full h-full rounded-[12px] bg-[url('/img/subscription/ai-image-gen.jpg')] bg-contain text-center pb-[16px] flex flex-col justify-end">
                <div className="font-[900] text-[72px] leading-[45px] text-[#fff] mb-[16px] uppercase">
                  AI Image Gen
                </div>
                <div className="font-[500] text-[14px] leading-[20px] text-text-body">
                  Create stunning visuals during roleplay sessions,
                  <br />
                  Generate memorable images for character & plot cards
                </div>
              </div>
            </div>
            <div className="relative w-[712px] h-[452px] rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px] overflow-hidden">
              <div className="w-full h-full rounded-[12px] bg-[url('/img/subscription/ai-video-gen.jpg')] bg-contain text-center pb-[16px] flex flex-col justify-end">
                <div className="font-[900] text-[72px] leading-[45px] text-[#fff] mb-[16px] uppercase">
                  AI Video Gen
                </div>
                <div className="font-[500] text-[14px] leading-[20px] text-text-body">
                  Free Your Characters from their PFP and Bring Them to Life!
                  <br />
                  <br />
                </div>
              </div>
            </div>
            <div
              className={cn(
                "w-[712px] px-[32px] py-[24px] rounded-[12px]",
                "bg-gradient-to-r from-[#313131]/50 to-[#313131]/0 backdrop-blur-lg",
                "flex flex-col gap-[16px]",
              )}
            >
              <div className="text-[16px] leading-[25.6px] font-[600] text-text-subtle">
                Other features
              </div>
              <div className="w-full h-[1px] bg-border-selected-inverse opacity-10" />
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-text-primary text-background-surface-3 grid place-content-center">
                  <Zap size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    AI-Assisted Card Creation
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-body">
                    Say goodbye to writer&apos;s block. Create character card
                    and scenarios with LLM assistants!
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-text-primary text-background-surface-3 grid place-content-center">
                  <Bot size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                    Automatic Allocation of the LLMs for Each Roleplay
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-body">
                    The optimal LLM is allocated for each workflow for prompt
                    and immersive response
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="size-[32px] rounded-[8px] bg-text-primary text-background-surface-3 grid place-content-center">
                  <Coins size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="flex flex-row gap-[8px] items-center justify-start">
                    <div className="font-[600] text-[16px] leading-[25.6px] text-text-primary">
                      1,000 astrsk Credit per Month
                    </div>
                    <button
                      className="text-text-body"
                      onClick={() => {
                        setIsOpenCreditDetail((isOpen) => !isOpen);
                      }}
                    >
                      <ChevronDown
                        size={20}
                        className={cn(isOpenCreditDetail && "rotate-180")}
                      />
                    </button>
                  </div>
                  <div className="font-[600] text-[14px] leading-[20px] text-text-body">
                    Use it in ANY AI-power features in astrsk and astrsk+
                  </div>
                  <div
                    className={cn(
                      "font-[600] text-[14px] leading-[20px] text-text-subtle",
                      !isOpenCreditDetail && "hidden",
                    )}
                  >
                    <b>Text Generation</b>
                    <br />
                    - Claude 4.0 Sonnet • DeepSeek V3 • Deepseek V3.1
                    <br />
                    - Gemini 2.5 Pro • Gemini 2.5 Flash • Gemini 2.5 Flash Lite
                    <br />
                    - GPT-5 Chat • GPT-5 • GPT-5 Mini • GPT-5 Nano
                    <br />
                    <br />
                    <b>Image Generation</b>
                    <br />
                    - Gemini 2.5 Flash Image (Nano Banana) • Seedream 4.0
                    <br />
                    <br />
                    <b>Video Generation</b>
                    <br />
                    - Seedance 1.0
                    <br />
                    <br />
                    <b>Usage Estimates</b>
                    <br />
                    - ~1,200 text outputs with DeepSeek V3
                    <br />- ~125 images with SeeDream 4.0
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[712px] flex flex-col gap-[16px]">
              <div
                className={cn(
                  "px-[40px] py-[16px] bg-[#111111]/50 backdrop-blur-xl",
                  "rounded-[12px] border-[1px] border-border-light shadow-2xl",
                  "flex flex-row justify-between items-center",
                )}
              >
                <div className="flex flex-row gap-[4px] items-center line-through">
                  <div className="text-[24px] leading-[40px] font-[600] text-text-primary">
                    $18.00 USD
                  </div>
                  <div className="text-[16px] leading-[25.6px] font-[400] text-text-body">
                    / month
                  </div>
                </div>
                <div className="text-[16px] leading-[25.6px] font-[400] text-text-body">
                  Regular Pricing
                </div>
              </div>
              <div
                className={cn(
                  "px-[40px] py-[16px] bg-[#159BE2]/30 backdrop-blur-xl rounded-[12px]",
                  "border-[1px] border-border-selected-secondary",
                  "flex flex-col gap-[8px]",
                )}
              >
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row gap-[4px] items-center">
                    <div className="text-[24px] leading-[40px] font-[600] text-text-primary">
                      First Month Free
                    </div>
                  </div>
                  <div className="text-[16px] leading-[25.6px] font-[400] text-text-primary">
                    (Early Access) Special Offer
                  </div>
                </div>
                <div className="text-[14px] leading-[20px] font-[500] text-text-body mb-[8px]">
                  <ul className="list-disc pl-5">
                    <li>Early access limited to first 100 users only</li>
                    <li>Must be member of our Discord server to gain access</li>
                  </ul>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    if (userId) {
                      setIsOpenJoinServer(true);
                    } else {
                      signUpWithDiscord();
                    }
                  }}
                  disabled={!isLoadedSignUp || isLoading}
                  loading={isLoading}
                >
                  {!isLoading && <SvgIcon name="discord" size={16} />}
                  Join our Discord server and start now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Join Server Dialog */}
      <Dialog open={isOpenJoinServer}>
        <DialogContent hideClose className="min-w-[720px] outline-none">
          <DialogHeader>
            <DialogTitle>
              <div className="font-[500] text-[24px] leading-[40px] text-text-primary">
                Join the Community and Start Now!
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="font-[400] text-[16px] leading-[25.6px] text-text-placeholder">
                Join our Discord server, verify that you did, and enjoy astrsk+.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[8px]">
            <div className="flex flex-row gap-[24px] items-center p-[24px] rounded-[8px] bg-gradient-to-r from-[#2D2B59] to-[#5E5ABC]">
              <img
                src="/img/subscription/subscribe-icon-1.png"
                className="size-[48px]"
              />
              <div className="grow text-[20px] leading-[24px] font-[600]">
                1. Be a Member of Our Discord Server
              </div>
              <Button
                size="lg"
                className="min-w-[139px]"
                onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
              >
                Join Server
              </Button>
            </div>
            <div className="flex flex-row gap-[24px] items-center p-[24px] rounded-[8px] bg-gradient-to-r from-[#2B1B41] to-[#6C46A4]">
              <img
                src="/img/subscription/subscribe-icon-2.png"
                className="size-[48px]"
              />
              <div className="grow text-[20px] leading-[24px] font-[600]">
                2. Verify Membership and Start
              </div>
              <Button
                size="lg"
                className="min-w-[139px]"
                onClick={() => claimFreeSubscription()}
              >
                Verify and Start
              </Button>
            </div>
          </div>
          <div className="flex flex-row justify-end gap-2">
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setIsOpenJoinServer(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { SubscribePage };
