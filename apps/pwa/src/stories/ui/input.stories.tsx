import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/shared/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number",
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello World",
    placeholder: "Enter text...",
  },
};

export const FileInput: Story = {
  args: {
    type: "file",
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Text Input</p>
        <Input type="text" placeholder="Enter text..." />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Email Input</p>
        <Input type="email" placeholder="email@example.com" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Password Input</p>
        <Input type="password" placeholder="Enter password" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Number Input</p>
        <Input type="number" placeholder="Enter number" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Search Input</p>
        <Input type="search" placeholder="Search..." />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Date Input</p>
        <Input type="date" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Time Input</p>
        <Input type="time" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">File Input</p>
        <Input type="file" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default State</p>
        <Input placeholder="Default input" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Focused State (click to focus)</p>
        <Input placeholder="Click to focus" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">With Value</p>
        <Input defaultValue="Sample text" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Disabled State</p>
        <Input disabled placeholder="Disabled input" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Read Only</p>
        <Input readOnly value="Read only text" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default Size (min-h-8)</p>
        <Input placeholder="Default size" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Custom Width</p>
        <Input placeholder="Full width" className="w-full" />
        <Input placeholder="Half width" className="w-1/2" />
        <Input placeholder="Fixed width" className="w-[150px]" />
      </div>
    </div>
  ),
};