import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "@/components-v2/tooltip";
import { Button } from "@/shared/ui";
import { Info, HelpCircle, AlertTriangle } from "lucide-react";
import React from "react";

const meta = {
  title: "Components/Tooltip (Wrapper)",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    delay: {
      control: { type: "number", min: 0, max: 2000, step: 100 },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "This is a tooltip",
    children: <Button variant="outline">Hover me</Button>,
  },
};

export const Positions: Story = {
  args: {
    content: "Tooltip",
    children: <Button variant="outline">Hover</Button>,
  },
  render: () => (
    <div className="flex gap-8 flex-wrap p-20">
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
    content: "Aligned tooltip",
    children: <Button variant="outline">Hover</Button>,
  },
  render: () => (
    <div className="space-y-8 p-20">
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
    content: "Icon tooltip",
    children: <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Information">
        <Button variant="ghost" size="icon">
          <Info className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Get help">
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Warning!">
        <Button variant="ghost" size="icon">
          <AlertTriangle className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  ),
};

export const DelayVariations: Story = {
  args: {
    content: "Delayed tooltip",
    children: <Button variant="outline">Hover</Button>,
  },
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="No delay" delay={0}>
        <Button variant="outline">Instant</Button>
      </Tooltip>
      <Tooltip content="500ms delay" delay={500}>
        <Button variant="outline">Fast</Button>
      </Tooltip>
      <Tooltip content="1000ms delay" delay={1000}>
        <Button variant="outline">Normal</Button>
      </Tooltip>
      <Tooltip content="2000ms delay" delay={2000}>
        <Button variant="outline">Slow</Button>
      </Tooltip>
    </div>
  ),
};

export const RichContent: Story = {
  args: {
    content: "Rich content",
    children: <Button variant="outline">Hover</Button>,
  },
  render: () => (
    <Tooltip 
      content={
        <div className="space-y-2">
          <p className="font-semibold">Rich Tooltip Content</p>
          <p className="text-sm">This tooltip contains multiple lines and formatted text.</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-primary/20 rounded">Tag 1</span>
            <span className="px-2 py-1 bg-primary/20 rounded">Tag 2</span>
          </div>
        </div>
      }
    >
      <Button variant="outline">Hover for rich content</Button>
    </Tooltip>
  ),
};

export const NonButtonElements: Story = {
  args: {
    content: "Element tooltip",
    children: <span>Hover</span>,
  },
  render: () => (
    <div className="space-y-4">
      <Tooltip content="This is a span element">
        <span className="inline-block p-2 border rounded cursor-help">
          Hover over this text
        </span>
      </Tooltip>
      
      <Tooltip content="This is a div element">
        <div className="p-4 border rounded bg-muted cursor-help">
          <p>Hoverable div container</p>
        </div>
      </Tooltip>
      
      <Tooltip content="Link tooltip">
        <a href="#" className="text-primary underline">
          Hover over this link
        </a>
      </Tooltip>
    </div>
  ),
};

export const InlineHelp: Story = {
  args: {
    content: "Help tooltip",
    children: <Info className="h-3 w-3" />,
  },
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Username</label>
        <Tooltip content="Your username must be unique and contain only letters, numbers, and underscores">
          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
        </Tooltip>
      </div>
      <input 
        type="text" 
        className="w-full px-3 py-2 border rounded-md" 
        placeholder="Enter username"
      />
      
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">API Key</label>
        <Tooltip content="You can find your API key in the settings page">
          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
        </Tooltip>
      </div>
      <input 
        type="password" 
        className="w-full px-3 py-2 border rounded-md" 
        placeholder="Enter API key"
      />
    </div>
  ),
};

export const TableCells: Story = {
  args: {
    content: "Table tooltip",
    children: <span>Cell</span>,
  },
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr>
          <th className="border p-2">
            <Tooltip content="User's display name">
              <span className="flex items-center gap-1">
                Name <Info className="h-3 w-3" />
              </span>
            </Tooltip>
          </th>
          <th className="border p-2">
            <Tooltip content="Current subscription status">
              <span className="flex items-center gap-1">
                Status <Info className="h-3 w-3" />
              </span>
            </Tooltip>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-2">John Doe</td>
          <td className="border p-2">
            <Tooltip content="Active since Jan 2024">
              <span className="text-green-600">Active</span>
            </Tooltip>
          </td>
        </tr>
        <tr>
          <td className="border p-2">Jane Smith</td>
          <td className="border p-2">
            <Tooltip content="Trial expires in 7 days">
              <span className="text-yellow-600">Trial</span>
            </Tooltip>
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

export const ComplexExample: Story = {
  args: {
    content: "Interactive tooltip",
    children: <Button>Click</Button>,
  },
  render: () => {
    const [count, setCount] = React.useState(0);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Tooltip content={`Button clicked ${count} times`}>
            <Button onClick={() => setCount(count + 1)}>
              Click me ({count})
            </Button>
          </Tooltip>
          <Tooltip content="Reset the counter">
            <Button variant="outline" onClick={() => setCount(0)}>
              Reset
            </Button>
          </Tooltip>
        </div>
        
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Settings</h3>
            <Tooltip content="All settings are automatically saved">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Tooltip>
          </div>
          
          <div className="space-y-2">
            <Tooltip content="Enable to receive email notifications" side="right">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" />
                <span>Email notifications</span>
              </label>
            </Tooltip>
            
            <Tooltip content="Enable to receive SMS notifications" side="right">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" />
                <span>SMS notifications</span>
              </label>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  },
};