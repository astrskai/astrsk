import { Page, useAppStore } from "@/shared/stores/app-store";
import { api } from "@/convex";
import { Datetime } from "@/shared/lib";
import { useAuth } from "@/shared/hooks/use-auth";
import { useQuery } from "convex/react";
import { ChevronRight, Key, LogOut, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ConvexReady } from "@/shared/ui/convex-ready";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { useState } from "react";

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
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check if user signed up with email/password (not OAuth)
  // Supabase stores provider info in app_metadata.provider
  const isEmailUser = user?.app_metadata?.provider === "email";

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
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-fg-muted" />
                )}
              </div>
              <div>
                <div className="text-fg-default text-sm font-medium">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
                </div>
                <div className="text-fg-subtle text-xs">
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Change Password - only for email/password users, not social login */}
            {isEmailUser && (
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
              className="group hover:bg-surface-overlay flex w-full items-center justify-between p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSigningOut}
              onClick={async () => {
                setIsSigningOut(true);
                try {
                  await signOut();
                  toastSuccess("Signed out successfully");
                  navigate({ to: "/", replace: true });
                } catch (error) {
                  console.error("Sign out failed:", error);
                  toastError("Failed to sign out", {
                    description: "Please try again or refresh the page.",
                  });
                  setIsSigningOut(false);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-status-error" />
                <span className="text-status-error text-sm font-medium">
                  {isSigningOut ? "Signing out..." : "Sign out"}
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
