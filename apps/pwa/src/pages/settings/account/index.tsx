import { Page, useAppStore } from "@/shared/stores/app-store";
import { api } from "@/convex";
import { Datetime } from "@/shared/lib";
import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight, Key, LogOut, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ConvexReady } from "@/shared/ui/convex-ready";

function formatCreditNumber(num: number): string {
  return num.toLocaleString();
}

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="text-fg-subtle mb-3 px-2 text-[11px] font-bold tracking-widest uppercase">
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
        <div className="border-border-default bg-surface-raised rounded-2xl border p-4">
          <button
            className="text-brand-400 hover:text-brand-500 text-sm font-semibold"
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
      <div className="border-border-default bg-surface-raised rounded-2xl border">
        {/* Current Plan */}
        <div className="border-border-default border-b p-4">
          <div className="text-fg-default text-sm font-semibold">
            Current plan
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-fg-muted text-sm font-bold">
              {subscription.name}
            </div>
            <div className="text-fg-subtle text-xs">
              Next billing date:{" "}
              {subscription.next_billing_date
                ? Datetime(subscription.next_billing_date).format(
                    "MMMM D, YYYY",
                  )
                : "-"}
            </div>
            <div className="text-fg-subtle text-xs">
              Plan renews every month - $18.00/month
            </div>
          </div>
        </div>

        {/* Credits Remaining */}
        <div className="border-border-default border-b p-4">
          <div className="text-fg-default text-sm font-semibold">
            Credits remaining
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fg-subtle">Subscription</span>
              <span className="text-fg-default font-semibold">
                {formatCreditNumber(balance.subscription_balance ?? 0)}
              </span>
              <span className="text-fg-subtle">
                / {formatCreditNumber(subscription.reserved_credits)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fg-subtle">Additional</span>
              <span className="text-fg-default font-semibold">
                {formatCreditNumber(balance.additional_balance ?? 0)}
              </span>
            </div>
            {balance.overdraft_amount !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-fg-subtle">Overdraft</span>
                <span className="text-fg-default font-semibold">
                  {formatCreditNumber(balance.overdraft_amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Credit Usage History */}
        <button
          className="group hover:bg-surface-overlay flex w-full items-center justify-between p-4 text-left transition-colors"
          onClick={() => navigate({ to: "/settings/account/credit-usage" })}
        >
          <span className="text-fg-default text-sm font-medium">
            Credit usage history
          </span>
          <ChevronRight
            size={16}
            className="text-fg-subtle group-hover:text-fg-default transition-colors"
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
          <div className="border-border-default bg-surface-raised rounded-2xl border">
            {/* User Info */}
            <div className="border-border-default flex items-center gap-4 border-b p-4">
              <div className="border-border-muted bg-surface-overlay flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2">
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
                <div className="text-fg-default text-sm font-medium">
                  {user?.fullName || "User"}
                </div>
                <div className="text-fg-subtle text-xs">
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>
            </div>

            {/* Change Password - only for email/password users, not social login */}
            {user?.passwordEnabled && (
              <button
                className="group border-border-default hover:bg-surface-overlay flex w-full items-center justify-between border-b p-4 text-left transition-colors"
                onClick={() => navigate({ to: "/reset-password" })}
              >
                <div className="flex items-center gap-3">
                  <Key size={18} className="text-fg-muted" />
                  <span className="text-fg-default text-sm font-medium">
                    Change password
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-fg-subtle group-hover:text-fg-default transition-colors"
                />
              </button>
            )}

            {/* Sign Out */}
            <button
              className="group hover:bg-surface-overlay flex w-full items-center justify-between p-4 text-left transition-colors"
              onClick={() => {
                signOut();
                navigate({ to: "/settings", replace: true });
              }}
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-status-error" />
                <span className="text-status-error text-sm font-medium">
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
