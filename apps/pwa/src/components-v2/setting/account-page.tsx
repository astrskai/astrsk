import {
  Page,
  SettingDetailPageType,
  SettingPageLevel,
  useAppStore,
} from "@/app/stores/app-store";
import { TypoBase, TypoXLarge } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { api } from "@/convex";
import { Datetime, logger } from "@/shared/utils";
import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";

function formatCreditNumber(num: number): string {
  return num.toLocaleString();
}

const SubscriptionSection = () => {
  const setActivePage = useAppStore.use.setActivePage();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setSettingDetailPage = useAppStore.use.setSettingDetailPage();

  const subscription = useQuery(api.payment.public.getSubscription);
  const balance = useQuery(api.credit.public.getCreditBalance);

  // Free subscription
  const startFreeSubscription = useMutation(
    api.payment.public.startFreeSubscription,
  );
  useEffect(() => {
    if (subscription) {
      return;
    }
    (async () => {
      const result = await startFreeSubscription();
      logger.debug(
        result
          ? "Success to start free subscription"
          : "Failed to start free subscription",
      );
    })();
  }, [startFreeSubscription, subscription]);

  return (
    <div className="mb-12 flex flex-col gap-8 text-text-primary">
      <TypoXLarge className="font-semibold text-text-primary">
        Subscription
      </TypoXLarge>

      {subscription && balance ? (
        <>
          <div className="flex flex-col gap-[16px]">
            <div className="text-[16px] leading-[25.6px] text-text-body font-[600]">
              Current plan
            </div>
            <div className="flex flex-col gap-[8px]">
              <div className="text-[14px] leading-[20px] text-text-placeholder font-[700]">
                {subscription.name}
              </div>
              <div className="text-[14px] leading-[20px] text-text-placeholder font-[500]">
                Next billing date: {subscription.next_billing_date ? Datetime(subscription.next_billing_date).format("MMMM D, YYYY") : "-"}
              </div>
              <div className="text-[12px] leading-[15px] text-text-placeholder font-[400]">
                Plan renews every month - $15.00/month
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[16px]">
            <div className="text-[16px] leading-[25.6px] text-text-body font-[600]">
              Credits remaining
            </div>
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-row gap-[8px] items-center text-[14px] leading-[20px] font-[500]">
                <div className="text-text-placeholder">Subscription</div>
                <div className="text-text-primary font-[600]">
                  {formatCreditNumber(balance.subscription_balance ?? 0)}
                </div>
                <div className="text-text-subtle ml-[-4px]">
                  / {formatCreditNumber(subscription.reserved_credits)}
                </div>
              </div>
              <div className="flex flex-row gap-[8px] items-center text-[14px] leading-[20px] font-[500]">
                <div className="text-text-placeholder">Additional</div>
                <div className="text-text-primary font-[600]">
                  {formatCreditNumber(balance.additional_balance ?? 0)}
                </div>
                <Button size="sm" variant="secondary">
                  Buy more credits
                </Button>
              </div>
              {balance.overdraft_amount !== 0 && (
                <div className="flex flex-row gap-[8px] items-center text-[14px] leading-[20px] font-[500]">
                  <div className="text-text-placeholder">Overdraft</div>
                  <div className="text-text-primary font-[600]">
                    {formatCreditNumber(balance.overdraft_amount)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="flex items-center  justify-between cursor-pointer"
            onClick={() => {
              setSettingPageLevel(SettingPageLevel.detail);
              setSettingDetailPage(SettingDetailPageType.creditUsage);
            }}
          >
            <TypoBase className="font-semibold text-text-body">
              Credit usage history
            </TypoBase>
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
        </>
      ) : (
        <>
          <button
            className="text-left py-[4px] text-button-background-primary text-[16px] leading-[25.6px] font-[600]"
            onClick={() => {
              setActivePage(Page.Subscribe);
            }}
          >
            Subscribe to astrsk+
          </button>
        </>
      )}
    </div>
  );
};

const AccountPage = () => {
  const { signOut, user } = useClerk();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="mb-[54px] font-600 text-[24px] leading-[40px] text-text-body">
          Account and subscription
        </div>

        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Account
          </TypoXLarge>

          <div className="flex flex-row items-center gap-[8px]">
            <div className="size-[40px] rounded-full grid place-items-center overflow-hidden">
              {user?.hasImage ? (
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url('${user.imageUrl}')` }}
                ></div>
              ) : (
                <div className="w-full h-full bg-[url(/img/placeholder/avatar.png)] bg-center bg-size-[60px]" />
              )}
            </div>
            <div className="text-[14px] leading-[20px] font-[500] text-text-placeholder">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>

          <button
            className="text-left py-[4px] text-status-destructive-light text-[16px] leading-[25.6px] font-[600]"
            onClick={() => {
              signOut();
              setSettingPageLevel(SettingPageLevel.main);
            }}
          >
            Sign out
          </button>
        </div>

        <div className="my-[40px] border-b border-border-dark" />

        <SubscriptionSection />
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
};

export { AccountPage };
