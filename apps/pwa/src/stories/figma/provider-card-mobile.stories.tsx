import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent } from "@/shared/ui";
import { SvgIcon, IconName } from "@/components-v2/svg-icon";
import { cn } from "@/shared/lib";
import React from "react";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain";

/**
 * Provider Card Mobile Component
 * 
 * Figma Design References:
 * - General Provider Card: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201340&m=dev
 * - Not Connected State: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201334&m=dev
 * - AstrskAi Special Card: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201360&m=dev
 */

// Logo mapping from the actual implementation
const apiSourceLogo = new Map<ApiSource, IconName>([
  [ApiSource.AstrskAi, "astrsk_symbol"],
  [ApiSource.OpenAI, "openai_logo"],
  [ApiSource.GoogleGenerativeAI, "google_ai_studio_logo"],
  [ApiSource.Anthropic, "anthropic_logo"],
  [ApiSource.DeepSeek, "deepseek_logo"],
  [ApiSource.Mistral, "mistral_logo"],
  [ApiSource.xAI, "xai_logo"],
  [ApiSource.OpenRouter, "openrouter_logo"],
  [ApiSource.Ollama, "ollama_logo"],
  [ApiSource.KoboldCPP, "koboldcpp_logo"],
  [ApiSource.AIHorde, "aihorde_logo"],
  [ApiSource.Cohere, "cohere_logo"],
]);

// Typography components used in the actual implementation
const TypoTiny = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("text-[11px] leading-[14px] font-[500]", className)}>{children}</div>
);

const TypoSmall = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("text-[14px] leading-[18px] font-[400]", className)}>{children}</div>
);

