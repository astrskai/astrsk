import { type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface AddItemButtonProps {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}

export default function AddItemButton({
  icon: Icon,
  label,
  onClick,
}: AddItemButtonProps) {
  return (
    <div
      className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-subtle hover:border-fg-subtle text-fg-default text-sm font-medium transition-colors md:text-base"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <p>{label}</p>
    </div>
  );
}
