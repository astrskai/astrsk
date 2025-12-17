import { useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";
import {
  Button,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { IconDiscord } from "@/shared/assets/icons";
import { api } from "@/convex";
import { logger } from "@/shared/lib/logger";
import { useAuth } from "@/shared/hooks/use-auth";
import { signInWithOAuth } from "@/shared/lib/auth-actions";
import { useMutation, useQuery } from "convex/react";
import { Ban, Bot, ChevronDown, Coins, UserRoundPlus, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess, toastInfo } from "@/shared/ui/toast";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SubscribePage = () => {
  const [isOpenCreditDetail, setIsOpenCreditDetail] = useState(false);

  // Check sign up available
  const isSignUpAvailable = useQuery(api.payment.public.getSignUpAvailable);
  const isSignUpAvailableLoading = typeof isSignUpAvailable === "undefined";

  // Sign up with SSO
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(false);

  const signUpWithDiscord = useCallback(() => {
    // Check already signed in
    if (isAuthenticated) {
      toastInfo("You already signed in");
      return;
    }

    // IMPORTANT: Safari blocks popups/redirects that don't happen synchronously
    // from a user gesture. We must call signInWithOAuth synchronously (no await before it).
    setIsLoading(true);

    signInWithOAuth("discord")
      .then(({ error }) => {
        if (error) {
          setIsLoading(false);
          toastError("Failed to sign up", { description: error });
        }
      })
      .catch((error) => {
        setIsLoading(false);
        logger.error(error);
        toastError("Failed to sign up", {
          description: String(error),
        });
      });
  }, [isAuthenticated]);

  // Open join server dialog
  const subscribed = useAppStore.use.subscribed();
  const [isOpenJoinServer, setIsOpenJoinServer] = useState(false);
  useEffect(() => {
    if (userId && !subscribed) {
      setIsOpenJoinServer(true);
    }
  }, [subscribed, userId]);

  // Verify and Start
  const claimFreeSubscriptionProcess = useQuery(
    api.payment.public.getClaimFreeSubscriptionProcess,
  );
  const claimFreeSubscription = useMutation(
    api.payment.public.claimFreeSubscription,
  );
  const deleteClaimFreeSubscriptionProcess = useMutation(
    api.payment.public.deleteClaimFreeSubscriptionProcess,
  );
  const backToReturnPage = useAppStore.use.backToReturnPage();
  useEffect(() => {
    if (!claimFreeSubscriptionProcess) {
      return;
    }
    switch (claimFreeSubscriptionProcess.result.status) {
      case "IN_PROCESS":
        // Do nothing
        break;

      case "SUCCESS":
        toastSuccess("Welcome aboard! Your subscription is now active.");
        deleteClaimFreeSubscriptionProcess();
        backToReturnPage();
        break;

      case "FAILED":
        switch (claimFreeSubscriptionProcess.result.code) {
          case "ALREADY_SUBSCRIBED":
            toastError("You are already signed in to astrsk+.");
            setIsOpenJoinServer(false);
            backToReturnPage();
            break;
          case "NO_DISCORD_ID":
            toastError("Please log in with Discord to access this feature.");
            break;
          case "NO_SERVER_MEMBER":
            toastError("Join our Discord server to join astrsk+.");
            break;
          default:
            toastError("Unknown code", {
              description: claimFreeSubscriptionProcess.result.code,
            });
        }
        deleteClaimFreeSubscriptionProcess();
        break;

      case "ERROR":
        toastError("Failed to start free subscription", {
          description: claimFreeSubscriptionProcess.result.error,
        });
        deleteClaimFreeSubscriptionProcess();
        break;
    }
  }, [
    backToReturnPage,
    claimFreeSubscriptionProcess,
    deleteClaimFreeSubscriptionProcess,
  ]);

  return (
    <div
      className={cn(
        "absolute inset-0 top-[var(--topbar-height)] z-40",
        "bg-[url('/img/subscription/bg-subscribe.jpg')] bg-cover bg-center",
      )}
    >
      {/* Close */}
      <button
        className="text-fg-subtle absolute top-[34px] right-[40px] z-50 cursor-pointer"
        onClick={() => {
          backToReturnPage();
        }}
      >
        <X size={40} />
      </button>

      <ScrollArea className="h-full">
        <div className="flex min-h-full flex-col items-center gap-[48px] py-[100px]">
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "px-[24px] py-[8px]",
                "to-accent-secondary rounded-full bg-gradient-to-r from-[#755DC2]",
                "text-fg-default text-[20px] leading-[24px] font-[600]",
              )}
            >
              Start with astrsk+
            </div>
            <div className="text-[36px] leading-[36px] font-[600]">
              The Easiest Way to Start a Truly Immersive Roleplay
            </div>
            <div className="text-fg-muted text-[20px] leading-[24px] font-[500]">
              Go Straight to Creating Your Ultimate Roleplay with AI Images &
              Videos!
            </div>
          </div>

          {/* Main */}
          <div className="grid grid-cols-2 place-items-center items-start gap-4">
            <div className="relative h-[452px] w-[712px] overflow-hidden rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
              <div className="flex h-full w-full flex-col justify-end rounded-[12px] bg-[url('/img/subscription/ai-image-gen.jpg')] bg-contain pb-[16px] text-center">
                <div className="mb-[16px] text-[72px] leading-[45px] font-[900] text-[#fff] uppercase">
                  AI Image Gen
                </div>
                <div className="text-fg-muted text-[14px] leading-[20px] font-[500]">
                  Create stunning visuals during roleplay sessions,
                  <br />
                  Generate memorable images for character & plot cards
                </div>
              </div>
            </div>
            <div className="relative h-[452px] w-[712px] overflow-hidden rounded-[12px] bg-gradient-to-br from-[#fff]/60 to-[#000] p-[1px]">
              <div className="flex h-full w-full flex-col justify-end rounded-[12px] bg-[url('/img/subscription/ai-video-gen.jpg')] bg-contain pb-[16px] text-center">
                <div className="mb-[16px] text-[72px] leading-[45px] font-[900] text-[#fff] uppercase">
                  AI Video Gen
                </div>
                <div className="text-fg-muted text-[14px] leading-[20px] font-[500]">
                  Free Your Characters from their PFP and Bring Them to Life!
                  <br />
                  <br />
                </div>
              </div>
            </div>
            <div
              className={cn(
                "w-[712px] rounded-[12px] px-[32px] py-[24px]",
                "bg-gradient-to-r from-[#313131]/50 to-[#313131]/0 backdrop-blur-lg",
                "flex flex-col gap-[16px]",
              )}
            >
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[600]">
                Other features
              </div>
              <div className="bg-border-emphasis h-[1px] w-full opacity-10" />
              <div className="flex flex-row gap-[16px]">
                <div className="bg-fg-default text-surface-overlay grid size-[32px] place-content-center rounded-[8px]">
                  <Zap size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-fg-default text-[16px] leading-[25.6px] font-[600]">
                    AI-Assisted Card Creation
                  </div>
                  <div className="text-fg-muted text-[14px] leading-[20px] font-[600]">
                    Say goodbye to writer&apos;s block. Create character card
                    and scenarios with LLM assistants!
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="bg-fg-default text-surface-overlay grid size-[32px] place-content-center rounded-[8px]">
                  <Bot size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="text-fg-default text-[16px] leading-[25.6px] font-[600]">
                    Automatic Allocation of the LLMs for Each Roleplay
                  </div>
                  <div className="text-fg-muted text-[14px] leading-[20px] font-[600]">
                    The optimal LLM is allocated for each workflow for prompt
                    and immersive response
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-[16px]">
                <div className="bg-fg-default text-surface-overlay grid size-[32px] place-content-center rounded-[8px]">
                  <Coins size={20} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="text-fg-default text-[16px] leading-[25.6px] font-[600]">
                      1,000 astrsk Credit per Month
                    </div>
                    <button
                      className="text-fg-muted"
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
                  <div className="text-fg-muted text-[14px] leading-[20px] font-[600]">
                    Use it in ANY AI-power features in astrsk and astrsk+
                  </div>
                  <div
                    className={cn(
                      "text-fg-subtle text-[14px] leading-[20px] font-[600]",
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
            <div className="flex w-[712px] flex-col gap-[16px]">
              <div
                className={cn(
                  "bg-[#111111]/50 px-[40px] py-[16px] backdrop-blur-xl",
                  "border-border-subtle rounded-[12px] border-[1px] shadow-2xl",
                  "flex flex-row items-center justify-between",
                )}
              >
                <div className="flex flex-row items-center gap-[4px] line-through">
                  <div className="text-fg-default text-[24px] leading-[40px] font-[600]">
                    $18.00 USD
                  </div>
                  <div className="text-fg-muted text-[16px] leading-[25.6px] font-[400]">
                    / month
                  </div>
                </div>
                <div className="text-fg-muted text-[16px] leading-[25.6px] font-[400]">
                  Regular Pricing
                </div>
              </div>
              {isSignUpAvailableLoading || isSignUpAvailable ? (
                <div
                  className={cn(
                    "rounded-[12px] bg-[#159BE2]/30 px-[40px] py-[16px] backdrop-blur-xl",
                    "border-border-focus border-[1px]",
                    "flex flex-col gap-[8px]",
                  )}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-[4px]">
                      <div className="text-fg-default text-[24px] leading-[40px] font-[600]">
                        First Month Free
                      </div>
                    </div>
                    <div className="text-fg-default text-[16px] leading-[25.6px] font-[400]">
                      (Early Access) Special Offer
                    </div>
                  </div>
                  <div className="text-fg-muted mb-[8px] text-[14px] leading-[20px] font-[500]">
                    <ul className="list-disc pl-5">
                      <li>Early access limited to first 100 users only</li>
                      <li>
                        Must be member of our Discord server to gain access
                      </li>
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
                    disabled={isLoading}
                    loading={isLoading || isSignUpAvailableLoading}
                  >
                    {!isLoading && <IconDiscord className="h-4 w-4" />}
                    Join our Discord server and start now
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "rounded-[12px] bg-[#B59EFF]/20 px-[40px] py-[16px] backdrop-blur-xl",
                    "border-accent-secondary border-[1px]",
                    "flex flex-col gap-[8px]",
                  )}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-[10px]">
                      <Ban size={24} />
                      <div className="text-fg-default text-[24px] leading-[40px] font-[600]">
                        Early Access FULL
                      </div>
                    </div>
                    <div className="text-fg-default text-[16px] leading-[25.6px] font-[400]">
                      Official Launch Waitlist
                    </div>
                  </div>
                  <div className="text-fg-muted mb-[8px] text-[14px] leading-[20px] font-[500]">
                    <ul className="list-disc pl-5">
                      <li>
                        Early access limited to first 100 users only{" "}
                        <b>→ 100/100 SPOTS FILLED ✓</b>
                      </li>
                      <li>
                        Join waitlist to receive notifications when new spots
                        open
                      </li>
                    </ul>
                  </div>
                  <Button
                    size="lg"
                    className="bg-accent-secondary text-fg-on-emphasis hover:bg-accent-secondary hover:text-fg-on-emphasis hover:brightness-80"
                    onClick={() => {
                      openInNewTab(
                        "https://docs.google.com/forms/d/e/1FAIpQLScgW_lXXSKd3WKy7ZJXmnFX4CGbukgZap0du6rCh1U2PHUfBw/viewform",
                      );
                    }}
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    {!isLoading && <UserRoundPlus size={16} />}
                    Get on the Waitlist
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Join Server Dialog */}
      <Dialog open={isOpenJoinServer}>
        <DialogContent hideClose className="min-w-[720px] outline-none">
          <DialogHeader>
            <DialogTitle>
              <div className="text-fg-default text-[24px] leading-[40px] font-[500]">
                Join the Community and Start Now!
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
                Join our Discord server, verify that you did, and enjoy astrsk+.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[8px]">
            <div className="flex flex-row items-center gap-[24px] rounded-[8px] bg-gradient-to-r from-[#2D2B59] to-[#5E5ABC] p-[24px]">
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
            <div className="flex flex-row items-center gap-[24px] rounded-[8px] bg-gradient-to-r from-[#2B1B41] to-[#6C46A4] p-[24px]">
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
                onClick={async () => {
                  const result = await claimFreeSubscription();
                  if (!result) {
                    toastError(
                      "Your session has expired. Please log in again to continue.",
                    );
                  }
                }}
                loading={
                  claimFreeSubscriptionProcess?.result.status === "IN_PROCESS"
                }
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