// Mobile Provider Card Component - Non-connected state
const ProviderCardMobileBasic = ({ source, onClick }: { source: ApiSource; onClick?: () => void }) => {
  const providerName = apiSourceLabel.get(source) ?? source;
  const logo = apiSourceLogo.get(source);

  return (
    <Card
      className={cn(
        "group/card relative rounded-[8px] overflow-hidden cursor-pointer",
        "border border-border-container",
        source === ApiSource.AstrskAi &&
          "bg-button-foreground-primary border-border-light",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 bg-background-surface-3">
        <div className="flex items-center gap-3">
          {logo && <SvgIcon name={logo} size={32} />}
          <div className="font-[600] text-[20px] leading-[24px] text-text-primary">
            {providerName}
          </div>
        </div>
      </CardContent>
      <div
        className={cn(
          "absolute inset-0 rounded-[8px] pointer-events-none",
          "inset-ring-2 inset-ring-primary-normal",
          "hidden group-hover/card:block",
        )}
      />
    </Card>
  );
};

// Mobile Provider Card Component - Connected state
const ProviderCardMobileConnected = ({ 
  source, 
  details = [],
  onClick 
}: { 
  source: ApiSource; 
  details?: Array<{ label: string; value: string }>;
  onClick?: () => void;
}) => {
  const providerName = apiSourceLabel.get(source) ?? source;
  const logo = apiSourceLogo.get(source);

  return (
    <Card
      className={cn(
        "group/card relative rounded-[8px] overflow-hidden cursor-pointer",
        "border border-border-container",
        "bg-background-surface-3",
        source === ApiSource.AstrskAi &&
          "bg-button-foreground-primary border-border-light",
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 flex flex-row">
        {/* Left panel - main content */}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-3">
            {logo && <SvgIcon name={logo} size={32} />}
            <div className="font-[600] text-[20px] leading-[24px] text-text-primary">
              {providerName}
            </div>
          </div>

          {/* Show details for non-astrsk providers or promotional text for astrsk */}
          {source === ApiSource.AstrskAi ? (
            <div className="font-[600] text-[12px] leading-[15.6px] text-text-input-subtitle">
              To mark our v1.0 release,
              <br />
              <span className="text-text-muted-title">
                Gemini 2.5 Flash is on the house
              </span>
              <br />
              for all users for a limited period!
            </div>
          ) : (
            details.length > 0 && (
              <div className="space-y-2">
                {details.map((detail) => (
                  <div key={detail.label} className="flex flex-col gap-1">
                    <TypoTiny className="text-text-input-subtitle">
                      {detail.label}
                    </TypoTiny>
                    <TypoSmall className="text-text-primary truncate">
                      {detail.value}
                    </TypoSmall>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right panel - indicator/status */}
        <div
          className={cn(
            "min-w-[40px] flex flex-col justify-center items-center",
            "bg-background-surface-2",
            source === ApiSource.AstrskAi && "bg-primary-dark",
          )}
        >
          <div
            className="w-2 h-2 rounded-full bg-green-500"
            title="Connected"
          />
        </div>
      </CardContent>
      <div
        className={cn(
          "absolute inset-0 rounded-[8px] pointer-events-none",
          "inset-ring-2 inset-ring-primary-normal",
          "hidden group-hover/card:block",
        )}
      />
    </Card>
  );
};

const meta = {
  title: "Figma/ProviderCardMobile",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Provider card component for mobile, showing AI provider options and connection status.
        
**Figma Design References:**
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201340&m=dev" target="_blank" rel="noopener noreferrer">General Provider Card</a>
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201334&m=dev" target="_blank" rel="noopener noreferrer">Not Connected State</a>
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201360&m=dev" target="_blank" rel="noopener noreferrer">AstrskAi Special Card</a>`,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma References:
// - General: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201340&m=dev
// - Not Connected: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201334&m=dev
// - AstrskAi Special: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-201360&m=dev
export const NotConnected: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <ProviderCardMobileBasic 
        source={ApiSource.OpenAI} 
        onClick={() => console.log("OpenAI clicked")}
      />
      <ProviderCardMobileBasic 
        source={ApiSource.Anthropic} 
        onClick={() => console.log("Anthropic clicked")}
      />
      <ProviderCardMobileBasic 
        source={ApiSource.AstrskAi} 
        onClick={() => console.log("AstrskAi clicked")}
      />
    </div>
  ),
};

export const Connected: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <ProviderCardMobileConnected 
        source={ApiSource.OpenAI}
        details={[
          { label: "API Key", value: "sk-...4567" },
          { label: "Model", value: "gpt-4o" }
        ]}
        onClick={() => console.log("OpenAI clicked")}
      />
      <ProviderCardMobileConnected 
        source={ApiSource.Anthropic}
        details={[
          { label: "API Key", value: "sk-ant-...8901" },
          { label: "Model", value: "claude-3-opus" }
        ]}
        onClick={() => console.log("Anthropic clicked")}
      />
      <ProviderCardMobileConnected 
        source={ApiSource.AstrskAi}
        onClick={() => console.log("AstrskAi clicked")}
      />
    </div>
  ),
};

export const AstrskAiSpecial: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Not Connected</p>
        <ProviderCardMobileBasic 
          source={ApiSource.AstrskAi} 
          onClick={() => console.log("AstrskAi clicked")}
        />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Connected</p>
        <ProviderCardMobileConnected 
          source={ApiSource.AstrskAi}
          onClick={() => console.log("AstrskAi clicked")}
        />
      </div>
    </div>
  ),
};

export const AllProviders: Story = {
  render: () => {
    const providers = [
      ApiSource.AstrskAi,
      ApiSource.OpenAI,
      ApiSource.GoogleGenerativeAI,
      ApiSource.Anthropic,
      ApiSource.DeepSeek,
      ApiSource.Mistral,
      ApiSource.xAI,
      ApiSource.OpenRouter,
    ];

    return (
      <div className="w-[350px] space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Not Connected</h3>
          <div className="space-y-2">
            {providers.slice(0, 4).map((source) => (
              <ProviderCardMobileBasic 
                key={source}
                source={source} 
                onClick={() => console.log(`${source} clicked`)}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-3">Connected</h3>
          <div className="space-y-2">
            {providers.slice(4).map((source) => (
              <ProviderCardMobileConnected 
                key={source}
                source={source}
                details={
                  source !== ApiSource.AstrskAi ? [
                    { label: "API Key", value: "***" + source.slice(-4) },
                    { label: "Status", value: "Active" }
                  ] : []
                }
                onClick={() => console.log(`${source} clicked`)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [connectedProviders, setConnectedProviders] = React.useState<Set<ApiSource>>(
      new Set([ApiSource.AstrskAi])
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

    return (
      <div className="w-[350px]">
        <p className="text-sm text-muted-foreground mb-4">
          Click on cards to toggle connection state
        </p>
        <div className="space-y-2">
          {providers.map((source) => 
            connectedProviders.has(source) ? (
              <ProviderCardMobileConnected
                key={source}
                source={source}
                details={
                  source !== ApiSource.AstrskAi ? [
                    { label: "API Key", value: "sk-...demo" },
                    { label: "Model", value: "Default" }
                  ] : []
                }
                onClick={() => toggleConnection(source)}
              />
            ) : (
              <ProviderCardMobileBasic
                key={source}
                source={source}
                onClick={() => toggleConnection(source)}
              />
            )
          )}
        </div>
      </div>
    );
  },
};