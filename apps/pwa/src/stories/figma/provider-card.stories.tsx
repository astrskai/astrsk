import type { Meta, StoryObj } from "@storybook/react";
import { ProviderListItem, ProviderListItemDetail } from "@/components-v2/model/provider-list-item";
import { ApiSource } from "@/entities/api/domain";
import React from "react";

/**
 * Provider Card Component (Desktop)
 * 
 * Figma Design Reference:
 * https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-373840&m=dev
 */
const meta = {
  title: "Figma/ProviderCard",
  component: ProviderListItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Provider card component for desktop settings page, showing AI provider options and connection status.
        
**Figma Design:** <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-373840&m=dev" target="_blank" rel="noopener noreferrer">View in Figma</a>`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    apiSource: {
      control: "select",
      options: Object.values(ApiSource),
      description: "The API provider source",
    },
    isActive: {
      control: "boolean",
      description: "Whether the provider is connected/active",
    },
    hideButton: {
      control: "boolean",
      description: "Hide the edit/disconnect buttons",
    },
  },
} satisfies Meta<typeof ProviderListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-373840&m=dev
export const NotConnected: Story = {
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: false,
  },
};

export const Connected: Story = {
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: true,
    details: [
      { label: "API Key", value: "sk-...4567" },
      { label: "Model", value: "gpt-4o" },
    ],
  },
};

export const AstrskAiNotConnected: Story = {
  args: {
    apiSource: ApiSource.AstrskAi,
    isActive: false,
  },
};

export const AstrskAiConnected: Story = {
  args: {
    apiSource: ApiSource.AstrskAi,
    isActive: true,
  },
};

export const AnthropicConnected: Story = {
  args: {
    apiSource: ApiSource.Anthropic,
    isActive: true,
    details: [
      { label: "API Key", value: "sk-ant-...8901" },
      { label: "Model", value: "claude-3-opus-20240229" },
    ],
  },
};

export const GoogleAIConnected: Story = {
  args: {
    apiSource: ApiSource.GoogleGenerativeAI,
    isActive: true,
    details: [
      { label: "API Key", value: "AIza...xyz" },
      { label: "Model", value: "gemini-1.5-pro" },
    ],
  },
};

export const WithoutButtons: Story = {
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: true,
    details: [
      { label: "API Key", value: "sk-...4567" },
      { label: "Model", value: "gpt-4o" },
    ],
    hideButton: true,
  },
};

export const AllProviders: Story = {
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: false,
  },
  render: () => {
    const providers = [
      { source: ApiSource.AstrskAi, connected: true },
      { source: ApiSource.OpenAI, connected: true },
      { source: ApiSource.GoogleGenerativeAI, connected: false },
      { source: ApiSource.Anthropic, connected: true },
      { source: ApiSource.DeepSeek, connected: false },
      { source: ApiSource.Mistral, connected: false },
      { source: ApiSource.xAI, connected: true },
      { source: ApiSource.OpenRouter, connected: false },
    ];

    const getDetails = (source: ApiSource): ProviderListItemDetail[] => {
      if (source === ApiSource.AstrskAi) return [];
      
      const modelMap: Record<string, string> = {
        [ApiSource.OpenAI]: "gpt-4o",
        [ApiSource.Anthropic]: "claude-3-opus",
        [ApiSource.GoogleGenerativeAI]: "gemini-1.5-pro",
        [ApiSource.xAI]: "grok-beta",
      };

      return [
        { label: "API Key", value: "***" + source.slice(-4) },
        { label: "Model", value: modelMap[source] || "default" },
      ];
    };

    return (
      <div className="grid grid-cols-2 gap-4">
        {providers.map(({ source, connected }) => (
          <ProviderListItem
            key={source}
            apiSource={source}
            isActive={connected}
            details={connected ? getDetails(source) : undefined}
            onOpenEdit={() => console.log(`Edit ${source}`)}
            onDisconnect={(resources) => console.log(`Disconnect ${source}`, resources)}
          />
        ))}
      </div>
    );
  },
};

export const Interactive: Story = {
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: false,
  },
  render: () => {
    const [connectedProviders, setConnectedProviders] = React.useState<Set<ApiSource>>(
      new Set([ApiSource.AstrskAi, ApiSource.OpenAI])
    );

    const toggleConnection = (source: ApiSource) => {
      setConnectedProviders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(source)) {
          newSet.delete(source);
        } else {
          newSet.add(source);
        }
        return newSet;
      });
    };

    const providers = [
      ApiSource.AstrskAi,
      ApiSource.OpenAI,
      ApiSource.Anthropic,
      ApiSource.GoogleGenerativeAI,
    ];

    const getDetails = (source: ApiSource): ProviderListItemDetail[] => {
      if (source === ApiSource.AstrskAi) return [];
      
      return [
        { label: "API Key", value: "sk-...demo" },
        { label: "Status", value: "Active" },
      ];
    };

    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Click on cards to toggle connection state
        </p>
        <div className="grid grid-cols-2 gap-4">
          {providers.map((source) => (
            <ProviderListItem
              key={source}
              apiSource={source}
              isActive={connectedProviders.has(source)}
              details={connectedProviders.has(source) ? getDetails(source) : undefined}
              onOpenEdit={() => toggleConnection(source)}
              onDisconnect={(resources) => {
                console.log(`Disconnect ${source}`, resources);
                toggleConnection(source);
              }}
            />
          ))}
        </div>
      </div>
    );
  },
};

export const Hover: Story = {
  parameters: {
    pseudo: { hover: true },
  },
  args: {
    apiSource: ApiSource.OpenAI,
    isActive: true,
    details: [
      { label: "API Key", value: "sk-...4567" },
      { label: "Model", value: "gpt-4o" },
    ],
  },
};