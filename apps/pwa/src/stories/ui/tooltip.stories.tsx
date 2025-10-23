import type { Meta, StoryObj } from "@storybook/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Button } from "@/shared/ui/button";
import { Info, HelpCircle, AlertCircle, Plus, Copy, Download } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Positions: Story = {
  args: {},
  render: () => (
    <div className="flex gap-8 flex-wrap">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithIcons: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Info className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>More information</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <HelpCircle className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Get help</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <AlertCircle className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Warning: This action cannot be undone</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const CustomDelay: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Instant (0ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No delay</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Fast (500ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>500ms delay</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Slow (1000ms)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>1 second delay</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
};

export const RichContent: Story = {
  args: {},
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Rich tooltip</Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-2">
          <p className="font-semibold">Keyboard shortcut</p>
          <p>Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">⌘K</kbd> to open</p>
        </div>
      </TooltipContent>
    </Tooltip>
  ),
};

export const DisabledElements: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button disabled>
              Disabled button
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This feature is currently unavailable</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            <Button variant="ghost" size="icon" disabled>
              <Plus className="min-h-4 min-w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>You don't have permission to add items</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const FormHelpers: Story = {
  args: {},
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="flex items-center gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="min-h-3 min-w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>We'll never share your email with anyone else</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        id="email"
        type="email"
        className="w-full px-3 py-2 border rounded-md"
        placeholder="Enter your email"
      />

      <div className="flex items-center gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="min-h-3 min-w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Password requirements:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• At least 8 characters</li>
                <li>• One uppercase letter</li>
                <li>• One number</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        id="password"
        type="password"
        className="w-full px-3 py-2 border rounded-md"
        placeholder="Enter your password"
      />
    </div>
  ),
};

export const ActionButtons: Story = {
  args: {},
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Copy className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy to clipboard</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Download className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download file</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Plus className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new item</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  args: {},
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Long tooltip content</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          This is a tooltip with much longer content that demonstrates how tooltips handle
          text wrapping when the content exceeds the default width constraints.
        </p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const MultipleTooltips: Story = {
  args: {},
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[400px]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Tooltip key={num}>
          <TooltipTrigger asChild>
            <Button variant="outline" className="w-full">
              Item {num}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Details for item {num}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

export const InteractiveExample: Story = {
  args: {},
  render: () => {
    const [clickCount, setClickCount] = React.useState(0);

    return (
      <div className="space-y-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setClickCount(clickCount + 1)}
            >
              Click me ({clickCount} clicks)
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You've clicked {clickCount} times</p>
          </TooltipContent>
        </Tooltip>

        <p className="text-sm text-muted-foreground">
          Click the button to increment the counter. The tooltip updates dynamically.
        </p>
      </div>
    );
  },
};

export const ButtonVariant: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost">
            <Download className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="button">
          <p>Export</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost">
            <Copy className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="button">
          <p>Copy</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost">
            <Plus className="min-h-4 min-w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="button">
          <p>Add</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const ComplexLayout: Story = {
  args: {},
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            JD
          </div>
          <div>
            <p className="font-medium">John Doe</p>
            <p className="text-sm text-muted-foreground">john@example.com</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="min-h-4 min-w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View profile</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Copy className="min-h-4 min-w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy email address</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["Active", "Pending", "Inactive"].map((status) => (
          <div key={status} className="p-4 border rounded-lg text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-2xl font-bold">
                    {status === "Active" ? 24 : status === "Pending" ? 12 : 3}
                  </p>
                  <p className="text-sm text-muted-foreground">{status}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {status === "Active"
                    ? "Currently active users"
                    : status === "Pending"
                    ? "Users awaiting approval"
                    : "Deactivated accounts"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  ),
};