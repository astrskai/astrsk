import { PackageOpen, Cloud, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface RecoveryToolItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

const RecoveryToolItem = ({
  icon,
  label,
  description,
  onClick,
}: RecoveryToolItemProps) => (
  <button
    className="group flex w-full items-center justify-between gap-4 border-b border-border-default p-4 text-left transition-colors last:border-0 hover:bg-surface-overlay"
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface text-fg-muted transition-colors group-hover:border-border-muted group-hover:text-fg-default">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-fg-default">{label}</div>
        <div className="text-xs text-fg-subtle">{description}</div>
      </div>
    </div>
    <ChevronRight
      size={16}
      className="shrink-0 text-fg-subtle transition-colors group-hover:text-fg-default"
    />
  </button>
);

export default function RecoveryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-default">Data Recovery</h1>
        <p className="mt-2 text-sm text-fg-subtle">
          Tools to recover lost data from failed migrations
        </p>
      </div>

      {/* Local Recovery Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg-default">Local Recovery Tools</h2>
        <div className="rounded-2xl border border-border-default bg-surface-raised">
          <RecoveryToolItem
            icon={<PackageOpen size={18} />}
            label="Character & Scenario Recovery"
            description="Recover character and scenario data from old database tables. Use this if your characters disappeared after an app update."
            onClick={() => navigate({ to: "/settings/advanced/recovery/character-recovery" })}
          />
        </div>
      </div>

      {/* Remote Recovery Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg-default">Remote Recovery</h2>
        <div className="rounded-2xl border border-border-default bg-surface-raised">
          <RecoveryToolItem
            icon={<Cloud size={18} />}
            label="Remote Recovery Script"
            description="Run recovery scripts pushed by astrsk team to fix specific issues. Managed remotely for critical fixes."
            onClick={() => navigate({ to: "/settings/advanced/recovery/remote-script" })}
          />
        </div>
      </div>
    </div>
  );
}
