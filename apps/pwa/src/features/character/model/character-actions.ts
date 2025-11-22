export interface CharacterAction {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  bottomActionsClassName?: string;
}
