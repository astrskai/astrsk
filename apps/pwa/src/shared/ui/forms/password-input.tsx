import { useState } from "react";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { Input } from "@/shared/ui/forms";

// --- Controlled version (for manual state management) ---
interface PasswordInputControlledProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  showLockIcon?: boolean;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  showLockIcon = false,
}: PasswordInputControlledProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      {showLockIcon && (
        <div className="text-fg-subtle absolute top-1/2 left-3 -translate-y-1/2">
          <Lock size={18} />
        </div>
      )}
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`bg-surface-raised h-11 rounded-xl pr-10 ${showLockIcon ? "pl-10" : ""} ${error ? "border-status-error" : ""}`}
        required
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
}

// --- React Hook Form version ---
import type { UseFormRegister, FieldValues, Path } from "react-hook-form";

interface PasswordInputRHFProps<T extends FieldValues> {
  id: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  rules?: Parameters<UseFormRegister<T>>[1];
  error?: string;
}

export function PasswordInputRHF<T extends FieldValues>({
  id,
  name,
  register,
  rules,
  error,
}: PasswordInputRHFProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        className={`bg-surface-raised h-11 rounded-xl pr-16 ${error ? "border-status-error" : ""}`}
        {...register(name, rules)}
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
}
