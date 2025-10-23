import type { Meta, StoryObj } from "@storybook/react";
import { FloatingActionButton } from "@/shared/ui/floating-action-button";
import { SidebarLeftProvider } from "@/components-v2/both-sidebar";
import { Plus, Edit, Search, Upload, Download, Share2, Settings, MessageCircle } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/FloatingActionButton",
  component: FloatingActionButton,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top-left", "top-right"],
    },
  },
  decorators: [
    (Story) => (
      <SidebarLeftProvider defaultOpen={false}>
        <div className="relative h-[400px] w-full bg-background">
          <Story />
        </div>
      </SidebarLeftProvider>
    ),
  ],
} satisfies Meta<typeof FloatingActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    position: "top-right",
    icon: <Plus className="min-w-6 min-h-6" />,
    label: "Add New",
  },
};

export const TopLeft: Story = {
  args: {
    position: "top-left",
    icon: <Edit className="min-w-6 min-h-6" />,
    label: "Edit",
  },
};

export const TopRight: Story = {
  args: {
    position: "top-right",
    icon: <Search className="min-w-6 min-h-6" />,
    label: "Search",
  },
};

export const DifferentIcons: Story = {
  args: {
    position: "top-right",
  },
  render: () => (
    <>
      <FloatingActionButton
        position="top-right"
        icon={<Upload className="min-w-6 min-h-6" />}
        label="Upload"
        style={{ right: "32px" }}
      />
      <FloatingActionButton
        position="top-right"
        icon={<Download className="min-w-6 min-h-6" />}
        label="Download"
        style={{ right: "88px" }}
      />
      <FloatingActionButton
        position="top-right"
        icon={<Share2 className="min-w-6 min-h-6" />}
        label="Share"
        style={{ right: "144px" }}
      />
    </>
  ),
};

export const WithCustomStyling: Story = {
  args: {
    position: "top-right",
    icon: <Settings className="min-w-6 min-h-6" />,
    label: "Settings",
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
};

export const Interactive: Story = {
  args: {
    position: "top-right",
  },
  render: () => {
    const [count, setCount] = React.useState(0);
    
    return (
      <div>
        <FloatingActionButton
          position="top-right"
          icon={<Plus className="min-w-6 min-h-6" />}
          label="Add Item"
          onClick={() => setCount(count + 1)}
        />
        <div className="p-8">
          <p className="text-lg">Items added: {count}</p>
        </div>
      </div>
    );
  },
};

export const MultipleButtons: Story = {
  args: {
    position: "top-right",
  },
  render: () => (
    <div className="space-y-4">
      <FloatingActionButton
        position="top-left"
        icon={<Edit className="min-w-6 min-h-6" />}
        label="Edit Mode"
      />
      <FloatingActionButton
        position="top-right"
        icon={<Plus className="min-w-6 min-h-6" />}
        label="Add New"
      />
      <div style={{ position: "absolute", top: "72px", right: "32px" }}>
        <FloatingActionButton
          position="top-right"
          icon={<MessageCircle className="min-w-6 min-h-6" />}
          label="Chat"
          style={{ position: "relative", top: 0, right: 0 }}
        />
      </div>
    </div>
  ),
};

export const WithLongLabel: Story = {
  args: {
    position: "top-right",
    icon: <Plus className="min-w-6 min-h-6" />,
    label: "Create New Document",
  },
};

export const CompactVersion: Story = {
  args: {
    position: "top-right",
    icon: <Plus className="min-w-4 min-h-4" />,
    label: "Add",
    className: "min-w-[32px] h-[32px]",
  },
};

export const LargeVersion: Story = {
  args: {
    position: "top-right",
    icon: <Plus className="min-w-8 min-h-8" />,
    label: "Create",
    className: "min-w-[56px] h-[56px] text-lg",
  },
};

export const ColorVariants: Story = {
  args: {
    position: "top-right",
  },
  render: () => (
    <>
      <FloatingActionButton
        position="top-right"
        icon={<Plus className="min-w-6 min-h-6" />}
        label="Primary"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        style={{ right: "32px" }}
      />
      <FloatingActionButton
        position="top-right"
        icon={<Plus className="min-w-6 min-h-6" />}
        label="Secondary"
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        style={{ right: "120px" }}
      />
      <FloatingActionButton
        position="top-right"
        icon={<Plus className="min-w-6 min-h-6" />}
        label="Destructive"
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        style={{ right: "224px" }}
      />
    </>
  ),
};

export const DisabledState: Story = {
  args: {
    position: "top-right",
    icon: <Plus className="min-w-6 min-h-6" />,
    label: "Disabled",
    disabled: true,
  },
};