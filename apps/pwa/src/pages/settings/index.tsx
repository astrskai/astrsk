import { useNavigate } from "@tanstack/react-router";
import {
  User,
  Cpu,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Info,
  Scale,
  Sliders,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Avatar } from "@astrsk/design-system";
import { SvgIcon } from "@/shared/ui";
import { IconDiscord, IconGithub } from "@/shared/assets/icons";
import { toastError } from "@/shared/ui/toast";
import { useAuth } from "@/shared/hooks/use-auth";

// --- Helper ---
function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// --- Reusable Components ---

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="text-fg-subtle mb-3 px-2 text-[11px] font-bold tracking-widest uppercase">
    {title}
  </h3>
);

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  type?: "internal" | "external";
  onClick: () => void;
}

const SettingsItem = ({
  icon,
  label,
  description,
  type = "internal",
  onClick,
}: SettingsItemProps) => {
  return (
    <button
      onClick={onClick}
      className="group border-border-default hover:bg-surface-overlay active:bg-hover flex w-full items-center justify-between border-b p-4 text-left transition-all first:rounded-t-xl last:rounded-b-xl last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="border-border-default bg-surface text-fg-muted group-hover:border-border-muted group-hover:text-fg-default flex h-10 w-10 items-center justify-center rounded-lg border transition-colors">
          {icon}
        </div>
        <div>
          <span className="text-fg-default text-sm font-medium">{label}</span>
          {description && (
            <p className="text-fg-subtle text-xs">{description}</p>
          )}
        </div>
      </div>

      <div className="text-fg-subtle group-hover:text-fg-default transition-colors">
        {type === "external" ? (
          <ExternalLink size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </div>
    </button>
  );
};

const SignInPromptCard = () => {
  // COMMENTED OUT: Temporarily removed welcome/sign-in prompt
  return null;

  /* return (
    <div className="border-border-default bg-surface-raised mb-8 flex items-center justify-between rounded-2xl border p-5">
      <div className="flex items-center gap-4">
        <Avatar
          size="lg"
          fallback={<User size={20} className="text-fg-muted" />}
        />
        <div>
          <h2 className="text-fg-default text-lg font-bold">Welcome</h2>
          <p className="text-fg-muted text-xs">
            Sign in to sync your data across devices
          </p>
        </div>
      </div>
      <Link
        to="/sign-in"
        className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 flex items-center justify-center rounded-lg text-sm font-medium text-white transition-colors md:px-4 md:py-2 p-2"
        aria-label="Sign in"
      >
        <LogIn size={20} className="md:hidden" />
        <span className="hidden md:inline">Sign in</span>
      </Link>
    </div>
  ); */
};

const UserProfileCard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="border-border-default bg-surface-raised mb-8 flex items-center justify-between rounded-2xl border p-5">
      <div className="flex items-center gap-4">
        <Avatar
          src={user?.user_metadata?.avatar_url}
          alt={user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
          size="lg"
          fallback={<User size={20} className="text-fg-muted" />}
        />
        <div>
          <h2 className="text-fg-default text-lg font-bold">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
          </h2>
          <p className="text-fg-muted text-xs">
            {user?.email}
          </p>
        </div>
      </div>
      <button
        onClick={async () => {
          try {
            await signOut();
            navigate({ to: "/settings", replace: true });
          } catch (error) {
            toastError("Sign out failed. Please try again.");
          }
        }}
        className="text-status-error hover:bg-status-error/10 rounded-lg p-2 transition-colors"
        aria-label="Sign out"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};

// --- Main Component ---

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-8 py-8">
      {/* Page Header - Index에서만 표시 */}
      <div className="mb-8">
        <h1 className="text-fg-default text-3xl font-bold">Settings</h1>
        <p className="text-fg-muted mt-1 text-sm">
          Manage your account and application preferences.
        </p>
      </div>

      {/* User Profile Card - Authenticated / Sign In Prompt - Unauthenticated */}
      {isAuthenticated ? <UserProfileCard /> : <SignInPromptCard />}

      {/* 1. APP PREFERENCES */}
      <section>
        <SectionTitle title="App Preferences" />
        <div className="border-border-default bg-surface-raised rounded-2xl border">
          {isAuthenticated && (
            <SettingsItem
              icon={<User size={18} />}
              label="Account & Subscription"
              description="Manage profile, billing, and plan details"
              onClick={() => navigate({ to: "/settings/account" })}
            />
          )}
          <SettingsItem
            icon={<Cpu size={18} />}
            label="Providers"
            description="Configure local LLM backends and API keys"
            onClick={() => navigate({ to: "/settings/providers" })}
          />
          <SettingsItem
            icon={<Sliders size={18} />}
            label="Advanced Preferences"
            description="Security and developer tools"
            onClick={() => navigate({ to: "/settings/advanced" })}
          />
        </div>
      </section>

      {/* 2. COMMUNITY */}
      <section>
        <SectionTitle title="Community" />
        <div className="border-border-default bg-surface-raised rounded-2xl border">
          <SettingsItem
            icon={<IconDiscord className="h-5 w-5 text-[#5865F2]" />}
            label="Join our Discord"
            description="Connect with other creators"
            type="external"
            onClick={() => openInNewTab("https://discord.gg/J6ry7w8YCF")}
          />
          <SettingsItem
            icon={
              <SvgIcon
                name="reddit_color"
                className="h-5 w-5 text-orange-500"
              />
            }
            label="Visit our Reddit"
            description="r/astrsk_ai discussion"
            type="external"
            onClick={() => openInNewTab("https://www.reddit.com/r/astrsk_ai/")}
          />
          <SettingsItem
            icon={<IconGithub className="h-5 w-5" />}
            label="View on GitHub"
            description="Open source repository"
            type="external"
            onClick={() => openInNewTab("https://github.com/astrskai/astrsk")}
          />
        </div>
      </section>

      {/* 3. SUPPORT */}
      <section>
        <SectionTitle title="Support" />
        <div className="border-border-default bg-surface-raised rounded-2xl border">
          <SettingsItem
            icon={<BookOpen size={18} />}
            label="User Manual"
            description="Documentation and guides"
            type="external"
            onClick={() => openInNewTab("https://docs.astrsk.ai/")}
          />
          <SettingsItem
            icon={<Info size={18} />}
            label="About astrsk.ai"
            description={`Version ${__APP_VERSION__}`}
            type="external"
            onClick={() => openInNewTab("https://about.astrsk.ai")}
          />
          <SettingsItem
            icon={<Scale size={18} />}
            label="Legal"
            description="Privacy policy and terms of service"
            onClick={() => navigate({ to: "/settings/legal" })}
          />
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="text-fg-muted flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-500" />
          <span className="text-xs font-medium">
            Your sessions are stored locally on your device.
          </span>
        </div>
      </div>
    </div>
  );
}
