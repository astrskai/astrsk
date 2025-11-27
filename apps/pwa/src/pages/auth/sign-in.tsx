import { useState, useCallback } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth, useSignUp } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/input";
import { logger } from "@/shared/lib/logger";
import { IconGoogle, IconDiscord, IconApple } from "@/shared/assets/icons";

// --- Social Button Component ---
interface SocialButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}

const SocialButton = ({
  icon: IconComponent,
  label,
  onClick,
}: SocialButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-surface-raised border-border-default hover:border-border-subtle hover:bg-hover text-fg-default flex h-12 w-full items-center justify-center gap-3 rounded-xl border transition-all duration-200 active:scale-95"
  >
    <IconComponent className="h-5 w-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// --- Password Input Component ---
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const PasswordInput = ({ id, value, onChange }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="bg-surface-raised h-11 rounded-xl pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-fg-subtle hover:text-fg-default absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

// --- Main Page ---
export function SignInPage() {
  // 1. State hooks
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 2. Auth hooks
  const { userId } = useAuth();
  const { isLoaded: isLoadedSignUp, signUp } = useSignUp();

  // 3. Handlers
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement actual login logic

    setTimeout(() => setIsLoading(false), 2000);
  };

  const signUpWithDiscord = useCallback(async () => {
    if (!isLoadedSignUp) {
      return;
    }

    if (userId) {
      toast.info("You are already signed in");
      return;
    }

    try {
      setIsLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: "oauth_discord",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      setIsLoading(false);
      logger.error(error);
      toast.error("Failed to sign in", {
        description:
          "Please try again or contact support if the issue persists.",
      });
    }
  }, [isLoadedSignUp, signUp, userId]);

  return (
    <div className="bg-canvas text-fg-default flex min-h-screen w-full items-center justify-center p-6">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-brand-700 absolute top-[-10%] right-[-5%] h-[700px] w-[700px] rounded-full opacity-20 blur-[140px]" />
        <div className="bg-brand-500 absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand Badge */}
        <div className="mb-6 flex justify-center">
          <div className="border-border-default bg-surface/50 text-brand-300 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md">
            <CheckCircle2 size={14} className="text-accent-cyan" />
            <span>Encrypted Local Storage</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
            Your stories,
            <br />
            <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
              exclusively yours.
            </span>
          </h1>
          <p className="text-fg-subtle text-sm">
            Sign in to continue your story.
          </p>
        </div>

        {/* Social Login */}
        <div className="mb-6 flex gap-3">
          <SocialButton icon={IconGoogle} label="Google" />
          <SocialButton
            icon={IconDiscord}
            label="Discord"
            onClick={signUpWithDiscord}
          />
          <SocialButton icon={IconApple} label="Apple" />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border-subtle w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="text-fg-subtle md:bg-canvas rounded-full px-2 backdrop-blur-sm md:backdrop-blur-none">
              Or continue with
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
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Log In
          </Button>
        </form>

        {/* Sign Up Prompt */}
        <div className="text-fg-subtle mt-8 text-center text-sm">
          Don't have an account?{" "}
          <Link
            to="/sign-up"
            className="text-fg-default decoration-border-muted hover:text-brand-400 font-semibold underline underline-offset-4 transition-all"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
