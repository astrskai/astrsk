import { Page, useAppStore } from "@/app/stores/app-store";
import { TypoBase, TypoXLarge } from "@/components-v2/typo";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { api } from "@/convex";
import { Datetime } from "@/shared/utils";
import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

function formatCreditNumber(num: number): string {
  return num.toLocaleString();
}

const SubscriptionSection = () => {
  const setActivePage = useAppStore.use.setActivePage();
  const navigate = useNavigate();

  const subscription = useQuery(api.payment.public.getSubscription);
  const balance = useQuery(api.credit.public.getCreditBalance);

  return (
    <div className="text-text-primary mb-12 flex flex-col gap-8">
      <TypoXLarge className="text-text-primary font-semibold">
        Subscription
      </TypoXLarge>

      {subscription && balance ? (
        <>
          <div className="flex flex-col gap-[16px]">
            <div className="text-text-body text-[16px] leading-[25.6px] font-[600]">
              Current plan
            </div>
            <div className="flex flex-col gap-[8px]">
              <div className="text-text-placeholder text-[14px] leading-[20px] font-[700]">
                {subscription.name}
              </div>
              <div className="text-text-placeholder text-[14px] leading-[20px] font-[500]">
                Next billing date:{" "}
                {subscription.next_billing_date
                  ? Datetime(subscription.next_billing_date).format(
                      "MMMM D, YYYY",
                    )
                  : "-"}
              </div>
              <div className="text-text-placeholder text-[12px] leading-[15px] font-[400]">
                Plan renews every month - $18.00/month
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[16px]">
            <div className="text-text-body text-[16px] leading-[25.6px] font-[600]">
              Credits remaining
            </div>
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-row items-center gap-[8px] text-[14px] leading-[20px] font-[500]">
                <div className="text-text-placeholder">Subscription</div>
                <div className="text-text-primary font-[600]">
                  {formatCreditNumber(balance.subscription_balance ?? 0)}
                </div>
                <div className="text-text-subtle ml-[-4px]">
                  / {formatCreditNumber(subscription.reserved_credits)}
                </div>
              </div>
              <div className="flex flex-row items-center gap-[8px] text-[14px] leading-[20px] font-[500]">
                <div className="text-text-placeholder">Additional</div>
                <div className="text-text-primary font-[600]">
                  {formatCreditNumber(balance.additional_balance ?? 0)}
                </div>
                {/* <Button size="sm" variant="secondary">
                  Buy more credits
                </Button> */}
              </div>
              {balance.overdraft_amount !== 0 && (
                <div className="flex flex-row items-center gap-[8px] text-[14px] leading-[20px] font-[500]">
                  <div className="text-text-placeholder">Overdraft</div>
                  <div className="text-text-primary font-[600]">
                    {formatCreditNumber(balance.overdraft_amount)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => {
              navigate({ to: "/settings/account/credit-usage" });
            }}
          >
            <TypoBase className="text-text-body font-semibold">
              Credit usage history
            </TypoBase>
            <ChevronRight className="text-text-secondary h-5 w-5" />
          </div>
        </>
      ) : (
        <>
          <button
            className="text-button-background-primary py-[4px] text-left text-[16px] leading-[25.6px] font-[600]"
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
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="font-600 text-text-body mb-[54px] text-[24px] leading-[40px]">
          Account and subscription
        </div>

        <div className="text-text-primary mb-12 flex flex-col gap-8">
          <TypoXLarge className="text-text-primary font-semibold">
            Account
          </TypoXLarge>

          <div className="flex flex-row items-center gap-[8px]">
            <div className="grid size-[40px] place-items-center overflow-hidden rounded-full">
              {user?.hasImage ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${user.imageUrl}')` }}
                ></div>
              ) : (
                <div className="h-full w-full bg-[url(/img/placeholder/avatar.png)] bg-size-[60px] bg-center" />
              )}
            </div>
            <div className="text-text-placeholder text-[14px] leading-[20px] font-[500]">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>

          <button
            className="text-status-destructive-light py-[4px] text-left text-[16px] leading-[25.6px] font-[600]"
            onClick={() => {
              signOut();
              navigate({ to: "/settings", replace: true });
            }}
          >
            Sign out
          </button>
        </div>

        <div className="border-border-dark my-[40px] border-b" />

        <SubscriptionSection />
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
};

export { AccountPage };
