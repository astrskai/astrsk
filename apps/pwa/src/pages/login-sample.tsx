import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

// --- 1. CSS Variables Injection (The Design System) ---
// Re-injecting to ensure this component works standalone
const DesignSystemGlobalStyles = () => (
  <style>{`
    :root {
      /* Primitives */
      --c-neutral-0: #000000;
      --c-neutral-950: #0a0a0c;
      --c-neutral-900: #141416;
      --c-neutral-800: #232328;
      --c-neutral-700: #3a3a42;
      --c-neutral-600: #4e4e58;
      --c-neutral-500: #6b6b76;
      --c-neutral-400: #9898a4;
      --c-neutral-300: #c8c8d0;
      --c-neutral-200: #e2e2e8;
      --c-neutral-100: #f0f0f4;
      --c-neutral-50: #f8f8fa;
      --c-white: #ffffff;

      --c-brand-700: #3a5a8a;
      --c-brand-600: #4a6fa5;
      --c-brand-500: #5b82ba;
      --c-brand-400: #7a9cc9;
      --c-brand-300: #a3bdd9;

      /* Semantic - Dark Default */
      --bg-canvas: var(--c-neutral-0);
      --bg-surface: var(--c-neutral-950);
      --bg-surface-raised: var(--c-neutral-900);
      --bg-surface-overlay: var(--c-neutral-800);
      --bg-hover: var(--c-neutral-700);
      
      --fg-default: var(--c-white);
      --fg-muted: var(--c-neutral-400);
      --fg-subtle: var(--c-neutral-500);
      --fg-placeholder: var(--c-neutral-600);
      
      --border-default: var(--c-neutral-800);
      --border-muted: var(--c-neutral-700);
      --border-focus: var(--c-brand-500);
      
      --btn-primary-bg: var(--c-brand-600);
      --btn-primary-hover: var(--c-brand-500);
      
      --input-bg: var(--c-neutral-900);
    }

    :root.light {
      --bg-canvas: var(--c-white);
      --bg-surface: var(--c-neutral-50);
      --bg-surface-raised: var(--c-white);
      --bg-surface-overlay: var(--c-neutral-100);
      --bg-hover: var(--c-neutral-200);
      
      --fg-default: var(--c-neutral-900);
      --fg-muted: var(--c-neutral-600);
      --fg-subtle: var(--c-neutral-500);
      --fg-placeholder: var(--c-neutral-400);
      
      --border-default: var(--c-neutral-200);
      --border-muted: var(--c-neutral-100);
      
      --btn-primary-bg: var(--c-brand-600);
      --btn-primary-hover: var(--c-brand-700);
      
      --input-bg: var(--c-white);
    }
  `}</style>
);

// --- Custom Brand Icons ---
const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 127.14 96.36" width="22" height="22" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c.63-23.02-4.52-46.94-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
  </svg>
);

// --- UI Components ---

const SocialButton = ({
  icon: IconComponent,
  label,
}: {
  icon: React.ComponentType;
  label: string;
}) => (
  <button className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--fg-default)] transition-all duration-200 hover:border-[var(--border-muted)] hover:bg-[var(--bg-hover)] active:scale-95">
    <IconComponent />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const InputField = ({
  type = "text",
  placeholder,
  label,
  id,
}: {
  type?: string;
  placeholder: string;
  label: string;
  id: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className={`mb-1.5 block text-xs font-medium transition-colors ${isFocused ? "text-[var(--c-brand-400)]" : "text-[var(--fg-subtle)]"}`}
      >
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-xl border bg-[var(--input-bg)] transition-all duration-200 ${
          isFocused
            ? "border-[var(--border-focus)] ring-1 ring-[var(--border-focus)]"
            : "border-[var(--border-default)] hover:border-[var(--border-muted)]"
        }`}
      >
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-11 w-full bg-transparent px-4 text-sm text-[var(--fg-default)] placeholder-[var(--fg-placeholder)] focus:outline-none"
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-default)]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function LoginPage() {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network req
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div
      className={`flex min-h-screen w-full font-sans transition-colors duration-500 selection:bg-[var(--c-brand-500)] selection:text-white`}
      style={{
        backgroundColor: "var(--bg-canvas)",
        color: "var(--fg-default)",
      }}
    >
      <DesignSystemGlobalStyles />

      {/* LEFT PANEL: Immersive Brand View */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--c-neutral-950)] p-12 lg:flex">
        {/* Ambient Background (Matches Landing Page Hero) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] h-[700px] w-[700px] rounded-full bg-[var(--c-brand-700)] opacity-20 blur-[140px]" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-[var(--c-brand-500)] opacity-10 blur-[120px]" />
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#4a6fa5 1px, transparent 1px), linear-gradient(90deg, #4a6fa5 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        {/* Content z-index fix */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--c-brand-600)] to-[var(--c-brand-700)] text-lg font-bold text-white shadow-lg">
              L
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Loca.ai
            </span>
          </div>

          {/* Testimonial / Feature Highlight */}
          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/50 px-3 py-1 text-xs font-medium text-[var(--c-brand-300)] backdrop-blur-md">
              <CheckCircle2
                size={14}
                className="text-[var(--c-status-success)]"
              />
              <span>Encrypted Local Storage</span>
            </div>
            <h1 className="mb-4 text-4xl leading-tight font-extrabold tracking-tight text-white">
              Your stories,
              <br />
              <span className="bg-gradient-to-r from-[var(--c-brand-400)] to-[var(--c-brand-600)] bg-clip-text text-transparent">
                exclusively yours.
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-[var(--c-neutral-400)]">
              "Finally, an AI chat platform where I don't have to worry about my
              data being mined. It runs smooth as butter on my M2 Air."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--c-neutral-700)] bg-[var(--c-neutral-800)]">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Alex Chen</p>
                <p className="text-xs text-[var(--c-neutral-500)]">
                  Product Designer
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex gap-6 text-xs text-[var(--c-neutral-500)]">
            <a href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[var(--bg-canvas)] p-6 lg:w-1/2">
        {/* Theme Toggle (Absolute Top Right) */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="absolute top-6 right-6 rounded-full p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-hover)]"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--c-brand-600)] to-[var(--c-brand-700)] text-xl font-bold text-white shadow-lg">
              L
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--fg-default)]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Social Login */}
          <div className="mb-6 flex gap-3">
            <SocialButton icon={GoogleIcon} label="Google" />
            <SocialButton icon={DiscordIcon} label="Discord" />
            <SocialButton icon={AppleIcon} label="Apple" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--bg-canvas)] px-2 text-[var(--fg-subtle)]">
                Or continue with
              </span>
            </div>
          </div>

          {/* Direct Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="email"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
            />

            <div>
              <InputField
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
              />
              <div className="mt-1.5 flex justify-end">
                <a
                  href="#"
                  className="text-xs font-medium text-[var(--c-brand-400)] transition-colors hover:text-[var(--c-brand-500)]"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(74,111,165,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[var(--btn-primary-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Log In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Prompt */}
          <div className="mt-8 text-center text-sm text-[var(--fg-muted)]">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-semibold text-[var(--fg-default)] underline decoration-[var(--border-muted)] underline-offset-4 transition-all hover:text-[var(--c-brand-400)]"
            >
              Sign up for free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
