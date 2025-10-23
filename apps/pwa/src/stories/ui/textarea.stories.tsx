import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/shared/ui/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
    rows: {
      control: "number",
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This is a textarea with some default content.\n\nIt can have multiple lines.",
    placeholder: "Type your message here...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "This textarea is disabled",
  },
};

export const CustomRows: Story = {
  args: {
    rows: 10,
    placeholder: "This textarea has 10 rows",
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "This is read-only content.\nYou cannot edit this text.",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default State</p>
        <Textarea placeholder="Type your message here..." />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">With Value</p>
        <Textarea defaultValue="This textarea has some content already filled in." />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Disabled State</p>
        <Textarea disabled placeholder="This textarea is disabled" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Read Only</p>
        <Textarea readOnly value="This is read-only content" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">With Max Length</p>
        <Textarea maxLength={100} placeholder="Maximum 100 characters" />
      </div>
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default Size (min-h-[60px])</p>
        <Textarea placeholder="Default size" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">3 Rows</p>
        <Textarea rows={3} placeholder="3 rows" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">5 Rows</p>
        <Textarea rows={5} placeholder="5 rows" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">10 Rows</p>
        <Textarea rows={10} placeholder="10 rows" />
      </div>
    </div>
  ),
};

export const WithResize: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Resize: Vertical (default)</p>
        <Textarea placeholder="You can resize this vertically" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Resize: Horizontal</p>
        <Textarea className="resize-x" placeholder="You can resize this horizontally" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Resize: Both</p>
        <Textarea className="resize" placeholder="You can resize this in both directions" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Resize: None</p>
        <Textarea className="resize-none" placeholder="You cannot resize this" />
      </div>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    defaultValue: `This is a very long text to demonstrate how the textarea handles content that exceeds its visible area.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

The textarea should show scrollbars when the content exceeds the visible area.`,
    rows: 5,
  },
};