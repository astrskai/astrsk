import type { Meta, StoryObj } from "@storybook/react";
import { SvgIcon } from "@/components-v2/svg-icon";

const meta = {
  title: "Components/SvgIcon",
  component: SvgIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: [
        "sessions",
        "sessions_solid",
        "cards",
        "cards_solid",
        "agents",
        "agents_solid",
        "providers",
        "providers_solid",
        "left_navigation_logo",
        "export",
        "edit",
        "edit_solid",
        "discord",
        "reddit_mono",
        "reddit_color",
        "settings_solid",
        "openai_logo",
        "google_ai_studio_logo",
        "anthropic_logo",
        "deepseek_logo",
        "mistral_logo",
        "xai_logo",
        "openrouter_logo",
        "ollama_logo",
        "koboldcpp_logo",
        "aihorde_logo",
        "cohere_logo",
        "lock",
        "lock_solid",
        "character_icon",
        "plot_icon",
        "android_logo",
        "message_style",
        "history_message",
        "zoom_fit",
        "preview",
        "window_minimize",
        "window_maximize",
        "window_close",
        "astrsk_symbol",
        "astrsk_symbol_fit",
        "astrsk_logo_full",
        "astrsk_logo_typo",
        "rotate",
      ],
    },
    size: {
      control: { type: "number", min: 16, max: 128, step: 4 },
    },
  },
} satisfies Meta<typeof SvgIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "astrsk_symbol",
    size: 24,
  },
};

export const NavigationIcons: Story = {
  args: {
    name: "sessions",
    size: 32,
  },
  render: () => (
    <div className="grid grid-cols-4 gap-8 text-center">
      <div className="space-y-2">
        <SvgIcon name="sessions" size={32} />
        <p className="text-sm">sessions</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="sessions_solid" size={32} />
        <p className="text-sm">sessions_solid</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="cards" size={32} />
        <p className="text-sm">cards</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="cards_solid" size={32} />
        <p className="text-sm">cards_solid</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="agents" size={32} />
        <p className="text-sm">agents</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="agents_solid" size={32} />
        <p className="text-sm">agents_solid</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="providers" size={32} />
        <p className="text-sm">providers</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="providers_solid" size={32} />
        <p className="text-sm">providers_solid</p>
      </div>
    </div>
  ),
};

export const ProviderLogos: Story = {
  args: {
    name: "openai_logo",
    size: 48,
  },
  render: () => (
    <div className="grid grid-cols-4 gap-8 text-center">
      <div className="space-y-2">
        <SvgIcon name="openai_logo" size={48} />
        <p className="text-sm">OpenAI</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="anthropic_logo" size={48} />
        <p className="text-sm">Anthropic</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="google_ai_studio_logo" size={48} />
        <p className="text-sm">Google AI</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="deepseek_logo" size={48} />
        <p className="text-sm">DeepSeek</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="mistral_logo" size={48} />
        <p className="text-sm">Mistral</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="xai_logo" size={48} />
        <p className="text-sm">xAI</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="openrouter_logo" size={48} />
        <p className="text-sm">OpenRouter</p>
      </div>
      <div className="space-y-2">
        <SvgIcon name="ollama_logo" size={48} />
        <p className="text-sm">Ollama</p>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  args: {
    name: "astrsk_logo_full",
    size: 32,
  },
  render: () => (
    <div className="flex items-center gap-4">
      <SvgIcon name="astrsk_logo_full" size={16} />
      <SvgIcon name="astrsk_logo_full" size={24} />
      <SvgIcon name="astrsk_logo_full" size={32} />
      <SvgIcon name="astrsk_logo_full" size={48} />
      <SvgIcon name="astrsk_logo_full" size={64} />
      <SvgIcon name="astrsk_logo_full" size={96} />
    </div>
  ),
};

export const BrandIcons: Story = {
  args: {
    name: "astrsk_symbol",
    size: 48,
  },
  render: () => (
    <div className="space-y-8">
      <div className="flex items-center gap-8">
        <SvgIcon name="astrsk_symbol" size={48} />
        <SvgIcon name="astrsk_symbol_fit" size={48} />
        <SvgIcon name="astrsk_logo_full" size={48} />
        <SvgIcon name="astrsk_logo_typo" size={48} />
      </div>
      <div className="flex items-center gap-8">
        <SvgIcon name="discord" size={32} />
        <SvgIcon name="reddit_mono" size={32} />
        <SvgIcon name="reddit_color" size={32} />
        <SvgIcon name="android_logo" size={32} />
      </div>
    </div>
  ),
};

export const ActionIcons: Story = {
  args: {
    name: "edit",
    size: 24,
  },
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <SvgIcon name="edit" size={24} />
      <SvgIcon name="edit_solid" size={24} />
      <SvgIcon name="export" size={24} />
      <SvgIcon name="lock" size={24} />
      <SvgIcon name="lock_solid" size={24} />
      <SvgIcon name="settings_solid" size={24} />
      <SvgIcon name="message_style" size={24} />
      <SvgIcon name="history_message" size={24} />
      <SvgIcon name="zoom_fit" size={24} />
      <SvgIcon name="preview" size={24} />
    </div>
  ),
};

