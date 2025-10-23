import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "@/components-v2/tooltip";
import React from "react";
import { Button } from "@/shared/ui/button";
import { Info, HelpCircle, AlertCircle, CheckCircle } from "lucide-react";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "This is a tooltip",
    children: <Button>Hover me</Button>,
  },
};

export const Positions: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <Tooltip content="Top tooltip" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      
      <Tooltip content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      
      <Tooltip content="Left tooltip" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
    </div>
  ),
};

export const Alignments: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div className="space-y-8">
      <div className="flex gap-4">
        <Tooltip content="Start aligned" side="top" align="start">
          <Button variant="outline" className="w-32">Start</Button>
        </Tooltip>
        
        <Tooltip content="Center aligned" side="top" align="center">
          <Button variant="outline" className="w-32">Center</Button>
        </Tooltip>
        
        <Tooltip content="End aligned" side="top" align="end">
          <Button variant="outline" className="w-32">End</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Information">
        <Button size="icon" variant="ghost">
          <Info className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Help & Documentation">
        <Button size="icon" variant="ghost">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Warning: This action cannot be undone">
        <Button size="icon" variant="ghost">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Success! Changes saved">
        <Button size="icon" variant="ghost">
          <CheckCircle className="w-4 h-4 text-green-500" />
        </Button>
      </Tooltip>
    </div>
  ),
};

export const CustomDelay: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Instant (0ms delay)" delay={0}>
        <Button variant="outline">Instant</Button>
      </Tooltip>
      
      <Tooltip content="Quick (200ms delay)" delay={200}>
        <Button variant="outline">Quick</Button>
      </Tooltip>
      
      <Tooltip content="Default (700ms delay)">
        <Button variant="outline">Default</Button>
      </Tooltip>
      
      <Tooltip content="Slow (1500ms delay)" delay={1500}>
        <Button variant="outline">Slow</Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    content: "This is a tooltip with much longer content that might wrap to multiple lines depending on the available space",
    children: <Button>Hover for long tooltip</Button>,
  },
  render: () => (
    <Tooltip 
      content="This is a tooltip with much longer content that might wrap to multiple lines depending on the available space"
    >
      <Button>Hover for long tooltip</Button>
    </Tooltip>
  ),
};

export const DisabledElement: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="This button is disabled">
        <span tabIndex={0}>
          <Button disabled>Disabled Button</Button>
        </span>
      </Tooltip>
      
      <Tooltip content="This works on any element">
        <div className="p-4 bg-muted rounded-lg cursor-help">
          Custom Element
        </div>
      </Tooltip>
    </div>
  ),
};

export const InlineText: Story = {
  args: {
    content: "Tooltip",
    children: <span>text</span>,
  },
  render: () => (
    <p className="text-base">
      This is a paragraph with an{" "}
      <Tooltip content="Additional information about this term">
        <span className="underline decoration-dotted cursor-help">
          inline tooltip
        </span>
      </Tooltip>{" "}
      that provides more context when hovered.
    </p>
  ),
};

export const FormField: Story = {
  args: {
    content: "Tooltip",
    children: <Info className="w-3 h-3" />,
  },
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <Tooltip content="Your username must be unique and contain only letters, numbers, and underscores">
            <Info className="w-3 h-3 text-muted-foreground" />
          </Tooltip>
        </div>
        <input
          id="username"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter username"
        />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Tooltip content="Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters">
            <Info className="w-3 h-3 text-muted-foreground" />
          </Tooltip>
        </div>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter password"
        />
      </div>
    </div>
  ),
};

export const TableHeaders: Story = {
  args: {
    content: "Tooltip",
    children: <span>Header</span>,
  },
  render: () => (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">
            <div className="flex items-center gap-1">
              <span>Name</span>
              <Tooltip content="The full name of the user">
                <Info className="w-3 h-3 text-muted-foreground" />
              </Tooltip>
            </div>
          </th>
          <th className="text-left p-2">
            <div className="flex items-center gap-1">
              <span>Status</span>
              <Tooltip content="Active: User can log in, Inactive: User is suspended">
                <Info className="w-3 h-3 text-muted-foreground" />
              </Tooltip>
            </div>
          </th>
          <th className="text-left p-2">
            <div className="flex items-center gap-1">
              <span>Role</span>
              <Tooltip content="User's permission level in the system">
                <Info className="w-3 h-3 text-muted-foreground" />
              </Tooltip>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2">John Doe</td>
          <td className="p-2">Active</td>
          <td className="p-2">Admin</td>
        </tr>
        <tr className="border-b">
          <td className="p-2">Jane Smith</td>
          <td className="p-2">Active</td>
          <td className="p-2">User</td>
        </tr>
      </tbody>
    </table>
  ),
};

export const StatusIndicators: Story = {
  args: {
    content: "Status",
    children: <span>Status</span>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="System is operational">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm">Online</span>
        </div>
      </Tooltip>
      
      <Tooltip content="Maintenance in progress">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-sm">Maintenance</span>
        </div>
      </Tooltip>
      
      <Tooltip content="System is offline">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-sm">Offline</span>
        </div>
      </Tooltip>
    </div>
  ),
};

export const InteractiveContent: Story = {
  args: {
    content: "Interactive",
    children: <Button>Click</Button>,
  },
  render: () => {
    const [count, setCount] = React.useState(0);
    
    return (
      <div className="space-y-4">
        <Tooltip content={`Button clicked ${count} times`}>
          <Button onClick={() => setCount(count + 1)}>
            Click me (Count: {count})
          </Button>
        </Tooltip>
        
        <p className="text-sm text-muted-foreground">
          The tooltip updates dynamically based on the click count
        </p>
      </div>
    );
  },
};