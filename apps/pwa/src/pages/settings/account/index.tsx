import { Page, useAppStore } from "@/shared/stores/app-store";
import { api } from "@/convex";
import { Datetime } from "@/shared/lib";
import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight, LogOut, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ConvexReady } from "@/shared/ui/convex-ready";

function formatCreditNumber(num: number): string {
  return num.toLocaleString();
}

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-fg-subtle">
    {title}
  </h3>
);

const SubscriptionSection = () => {
  const setActivePage = useAppStore.use.setActivePage();
  const navigate = useNavigate();

  const subscription = useQuery(api.payment.public.getSubscription);
  const balance = useQuery(api.credit.public.getCreditBalance);

  if (!subscription || !balance) {
    return (
      <section>
        <SectionTitle title="Subscription" />
        <div className="rounded-2xl border border-border-default bg-surface-raised p-4">
          <button
            className="text-sm font-semibold text-brand-400 hover:text-brand-500"
            onClick={() => setActivePage(Page.Subscribe)}
          >
            Subscribe to astrsk+
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionTitle title="Subscription" />
      <div className="rounded-2xl border border-border-default bg-surface-raised">
        {/* Current Plan */}
        <div className="border-b border-border-default p-4">
          <div className="text-sm font-semibold text-fg-default">
            Current plan
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-sm font-bold text-fg-muted">
              {subscription.name}
            </div>
            <div className="text-xs text-fg-subtle">
              Next billing date:{" "}
              {subscription.next_billing_date
                ? Datetime(subscription.next_billing_date).format("MMMM D, YYYY")
                : "-"}
            </div>
            <div className="text-xs text-fg-subtle">
              Plan renews every month - $18.00/month
            </div>
          </div>
        </div>

        {/* Credits Remaining */}
        <div className="border-b border-border-default p-4">
          <div className="text-sm font-semibold text-fg-default">
            Credits remaining
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fg-subtle">Subscription</span>
              <span className="font-semibold text-fg-default">
                {formatCreditNumber(balance.subscription_balance ?? 0)}
              </span>
              <span className="text-fg-subtle">
                / {formatCreditNumber(subscription.reserved_credits)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fg-subtle">Additional</span>
              <span className="font-semibold text-fg-default">
                {formatCreditNumber(balance.additional_balance ?? 0)}
              </span>
            </div>
            {balance.overdraft_amount !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-fg-subtle">Overdraft</span>
                <span className="font-semibold text-fg-default">
                  {formatCreditNumber(balance.overdraft_amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Credit Usage History */}
        <button
          className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-overlay"
          onClick={() => navigate({ to: "/settings/account/credit-usage" })}
        >
          <span className="text-sm font-medium text-fg-default">
            Credit usage history
          </span>
          <ChevronRight
            size={16}
            className="text-fg-subtle transition-colors group-hover:text-fg-default"
          />
        </button>
      </div>
    </section>
  );
};

export default function AccountPage() {
  const { signOut, user } = useClerk();
  const navigate = useNavigate();

  return (
    <ConvexReady>
      <div className="space-y-8 py-8">
        {/* Account Section */}
        <section>
          <SectionTitle title="Account" />
          <div className="rounded-2xl border border-border-default bg-surface-raised">
            {/* User Info */}
            <div className="flex items-center gap-4 border-b border-border-default p-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-border-muted bg-surface-overlay">
                {user?.hasImage ? (
                  <img
                    src={user.imageUrl}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-fg-muted" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-fg-default">
                  {user?.fullName || "User"}
                </div>
                <div className="text-xs text-fg-subtle">
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <button
              className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-overlay"
              onClick={() => {
                signOut();
                navigate({ to: "/settings", replace: true });
              }}
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-status-error" />
                <span className="text-sm font-medium text-status-error">
                  Sign out
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Subscription Section */}
        <SubscriptionSection />
      </div>
    </ConvexReady>
  );
}
