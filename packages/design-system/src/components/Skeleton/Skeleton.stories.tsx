import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'circular', 'rounded'],
      description: 'Border radius variant',
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton',
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    className: 'h-4 w-48',
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-zinc-400">Default (rounded corners)</p>
        <Skeleton className="h-4 w-48" variant="default" />
      </div>
      <div>
        <p className="mb-2 text-sm text-zinc-400">Circular</p>
        <Skeleton className="size-12" variant="circular" />
      </div>
      <div>
        <p className="mb-2 text-sm text-zinc-400">Rounded (xl)</p>
        <Skeleton className="h-24 w-48" variant="rounded" />
      </div>
    </div>
  ),
};

// Text placeholder
export const TextPlaceholder: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
};

// Avatar placeholder
export const AvatarPlaceholder: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10" variant="circular" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
};

// Card placeholder
export const CardPlaceholder: Story = {
  render: () => (
    <div className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <Skeleton className="mb-4 h-32 w-full" variant="rounded" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  ),
};

// With explicit dimensions
export const ExplicitDimensions: Story = {
  args: {
    width: 200,
    height: 100,
    variant: 'rounded',
  },
};

// Grid of skeletons
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-24 w-24" variant="rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  ),
};
