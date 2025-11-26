import React, { useState } from "react";
import {
  User,
  CreditCard,
  Cpu,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  BookOpen,
  Info,
  Scale,
  Sliders,
  ShieldCheck,
  LogOut,
  Sparkles,
  ArrowLeft,
  Key,
  Check,
  X,
  Zap,
} from "lucide-react";

// --- 1. CSS Variables Injection (The Design System) ---
const DesignSystemGlobalStyles = () => (
  <style>{`
    :root {
      /* Primitives */
      --c-neutral-0: #000000;
      --c-neutral-950: #0a0a0c;
      --c-neutral-900: #141416;
      --c-neutral-800: #232328;
      --c-neutral-700: #3a3a42;
      --c-neutral-600: #4e4e58;
      --c-neutral-500: #6b6b76;
      --c-neutral-400: #9898a4;
      --c-neutral-300: #c8c8d0;
      --c-neutral-200: #e2e2e8;
      --c-white: #ffffff;

      --c-brand-700: #3a5a8a;
      --c-brand-600: #4a6fa5;
      --c-brand-500: #5b82ba;
      --c-brand-400: #7a9cc9;

      /* Semantic - Dark Default */
      --bg-canvas: var(--c-neutral-0);
      --bg-surface: var(--c-neutral-950);
      --bg-surface-raised: var(--c-neutral-900);
      --bg-surface-overlay: var(--c-neutral-800);
      --bg-hover: var(--c-neutral-700);
      
      --fg-default: var(--c-white);
      --fg-muted: var(--c-neutral-400);
      --fg-subtle: var(--c-neutral-500);
      
      --border-default: var(--c-neutral-800);
      --border-muted: var(--c-neutral-700);
    }
  `}</style>
);

// --- Reusable Components ---

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="mb-3 px-2 text-[11px] font-bold tracking-widest text-[var(--fg-subtle)] uppercase">
    {title}
  </h3>
);

const SettingsItem = ({
  icon: Icon,
  label,
  description,
  type = "internal",
  onClick,
  accentColor = "text-[var(--fg-default)]",
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  type?: "internal" | "external" | "action";
  onClick: () => void;
  accentColor?: string;
  badge?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between border-b border-[var(--border-default)] p-4 text-left transition-all first:rounded-t-xl last:rounded-b-xl last:border-0 hover:bg-[var(--bg-surface-overlay)] active:bg-[var(--bg-hover)]"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--fg-muted)] transition-colors group-hover:border-[var(--border-muted)] group-hover:text-[var(--fg-default)] ${accentColor}`}
        >
          {React.isValidElement(Icon)
            ? React.cloneElement(Icon as React.ReactElement, {
                className: "h-5 w-5",
              })
            : Icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--fg-default)]">
              {label}
            </span>
            {badge && (
              <span className="rounded-full bg-[var(--c-brand-600)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--c-brand-400)]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[var(--fg-subtle)]">{description}</p>
          )}
        </div>
      </div>

      <div className="text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--fg-default)]">
        {type === "external" ? (
          <ExternalLink size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </div>
    </button>
  );
};

const UserProfileCard = () => (
  <div className="mb-8 flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)] p-5">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[var(--border-muted)] bg-[var(--bg-surface-overlay)]">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="User"
          />
        </div>
        <div className="absolute right-0 bottom-0 h-4 w-4 rounded-full border-2 border-[var(--bg-surface-raised)] bg-[var(--c-brand-500)]"></div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[var(--fg-default)]">
          Creator One
        </h2>
        <p className="text-xs text-[var(--fg-muted)]">Pro Plan • ID: 882910</p>
      </div>
    </div>
    <button className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--fg-default)]">
      <LogOut size={18} />
    </button>
  </div>
);

// --- Subpage: Providers ---

