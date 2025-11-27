import { useState } from "react";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/input";

// --- View States ---
type ViewState = "REQUEST" | "SENT";

// --- Main Page ---
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("REQUEST");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    // TODO: Implement actual password reset API call
    setTimeout(() => {
      setIsLoading(false);
      setViewState("SENT");
    }, 1500);
  };

  return (
    <div className="bg-canvas text-fg-default flex min-h-screen w-full items-center justify-center p-6">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-brand-700 absolute top-[-10%] right-[-5%] h-[700px] w-[700px] rounded-full opacity-20 blur-[140px]" />
        <div className="bg-brand-500 absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <div className="border-border-default bg-surface/50 text-brand-300 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md">
            <KeyRound size={14} className="text-accent-orange" />
            <span>Secure Recovery</span>
          </div>
        </div>

        {/* --- REQUEST VIEW --- */}
        {viewState === "REQUEST" && (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
                Forgot your
                <br />
                <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
                  password?
                </span>
              </h1>
              <p className="text-fg-subtle text-sm">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="border-status-error bg-status-error/10 text-status-error mb-6 flex items-center gap-3 rounded-lg border p-3 text-sm">
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-fg-subtle block text-xs font-medium"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="text-fg-subtle absolute top-1/2 left-3 -translate-y-1/2"
                  />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className="bg-surface-raised h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={isLoading}
                disabled={!email}
                className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Send Reset Link
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

        {/* --- SENT VIEW --- */}
        {viewState === "SENT" && (
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-status-success/20 bg-status-success/10">
              <CheckCircle2 size={32} className="text-status-success" />
            </div>

            {/* Header */}
            <h1 className="text-fg-default mb-2 text-2xl font-bold">
              Check your email
            </h1>
            <p className="text-fg-muted text-sm leading-relaxed">
              If an account exists with{" "}
              <span className="text-fg-default font-semibold">{email}</span>, we
              sent you a password reset link.
            </p>
            <p className="text-fg-subtle mt-2 text-xs">
              The link may take a few minutes to arrive. Remember to check your
              spam folder.
            </p>

            {/* Actions */}
            <div className="mt-8 space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => window.open("https://gmail.com", "_blank")}
              >
                Open Email App
              </Button>

              <Link
                to="/sign-in"
                className="text-fg-muted hover:text-fg-default block text-sm font-medium transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