export const WindowControls: Story = {
  args: {
    name: "window_minimize",
    size: 16,
  },
  render: () => (
    <div className="flex items-center gap-2 p-2 bg-muted rounded">
      <SvgIcon name="window_minimize" size={16} />
      <SvgIcon name="window_maximize" size={16} />
      <SvgIcon name="window_close" size={16} />
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    name: "edit",
    size: 32,
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Click the icons below:</p>
      <div className="flex gap-4">
        <SvgIcon
          name="edit"
          size={32}
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={() => alert("Edit clicked!")}
        />
        <SvgIcon
          name="export"
          size={32}
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={() => alert("Export clicked!")}
        />
        <SvgIcon
          name="settings_solid"
          size={32}
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={() => alert("Settings clicked!")}
        />
      </div>
    </div>
  ),
};

export const StyledIcons: Story = {
  args: {
    name: "astrsk_logo_full",
    size: 32,
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <SvgIcon name="astrsk_logo_full" size={32} className="text-primary" />
        <SvgIcon name="astrsk_logo_full" size={32} className="text-destructive" />
        <SvgIcon name="astrsk_logo_full" size={32} className="text-green-500" />
        <SvgIcon name="astrsk_logo_full" size={32} className="text-purple-500" />
      </div>
      <div className="flex gap-4">
        <SvgIcon name="agents" size={32} className="animate-pulse" />
        <SvgIcon name="cards" size={32} className="animate-bounce" />
        <SvgIcon name="sessions" size={32} className="animate-spin" />
      </div>
    </div>
  ),
};

export const InContext: Story = {
  args: {
    name: "sessions",
    size: 20,
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
        <SvgIcon name="sessions" size={20} />
        <span>Start New Session</span>
      </div>
      <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
        <SvgIcon name="cards" size={20} />
        <span>Browse Cards</span>
      </div>
      <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
        <SvgIcon name="agents" size={20} />
        <span>Manage Agents</span>
      </div>
      <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
        <SvgIcon name="providers" size={20} />
        <span>Configure Providers</span>
      </div>
    </div>
  ),
};

export const AllIcons: Story = {
  args: {
    name: "sessions",
    size: 24,
  },
  render: () => {
    const allIcons = [
      "sessions", "sessions_solid", "cards", "cards_solid",
      "agents", "agents_solid", "providers", "providers_solid",
      "left_navigation_logo", "export", "edit", "edit_solid",
      "discord", "reddit_mono", "reddit_color",
      "settings_solid", "openai_logo", "google_ai_studio_logo",
      "anthropic_logo", "deepseek_logo", "mistral_logo", "xai_logo",
      "openrouter_logo", "ollama_logo", "koboldcpp_logo", "aihorde_logo",
      "cohere_logo", "lock", "lock_solid", "character_icon", "plot_icon",
      "android_logo", "message_style", "history_message", "zoom_fit",
      "preview", "window_minimize", "window_maximize", "window_close",
      "astrsk_symbol", "astrsk_symbol_fit", "astrsk_logo_full", "astrsk_logo_typo",
      "rotate",
    ] as const;

    return (
      <div className="grid grid-cols-8 gap-4">
        {allIcons.map((icon) => (
          <div key={icon} className="text-center space-y-2">
            <div className="p-2 border rounded hover:bg-muted">
              <SvgIcon name={icon} size={24} />
            </div>
            <p className="text-xs truncate">{icon}</p>
          </div>
        ))}
      </div>
    );
  },
};