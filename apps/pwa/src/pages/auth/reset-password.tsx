import { useState, useEffect } from "react";
import { Lock, ArrowRight, RefreshCw, XCircle, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/shared/hooks/use-auth";
import { updatePassword } from "@/shared/lib/auth-actions";
import { logger } from "@/shared/lib/logger";

import { Button } from "@/shared/ui/forms/button";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { AuthLayout, AuthBadge, PasswordChecklist, checkPasswordRequirements } from "./ui";
import { PasswordInput } from "@/shared/ui/forms";

// --- View States ---
type ViewState = "RESET" | "SUCCESS" | "EXPIRED";

// --- Main Page ---
export function ResetPasswordPage() {
  // Router hooks
  const navigate = useNavigate();
  const search = useSearch({ from: "/_layout/reset-password" });

  // Auth hooks
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // State
  const [viewState, setViewState] = useState<ViewState>("RESET");
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [errors, setErrors] = useState<{ new?: string; confirm?: string }>({});

  // Determine access context
  const hasToken = !!search.token;
  const isFromSettings = isAuthenticated && !hasToken;

  // Redirect if no token and not logged in (invalid access)
  // Wait for auth to load before checking auth state
  useEffect(() => {
    if (!isAuthLoading && !hasToken && !isAuthenticated) {
      navigate({ to: "/forgot-password", replace: true });
    }
  }, [isAuthLoading, hasToken, isAuthenticated, navigate]);

  const isFormValid =
    checkPasswordRequirements(passwords.new) &&
    passwords.new === passwords.confirm;

  // Handle redirect after successful password reset
  useEffect(() => {
    if (viewState === "SUCCESS") {
      const timer = setTimeout(() => {
        if (isFromSettings) {
          // Logged-in user from Settings → redirect to account page with toast
          toastSuccess("Password updated successfully");
          navigate({ to: "/settings/account" });
        } else {
          // Email link user → redirect to home (auto-login handled by API)
          toastSuccess("Password updated! Welcome back.");
          navigate({ to: "/" });
        }
      }, 2000); // Show success message for 2 seconds before redirect

      return () => clearTimeout(timer);
    }
  }, [viewState, isFromSettings, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { new?: string; confirm?: string } = {};

    if (!checkPasswordRequirements(passwords.new)) {
      newErrors.new = "Please meet all password requirements.";
    }
    if (passwords.new !== passwords.confirm) {
      newErrors.confirm = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(passwords.new);

      if (error) {
        toastError("Password reset failed", { description: error });
        return;
      }

      setViewState("SUCCESS");
    } catch (error) {
      logger.error("Password reset error:", error);
      toastError("Failed to reset password", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* --- RESET VIEW --- */}
      {viewState === "RESET" && (
        <>
          {/* Badge */}
          <AuthBadge icon={Lock} text="Account Security" />

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
              Set a new
              <br />
              <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
                password
              </span>
            </h1>
            <p className="text-fg-subtle text-sm">
              Choose a strong password to secure your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-fg-subtle block text-xs font-medium"
              >
                New Password
              </label>
              <PasswordInput
                id="new-password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords((prev) => ({ ...prev, new: e.target.value }))
                }
                placeholder="Enter new password"
                error={errors.new}
                showLockIcon
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-fg-subtle block text-xs font-medium"
              >
                Confirm New Password
              </label>
              <PasswordInput
                id="confirm-password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    confirm: e.target.value,
                  }))
                }
                placeholder="Confirm your password"
                error={errors.confirm}
                showLockIcon
              />
              {errors.confirm && (
                <p className="text-status-error mt-1 text-xs">
                  {errors.confirm}
                </p>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <PasswordChecklist
              password={passwords.new}
              confirmPassword={passwords.confirm}
            />

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={!isFormValid}
              className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Reset Password
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/sign-in"
              className="text-fg-muted hover:text-fg-default flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </>
      )}

      {/* --- SUCCESS VIEW --- */}
      {viewState === "SUCCESS" && (
        <div className="text-center">
          {/* Success Icon */}
          <div className="border-status-success/20 bg-status-success/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border">
            <RefreshCw size={32} className="text-status-success" />
          </div>

          {/* Header */}
          <h1 className="text-fg-default mb-2 text-2xl font-bold">
            Password updated
          </h1>
          <p className="text-fg-muted text-sm leading-relaxed">
            Your password has been reset successfully.
            <br />
            <span className="text-fg-subtle mt-2 inline-block text-xs">
              Redirecting{isFromSettings ? " to account settings" : ""}...
            </span>
          </p>

          {/* Manual navigation fallback */}
          <div className="mt-8">
            <Link to={isFromSettings ? "/settings/account" : "/"}>
              <Button
                size="lg"
                className="shadow-brand-600/20 w-full font-semibold shadow-lg"
              >
                {isFromSettings ? "Go to Settings" : "Continue"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* --- EXPIRED VIEW --- */}
      {viewState === "EXPIRED" && (
        <div className="text-center">
          {/* Error Icon */}
          <div className="border-status-error/20 bg-status-error/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border">
            <XCircle size={32} className="text-status-error" />
          </div>

          {/* Header */}
          <h1 className="text-fg-default mb-2 text-2xl font-bold">
            Link Expired
          </h1>
          <p className="text-fg-muted text-sm leading-relaxed">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <Link to="/forgot-password">
              <Button
                size="lg"
                className="shadow-brand-600/20 w-full font-semibold shadow-lg"
              >
                Request New Link
              </Button>
            </Link>

            <Link
              to="/sign-in"
              className="text-fg-muted hover:text-fg-default block text-sm font-medium transition-colors"
            >
              Cancel and return to Sign In
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
