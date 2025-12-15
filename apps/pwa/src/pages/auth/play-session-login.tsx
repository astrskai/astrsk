import { useState, useCallback } from "react";
import { CheckCircle2, Settings, ArrowRight } from "lucide-react";
import { toastError, toastInfo, toastSuccess } from "@/shared/ui/toast";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/forms";
import { logger } from "@/shared/lib/logger";
import { IconGoogle, IconDiscord } from "@/shared/assets/icons";
import { AuthLayout, AuthBadge } from "./ui";
import { PasswordInput } from "@/shared/ui/forms";
import { useAuth } from "@/shared/hooks/use-auth";
import { signInOrSignUp, signInWithOAuth } from "@/shared/lib/auth-actions";

// --- Social Button Component ---
interface SocialButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const SocialButton = ({
  icon: IconComponent,
  label,
  onClick,
  disabled,
}: SocialButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="bg-surface-raised border-border-default hover:border-border-subtle hover:bg-hover text-fg-default flex h-12 w-full items-center justify-center gap-3 rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <IconComponent className="h-5 w-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// --- Main Page ---
export function PlaySessionLoginPage() {
  // 1. State hooks
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 2. Auth & Navigation hooks
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 3. Handlers
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isAuthenticated) {
        toastInfo("You are already signed in");
        return;
      }

      setIsLoading(true);

      try {
        const { error, action } = await signInOrSignUp({ email, password });

        switch (action) {
          case "signed_in":
            toastSuccess("Welcome back!");
            // Reload the page to trigger auth state change and continue to session
            window.location.reload();
            break;

          case "signed_up":
            toastSuccess("Account created!", {
              description: "Please check your email to confirm your account.",
            });
            break;

          case "invalid_password":
            toastError("Invalid password", {
              description:
                "You already have an account with this email. Please enter the correct password.",
            });
            break;

          case "error":
            toastError("Authentication failed", {
              description: error || "Please try again.",
            });
            break;
        }
      } catch (error) {
        logger.error("Auth error:", error);
        toastError("Failed to authenticate", {
          description:
            "Please try again or contact support if the issue persists.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, isAuthenticated],
  );

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "discord" | "apple") => {
      if (isAuthenticated) {
        toastInfo("You are already signed in");
        return;
      }

      try {
        setIsLoading(true);
        const { error } = await signInWithOAuth(provider);

        if (error) {
          setIsLoading(false);
          toastError("Failed to sign in", { description: error });
        }
        // If successful, Supabase will redirect to OAuth provider
      } catch (error) {
        setIsLoading(false);
        logger.error("OAuth sign in error:", error);
        toastError("Failed to sign in", {
          description:
            "Please try again or contact support if the issue persists.",
        });
      }
    },
    [isAuthenticated],
  );

  const handleUseOwnAPI = useCallback(() => {
    navigate({ to: "/settings/providers" });
  }, [navigate]);

  return (
    <AuthLayout>
      {/* Brand Badge */}
      <AuthBadge icon={CheckCircle2} text="Encrypted Local Storage" />

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
          Sign in to continue
        </h1>
        <p className="text-fg-subtle text-sm">
          This session requires authentication to use AI models.
        </p>
      </div>

      {/* Social Login */}
      <div className="mb-6 flex gap-3">
        <SocialButton
          icon={IconGoogle}
          label="Google"
          onClick={() => handleOAuthSignIn("google")}
          disabled={isLoading}
        />
        <SocialButton
          icon={IconDiscord}
          label="Discord"
          onClick={() => handleOAuthSignIn("discord")}
          disabled={isLoading}
        />
        {/* Apple login temporarily hidden */}
        {/* <SocialButton
          icon={IconApple}
          label="Apple"
          onClick={() => handleOAuthSignIn("apple")}
          disabled={isLoading}
        /> */}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border-subtle w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="text-fg-subtle md:bg-canvas rounded-full px-2 backdrop-blur-sm md:backdrop-blur-none">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-fg-subtle block text-xs font-medium"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface-raised h-11 rounded-xl"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-fg-subtle block text-xs font-medium"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isLoading}
          className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Continue
        </Button>
      </form>

      {/* Info text */}
      <p className="text-fg-muted mt-6 text-center text-xs">
        New users will receive a confirmation email to verify their account.
      </p>

      {/* ---- NEW SECONDARY OPTION ---- */}
      <div className="mt-8 pt-6 w-full border-t border-zinc-900 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <p className="text-xs text-zinc-600 mb-3">Or</p>
        <button
          onClick={handleUseOwnAPI}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300"
        >
          <div className="p-1 rounded bg-zinc-900 group-hover:bg-zinc-800 text-zinc-500 group-hover:text-zinc-300 transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Use Your Own API
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 ml-1 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </AuthLayout>
  );
}
