import type { LucideIcon } from "lucide-react";

export interface CharacterAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}
