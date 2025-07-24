import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components-v2/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/shared/utils";
import React from "react";

/**
 * Send Button Component
 * 
 * Figma Design References:
 * - https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236122&m=dev
 * - https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-235780&m=dev
 */
const meta = {
  title: "Figma/SendButton",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Send button component used in session message input for both desktop and mobile.
        
**Figma Designs:** 
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236122&m=dev" target="_blank" rel="noopener noreferrer">Original Design</a>
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-235780&m=dev" target="_blank" rel="noopener noreferrer">Additional Reference</a>`,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Desktop Send Button Component
const DesktopSendButton = ({ disabled = false, onClick }: { disabled?: boolean; onClick?: () => void }) => (
  <Button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "h-[40px] bg-background-surface-3 text-text-primary",
      "hover:bg-background-card hover:text-text-primary",
      "disabled:bg-background-surface-3 disabled:text-text-primary",
    )}
  >
    <Send />
    Send
  </Button>
);

// Mobile Send Button Component
const MobileSendButton = ({ disabled = false, onClick }: { disabled?: boolean; onClick?: () => void }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "w-[50px] h-[40px] rounded-full flex items-center justify-center bg-background-card text-text-primary",
      "hover:bg-background-card hover:text-text-primary",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <Send className="max-w-[18px] max-h-[18px]" />
  </button>
);

// Figma References:
// - https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236122&m=dev
// - https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-235780&m=dev
export const Desktop: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Normal state</p>
        <DesktopSendButton onClick={() => console.log("Send clicked")} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Disabled state</p>
        <DesktopSendButton disabled onClick={() => console.log("Send clicked")} />
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Normal state</p>
        <MobileSendButton onClick={() => console.log("Send clicked")} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Disabled state</p>
        <MobileSendButton disabled onClick={() => console.log("Send clicked")} />
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-2">Desktop Input with Send Button</p>
        <div className="flex gap-2 p-4 bg-background-surface-2 rounded-lg">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-background-surface-3 rounded-md text-text-primary placeholder:text-text-placeholder"
          />
          <DesktopSendButton onClick={() => console.log("Send clicked")} />
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">Mobile Input with Send Button</p>
        <div className="bg-background-surface-2 p-2 rounded-full flex items-center gap-2 max-w-[350px]">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-transparent text-text-primary placeholder:text-text-placeholder"
          />
          <MobileSendButton onClick={() => console.log("Send clicked")} />
        </div>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [message, setMessage] = React.useState("");
    const [messages, setMessages] = React.useState<string[]>([]);
    
    const handleSend = () => {
      if (message.trim()) {
        setMessages([...messages, message]);
        setMessage("");
      }
    };
    
    return (
      <div className="w-[400px] space-y-4">
        <div className="bg-background-surface-1 p-4 rounded-lg h-[200px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-text-placeholder text-sm">No messages yet. Type something and click send!</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-2 bg-background-surface-2 rounded text-sm">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-background-surface-3 rounded-md text-text-primary placeholder:text-text-placeholder"
          />
          <DesktopSendButton 
            disabled={!message.trim()} 
            onClick={handleSend}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Press Enter to send, or click the send button
        </p>
      </div>
    );
  },
};