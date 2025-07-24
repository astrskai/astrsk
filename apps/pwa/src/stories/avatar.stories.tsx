import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@/components-v2/avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 16, max: 200, step: 4 },
    },
    src: {
      control: "text",
    },
    alt: {
      control: "text",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 48,
    alt: "Avatar",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://github.com/shadcn.png",
    size: 48,
    alt: "User avatar",
  },
};

export const Sizes: Story = {
  args: {
    alt: "Avatar",
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} size={24} />
      <Avatar {...args} size={32} />
      <Avatar {...args} size={40} />
      <Avatar {...args} size={48} />
      <Avatar {...args} size={64} />
      <Avatar {...args} size={80} />
      <Avatar {...args} size={96} />
    </div>
  ),
};

export const WithCustomImages: Story = {
  args: {
    size: 48,
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} src="https://github.com/shadcn.png" alt="shadcn" />
      <Avatar {...args} src="https://github.com/vercel.png" alt="Vercel" />
      <Avatar {...args} src="https://github.com/github.png" alt="GitHub" />
      <Avatar {...args} src={null} alt="Default" />
    </div>
  ),
};

export const Grid: Story = {
  args: {
    size: 40,
  },
  render: (args) => (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Avatar
          key={i}
          {...args}
          src={i % 3 === 0 ? `https://i.pravatar.cc/150?img=${i}` : null}
          alt={`User ${i + 1}`}
        />
      ))}
    </div>
  ),
};

export const InlineWithText: Story = {
  args: {
    size: 32,
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar {...args} src="https://github.com/shadcn.png" />
        <div>
          <p className="font-medium">John Doe</p>
          <p className="text-sm text-muted-foreground">john@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar {...args} />
        <div>
          <p className="font-medium">Jane Smith</p>
          <p className="text-sm text-muted-foreground">jane@example.com</p>
        </div>
      </div>
    </div>
  ),
};

export const WithBadge: Story = {
  args: {
    size: 48,
  },
  render: (args) => (
    <div className="flex gap-4">
      <div className="relative">
        <Avatar {...args} src="https://github.com/shadcn.png" />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
      </div>
      <div className="relative">
        <Avatar {...args} />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
      </div>
      <div className="relative">
        <Avatar {...args} src="https://github.com/vercel.png" />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 ring-2 ring-white" />
      </div>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    size: 48,
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar {...args} className="opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Loading user...</p>
    </div>
  ),
};

export const ErrorState: Story = {
  args: {
    size: 48,
    src: "https://invalid-url-that-will-fail.com/image.jpg",
    alt: "Failed to load",
  },
};

export const GroupedAvatars: Story = {
  args: {
    size: 40,
  },
  render: (args) => (
    <div className="flex -space-x-4">
      <Avatar {...args} src="https://github.com/shadcn.png" className="ring-2 ring-white" />
      <Avatar {...args} src="https://github.com/vercel.png" className="ring-2 ring-white" />
      <Avatar {...args} src="https://github.com/github.png" className="ring-2 ring-white" />
      <div 
        className="flex items-center justify-center rounded-full bg-muted ring-2 ring-white text-sm font-medium"
        style={{ width: args.size, height: args.size }}
      >
        +3
      </div>
    </div>
  ),
};