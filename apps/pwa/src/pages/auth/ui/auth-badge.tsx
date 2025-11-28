import { LucideIcon } from "lucide-react";

interface AuthBadgeProps {
  icon: LucideIcon;
  iconClassName?: string;
  text: string;
}

export function AuthBadge({
  icon: Icon,
  iconClassName = "text-accent-cyan",
  text,
}: AuthBadgeProps) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="border-border-default bg-surface/50 text-brand-300 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md">
        <Icon size={14} className={iconClassName} />
        <span>{text}</span>
      </div>
    </div>
  );
}
