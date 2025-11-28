import { Check } from "lucide-react";

interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
}

export function PasswordChecklist({
  password,
  confirmPassword,
}: PasswordChecklistProps) {
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
}

// Utility function to validate password requirements
export function checkPasswordRequirements(password: string): boolean {
  return /.{8,}/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
