import { useState } from "react";
import { Mail, CheckCircle2, ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/forms/button";
import { AuthLayout, AuthBadge } from "./ui";

// --- Main Page ---
export function EmailVerificationPage() {
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  // TODO: Get actual user email from auth context
  const userEmail = "user@example.com";

  const handleResend = () => {
    if (resendStatus === "sending") return;
    setResendStatus("sending");

    // TODO: Implement actual resend API call
    setTimeout(() => {
      setResendStatus("sent");
      // Reset after 5s
      setTimeout(() => setResendStatus("idle"), 5000);
    }, 1500);
  };

  const handleVerificationComplete = () => {
    // TODO: Re-check auth token or navigate to dashboard
    console.log("Checking verification status...");
    window.location.href = "/";
  };

  return (
    <AuthLayout>
      {/* Badge */}
      <AuthBadge icon={Mail} text="Security Check" />

      {/* Hero Icon */}
      <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
        <div className="border-border-default bg-surface-raised absolute inset-0 rounded-full border shadow-2xl" />
        <div className="border-brand-500/20 animate-pulse-ring absolute inset-0 rounded-full border" />
        <Inbox size={40} className="text-brand-400 relative z-10" />

        {/* Badge overlay */}
        <div className="border-border-default bg-canvas absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border">
          <Mail size={14} className="text-brand-500" />
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
          Check your
          <br />
          <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
            inbox
          </span>
        </h1>
        <p className="text-fg-subtle mt-4 text-sm leading-relaxed">
          We've sent a verification link to{" "}
          <span className="text-fg-default font-semibold">{userEmail}</span>.
        </p>
        <p className="text-fg-subtle mt-2 text-sm">
          Click the link in the email, then come back here and press the button
          below.
        </p>
      </div>

      {/* Primary Action */}
      <Button
        size="lg"
        onClick={handleVerificationComplete}
        className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
      >
        I have verified
      </Button>

      {/* Secondary Actions */}
      <div className="mt-8 space-y-4 text-center">
        {/* Resend Logic */}
        <div className="text-fg-subtle text-xs">
          Didn't receive the email?{" "}
          {resendStatus === "sent" ? (
            <span className="text-status-success inline-flex items-center gap-1 font-medium">
              <CheckCircle2 size={12} /> Sent!
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendStatus === "sending"}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors hover:underline disabled:no-underline disabled:opacity-50"
            >
              {resendStatus === "sending" ? "Sending..." : "Click to resend"}
            </button>
          )}
        </div>

        {/* Back Navigation */}
        <div>
          <Link
            to="/sign-up"
            className="text-fg-muted hover:text-fg-default inline-flex items-center gap-2 text-xs font-medium transition-colors"
          >
            <ArrowLeft size={12} /> Use a different email
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
