import { useEffect, useState } from "react";
import {
  ChevronRight,
  Shield,
  FileText,
  Database,
  Terminal,
} from "lucide-react";
import { Switch } from "@/shared/ui";
import { useNavigate } from "@tanstack/react-router";
import { toastInfo } from "@/shared/ui/toast/base";

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-fg-subtle">
    {title}
  </h3>
);

interface SettingsToggleItemProps {
  icon: React.ReactNode;
  label: string;
  description: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const SettingsToggleItem = ({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: SettingsToggleItemProps) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-default p-4 last:border-0">
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface text-fg-muted">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-fg-default">{label}</div>
        <div className="text-xs text-fg-subtle">{description}</div>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

interface SettingsLinkItemProps {
  icon: React.ReactNode;
  label: string;
  description: React.ReactNode;
  onClick: () => void;
}

const SettingsLinkItem = ({
  icon,
  label,
  description,
  onClick,
}: SettingsLinkItemProps) => (
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

export default function AdvancedPage() {
  const navigate = useNavigate();
  const [allowInsecureContent, setAllowInsecureContent] = useState(false);

  useEffect(() => {
    const getConfigs = async () => {
      if (!window.api?.config) {
        return;
      }
      setAllowInsecureContent(
        await window.api.config.getConfig("allowInsecureContent"),
      );
    };
    getConfigs();
  }, []);

  return (
    <div className="space-y-8 py-8">
      {/* Security Settings */}
      <section>
        <SectionTitle title="Security" />
        <div className="rounded-2xl border border-border-default bg-surface-raised">
          <SettingsToggleItem
            icon={<Shield size={18} />}
            label="Allow HTTP connection"
            description={
              <>
                Enable this option if you want to connect providers serving on
                non-local devices via HTTP. This option will take effect after
                the app restarts.
                <br />
                <span className="text-status-error">
                  Allowing HTTP connection lowers the security level of the app.
                </span>
              </>
            }
            checked={allowInsecureContent}
            onCheckedChange={(checked) => {
              setAllowInsecureContent(checked);
              if (!window.api?.config) {
                return;
              }
              window.api.config.setConfig("allowInsecureContent", checked);
            }}
          />
        </div>
      </section>

      {/* Developer Tools */}
      <section>
        <SectionTitle title="Developer Tools" />
        <div className="rounded-2xl border border-border-default bg-surface-raised">
          <SettingsLinkItem
            icon={<FileText size={18} />}
            label="View initialization logs"
            description="View detailed logs of the last app initialization, including step-by-step status and error messages"
            onClick={() =>
              navigate({ to: "/settings/advanced/initialization-logs" })
            }
          />
          <SettingsLinkItem
            icon={<Database size={18} />}
            label="View migration history"
            description="View history of database migrations executed during app updates, including timing and success/failure status"
            onClick={() =>
              navigate({ to: "/settings/advanced/migration-history" })
            }
          />
          {/* Desktop only - Devtools */}
          <div className="hidden md:block">
            <SettingsLinkItem
              icon={<Terminal size={18} />}
              label="Open Devtool console"
              description={
                <span className="text-status-error">
                  Manipulating code or data within the devtool can corrupt your
                  astrsk environment and break it. Use at your own discretion
                </span>
              }
              onClick={() => {
                if (window.api?.debug?.openDevTools) {
                  window.api.debug.openDevTools();
                } else {
                  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
                  toastInfo(
                    `Press ${isMac ? "⌘+Option+I" : "Ctrl+Shift+I"} or F12 to open DevTools`,
                  );
                }
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