const ProviderCard = ({
  name,
  id,
  isConnected,
  onClick,
}: {
  name: string;
  id: string;
  isConnected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)] p-4 transition-all hover:border-[var(--border-muted)] hover:bg-[var(--bg-surface-overlay)]"
  >
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] ${isConnected ? "text-[var(--c-brand-400)]" : "text-[var(--fg-subtle)]"}`}
      >
        <Zap size={18} />
      </div>
      <div className="text-left">
        <h4 className="text-sm font-bold text-[var(--fg-default)]">{name}</h4>
        <p className="text-xs text-[var(--fg-muted)]">
          {isConnected ? "Connected" : "Not configured"}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {isConnected && (
        <div className="flex items-center gap-1 rounded-full bg-[var(--c-brand-600)]/10 px-2 py-1 text-[10px] font-bold text-[var(--c-brand-400)]">
          <Check size={12} /> Active
        </div>
      )}
      <ChevronRight
        size={16}
        className="text-[var(--fg-subtle)] group-hover:text-[var(--fg-default)]"
      />
    </div>
  </button>
);

const ConnectProviderDialog = ({
  isOpen,
  onClose,
  provider,
}: {
  isOpen: boolean;
  onClose: () => void;
  provider: { name: string; id: string; isConnected: boolean };
}) => {
  if (!isOpen || !provider) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)] p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--fg-default)]">
              Connect {provider.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Enter your API key to enable this provider.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--fg-subtle)] hover:text-[var(--fg-default)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--fg-subtle)]">
              API Key
            </label>
            <div className="relative flex items-center">
              <Key
                size={16}
                className="absolute left-3 text-[var(--fg-subtle)]"
              />
              <input
                type="password"
                placeholder="sk-..."
                className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pr-4 pl-9 text-sm text-[var(--fg-default)] placeholder-[var(--fg-subtle)] focus:border-[var(--c-brand-500)] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--fg-muted)]">
            <span className="font-bold text-[var(--fg-default)]">Note:</span>{" "}
            Keys are stored locally on your device using AES-256 encryption.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 text-sm font-medium text-[var(--fg-default)] hover:bg-[var(--bg-hover)]"
            >
              Cancel
            </button>
            <button className="flex-1 rounded-lg bg-[var(--c-brand-600)] py-2.5 text-sm font-bold text-white shadow-[var(--c-brand-600)]/20 shadow-lg hover:bg-[var(--c-brand-500)]">
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProvidersView = () => {
  const [selectedProvider, setSelectedProvider] = useState<{
    name: string;
    id: string;
    isConnected: boolean;
  } | null>(null);

  const providers = [
    { id: "openai", name: "OpenAI", isConnected: true },
    { id: "anthropic", name: "Anthropic", isConnected: false },
    { id: "deepseek", name: "DeepSeek", isConnected: false },
    { id: "mistral", name: "Mistral AI", isConnected: false },
    { id: "local", name: "Local Inference (Ollama)", isConnected: true },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <p className="text-sm leading-relaxed text-[var(--fg-muted)]">
          Configure external model providers. Requests are sent directly from
          your browser to the provider API.
        </p>
      </div>

      <div className="space-y-3">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            name={p.name}
            id={p.id}
            isConnected={p.isConnected}
            onClick={() => setSelectedProvider(p)}
          />
        ))}
      </div>

      <ConnectProviderDialog
        isOpen={!!selectedProvider}
        provider={
          selectedProvider as { name: string; id: string; isConnected: boolean }
        }
        onClose={() =>
          setSelectedProvider(
            null as unknown as {
              name: string;
              id: string;
              isConnected: boolean;
            },
          )
        }
      />
    </div>
  );
};

// --- Main Settings Controller ---

export default function SettingsPage() {
  // State: 'index' | 'account' | 'providers' | 'advanced' | 'legal'
  const [currentView, setCurrentView] = useState("index");

  // --- Helper to render header based on view ---
  const renderHeader = () => {
    if (currentView === "index") {
      return (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--fg-default)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Manage your account and application preferences.
          </p>
        </div>
      );
    }

    // Subpage Header
    const titles = {
      account: "Account & Subscription",
      providers: "Model Providers",
      advanced: "Advanced Preferences",
      legal: "Legal",
    };

    return (
      <div className="mb-8 flex items-center gap-2">
        <button
          onClick={() => setCurrentView("index")}
          className="group -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-surface-overlay)] hover:text-[var(--fg-default)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-[var(--fg-default)]">
          {titles[currentView as keyof typeof titles]}
        </h1>
      </div>
    );
  };

  // --- Helper to render content ---
  const renderContent = () => {
    switch (currentView) {
      case "providers":
        return <ProvidersView />;
      case "account":
      case "advanced":
      case "legal":
        return (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-20 text-center">
            <div className="mb-4 rounded-full bg-[var(--bg-surface-overlay)] p-4 text-[var(--fg-subtle)]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-medium text-[var(--fg-default)]">
              Work in Progress
            </h3>
            <p className="text-sm text-[var(--fg-muted)]">
              The {currentView} page is under construction.
            </p>
            <button
              onClick={() => setCurrentView("index")}
              className="mt-6 text-xs font-bold text-[var(--c-brand-400)] hover:text-[var(--c-brand-500)]"
            >
              Go Back
            </button>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <UserProfileCard />

            {/* 1. APP PREFERENCES */}
            <section>
              <SectionTitle title="App Preferences" />
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)]">
                <SettingsItem
                  icon={<User size={18} />}
                  label="Account & Subscription"
                  description="Manage profile, billing, and plan details"
                  onClick={() => setCurrentView("account")}
                />
                <SettingsItem
                  icon={<Cpu size={18} />}
                  label="Providers"
                  description="Configure local LLM backends and API keys"
                  onClick={() => setCurrentView("providers")}
                />
                <SettingsItem
                  icon={<Sliders size={18} />}
                  label="Advanced Preferences"
                  description="System usage, memory limits, and dev tools"
                  accentColor="text-[var(--c-brand-400)]"
                  onClick={() => setCurrentView("advanced")}
                />
              </div>
            </section>

            {/* 2. COMMUNITY */}
            <section>
              <SectionTitle title="Community" />
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)]">
                <SettingsItem
                  icon={<MessageCircle size={18} />}
                  label="Join our Discord"
                  description="Connect with other creators"
                  type="external"
                  onClick={() => window.open("https://discord.gg", "_blank")}
                />
                <SettingsItem
                  icon={<Sparkles size={18} />}
                  label="Visit Reddit"
                  description="r/LocalLLM discussion"
                  type="external"
                  onClick={() => window.open("https://reddit.com", "_blank")}
                />
              </div>
            </section>

            {/* 3. SUPPORT */}
            <section>
              <SectionTitle title="Support" />
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-raised)]">
                <SettingsItem
                  icon={<BookOpen size={18} />}
                  label="User Manual"
                  description="Documentation and guides"
                  type="external"
                  onClick={() => window.open("/docs", "_blank")}
                />
                <SettingsItem
                  icon={<Info size={18} />}
                  label="About astrsk.ai"
                  description="Version 2.0.4 (Build 2405)"
                  onClick={() => console.log("Open About Modal")}
                />
                <SettingsItem
                  icon={<Scale size={18} />}
                  label="Legal"
                  description="Privacy policy and terms of service"
                  onClick={() => setCurrentView("legal")}
                />
              </div>
            </section>

            {/* Footer Area */}
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="flex items-center gap-2 text-[var(--fg-muted)]">
                <ShieldCheck size={16} className="text-[var(--c-brand-500)]" />
                <span className="text-xs font-medium">
                  Your sessions are stored locally on your device.
                </span>
              </div>
              <p className="text-[10px] text-[var(--fg-subtle)]">
                © 2024 ASTRSK AI Inc. All rights reserved.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{
        backgroundColor: "var(--bg-canvas)",
        color: "var(--fg-default)",
      }}
    >
      <DesignSystemGlobalStyles />
      <main className="animate-in fade-in mx-auto max-w-3xl px-4 py-8 duration-300 md:px-0">
        {renderHeader()}
        {renderContent()}
      </main>
    </div>
  );
}
