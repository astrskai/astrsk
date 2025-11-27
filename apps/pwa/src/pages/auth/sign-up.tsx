import { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/input";

// --- Types ---
interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// --- Password Input Component ---
interface PasswordInputProps {
  id: string;
  error?: string;
  placeholder?: string;
  register: ReturnType<typeof useForm<SignUpFormData>>["register"];
  name: "password" | "confirmPassword";
}

const PasswordInput = ({
  id,
  error,
  placeholder = "••••••••",
  register,
  name,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`bg-surface-raised h-11 rounded-xl pr-16 ${error ? "border-status-error" : ""}`}
        {...register(name)}
      />
      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
        {error && <AlertCircle size={16} className="text-status-error" />}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-fg-subtle hover:text-fg-default transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

// --- Password Requirements Checklist Component ---
interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
}

const PasswordChecklist = ({
  password,
  confirmPassword,
}: PasswordChecklistProps) => {
  const requirements = [
    { id: "length", label: "Minimum 8 characters", regex: /.{8,}/ },
    { id: "number", label: "At least one number", regex: /\d/ },
    { id: "symbol", label: "At least one symbol", regex: /[^A-Za-z0-9]/ },
    {
      id: "match",
      label: "Passwords match",
      check: () => password.length > 0 && password === confirmPassword,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
      {requirements.map((req) => {
        const isMet = "regex" in req ? req.regex?.test(password) : req.check();

        return (
          <div
            key={req.id}
            className="flex items-center gap-2 transition-all duration-300"
          >
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                isMet
                  ? "border-status-success bg-status-success/10"
                  : "border-border-default bg-surface"
              }`}
            >
              {isMet && (
                <Check
                  size={10}
                  className="text-status-success"
                  strokeWidth={3}
                />
              )}
            </div>
            <span
              className={`text-xs transition-colors duration-300 ${
                isMet ? "text-fg-default" : "text-fg-subtle"
              }`}
            >
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- Main Page ---
export function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = (data: SignUpFormData) => {
    setIsLoading(true);
    // TODO: Implement actual sign up logic

    setTimeout(() => setIsLoading(false), 2000);
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
            <Shield size={14} className="text-accent-cyan" />
            <span>Privacy-First Architecture</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
            Create your account
          </h1>
          <p className="text-fg-subtle text-sm">
            We'll send a verification link to your email.
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className={`block text-xs font-medium ${errors.email ? "text-status-error" : "text-fg-subtle"}`}
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`bg-surface-raised h-11 rounded-xl ${errors.email ? "border-status-error" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Please enter a valid email address.",
                },
              })}
            />
            {errors.email && (
              <p className="text-status-error flex items-center gap-1 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className={`block text-xs font-medium ${errors.password ? "text-status-error" : "text-fg-subtle"}`}
            >
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              register={register}
              error={errors.password?.message}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className={`block text-xs font-medium ${errors.confirmPassword ? "text-status-error" : "text-fg-subtle"}`}
            >
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword?.message}
            />
            {errors.confirmPassword && (
              <p className="text-status-error flex items-center gap-1 text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password Requirements Checklist */}
          <PasswordChecklist
            password={password ?? ""}
            confirmPassword={confirmPassword ?? ""}
          />

          {/* Terms Notice */}
          <p className="text-fg-subtle text-xs leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              to="/settings/legal/terms-of-service"
              className="text-fg-muted hover:text-brand-400 underline underline-offset-2 transition-colors"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              to="/settings/legal/privacy-policy"
              className="text-fg-muted hover:text-brand-400 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Create Account
          </Button>
        </form>

        {/* Sign In Prompt */}
        <div className="text-fg-subtle mt-8 text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="text-fg-default decoration-border-muted hover:text-brand-400 font-semibold underline underline-offset-4 transition-all"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
