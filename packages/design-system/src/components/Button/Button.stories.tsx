import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

// Example icons (inline SVG)
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const meta = {
  title: 'Actions/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Button size',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// With icons (shadcn pattern - icons as children)
export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button>
        <MailIcon /> Login with Email
      </Button>
      <Button variant="secondary">
        <DownloadIcon /> Download
      </Button>
      <Button variant="outline">
        <PlusIcon /> Add New
      </Button>
      <Button variant="ghost">
        Settings <PlusIcon />
      </Button>
    </div>
  ),
};

// Icon only buttons
export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button size="icon-sm" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button size="icon" aria-label="Download">
        <DownloadIcon />
      </Button>
      <Button size="icon-lg" aria-label="Mail">
        <MailIcon />
      </Button>
      <Button size="icon" variant="destructive" aria-label="Delete">
        <TrashIcon />
      </Button>
      <Button size="icon" variant="outline" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Settings">
        <MailIcon />
      </Button>
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button disabled>Disabled</Button>
      <Button disabled variant="secondary">
        Disabled
      </Button>
      <Button disabled variant="outline">
        Disabled
      </Button>
      <Button disabled size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
};

// All combinations
export const AllCombinations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--fg-muted)' }}>
          Default
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-sm" aria-label="Icon"><PlusIcon /></Button>
          <Button size="icon" aria-label="Icon"><PlusIcon /></Button>
          <Button size="icon-lg" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--fg-muted)' }}>
          Secondary
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="secondary" size="sm">Small</Button>
          <Button variant="secondary" size="default">Default</Button>
          <Button variant="secondary" size="lg">Large</Button>
          <Button variant="secondary" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--fg-muted)' }}>
          Outline
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="outline" size="sm">Small</Button>
          <Button variant="outline" size="default">Default</Button>
          <Button variant="outline" size="lg">Large</Button>
          <Button variant="outline" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--fg-muted)' }}>
          Ghost
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="ghost" size="sm">Small</Button>
          <Button variant="ghost" size="default">Default</Button>
          <Button variant="ghost" size="lg">Large</Button>
          <Button variant="ghost" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--fg-muted)' }}>
          Destructive
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="destructive" size="sm">Small</Button>
          <Button variant="destructive" size="default">Default</Button>
          <Button variant="destructive" size="lg">Large</Button>
          <Button variant="destructive" size="icon" aria-label="Icon"><TrashIcon /></Button>
        </div>
      </div>
    </div>
  ),
};
