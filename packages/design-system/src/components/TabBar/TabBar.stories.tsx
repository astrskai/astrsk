import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Grid, List, Inbox, Send, Archive, Star, MessageSquare, Users, Settings } from 'lucide-react';
import { TabBar } from './TabBar';

const meta = {
  title: 'Navigation/TabBar',
  component: TabBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the tabs',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether tabs should take full width',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for stateful stories
function TabBarExample(props: React.ComponentProps<typeof TabBar>) {
  const [value, setValue] = useState(props.value);
  return <TabBar {...props} value={value} onChange={setValue} />;
}

// Default text tabs
export const Default: Story = {
  args: {
    tabs: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
    ],
    value: 'all',
  },
  render: (args) => <TabBarExample {...args} />,
};

// Pills variant
export const Pills: Story = {
  args: {
    ...Default.args,
    variant: 'pills',
  },
  render: (args) => <TabBarExample {...args} />,
};

// Underline variant
export const Underline: Story = {
  args: {
    ...Default.args,
    variant: 'underline',
  },
  render: (args) => <TabBarExample {...args} />,
};

// Icon only tabs
export const IconOnly: Story = {
  args: {
    tabs: [
      { value: 'grid', label: <Grid className="size-4" /> },
      { value: 'list', label: <List className="size-4" /> },
    ],
    value: 'grid',
    variant: 'default',
  },
  render: (args) => <TabBarExample {...args} />,
};

// Icon with text
export const IconWithText: Story = {
  args: {
    tabs: [
      {
        value: 'inbox',
        label: (
          <span className="flex items-center gap-2">
            <Inbox className="size-4" />
            Inbox
          </span>
        ),
      },
      {
        value: 'sent',
        label: (
          <span className="flex items-center gap-2">
            <Send className="size-4" />
            Sent
          </span>
        ),
      },
      {
        value: 'archive',
        label: (
          <span className="flex items-center gap-2">
            <Archive className="size-4" />
            Archive
          </span>
        ),
      },
    ],
    value: 'inbox',
  },
  render: (args) => <TabBarExample {...args} />,
};

// With count badge
export const WithCount: Story = {
  args: {
    tabs: [
      {
        value: 'inbox',
        label: (
          <span className="flex items-center gap-2">
            <Inbox className="size-4" />
            Inbox
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold">
              12
            </span>
          </span>
        ),
      },
      {
        value: 'starred',
        label: (
          <span className="flex items-center gap-2">
            <Star className="size-4" />
            Starred
            <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold">
              3
            </span>
          </span>
        ),
      },
      {
        value: 'archive',
        label: (
          <span className="flex items-center gap-2">
            <Archive className="size-4" />
            Archive
          </span>
        ),
      },
    ],
    value: 'inbox',
  },
  render: (args) => <TabBarExample {...args} />,
};

// Full width tabs
export const FullWidth: Story = {
  args: {
    tabs: [
      { value: 'characters', label: 'Characters' },
      { value: 'sessions', label: 'Sessions' },
      { value: 'settings', label: 'Settings' },
    ],
    value: 'characters',
    fullWidth: true,
  },
  render: (args) => <TabBarExample {...args} />,
};

// Different sizes
export const Sizes: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-6" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Small</p>
        <TabBarExample
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'done', label: 'Done' },
          ]}
          value="all"
          size="sm"
        />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Medium (default)</p>
        <TabBarExample
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'done', label: 'Done' },
          ]}
          value="all"
          size="md"
        />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Large</p>
        <TabBarExample
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'done', label: 'Done' },
          ]}
          value="all"
          size="lg"
        />
      </div>
    </>
  ),
};

// With disabled tab
export const WithDisabled: Story = {
  args: {
    tabs: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
      { value: 'admin', label: 'Admin', disabled: true },
    ],
    value: 'public',
  },
  render: (args) => <TabBarExample {...args} />,
};

// All variants comparison
export const AllVariants: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-8" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Default</p>
        <TabBarExample
          tabs={[
            { value: 'messages', label: <span className="flex items-center gap-2"><MessageSquare className="size-4" />Messages</span> },
            { value: 'users', label: <span className="flex items-center gap-2"><Users className="size-4" />Users</span> },
            { value: 'settings', label: <span className="flex items-center gap-2"><Settings className="size-4" />Settings</span> },
          ]}
          value="messages"
          variant="default"
        />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Pills</p>
        <TabBarExample
          tabs={[
            { value: 'messages', label: <span className="flex items-center gap-2"><MessageSquare className="size-4" />Messages</span> },
            { value: 'users', label: <span className="flex items-center gap-2"><Users className="size-4" />Users</span> },
            { value: 'settings', label: <span className="flex items-center gap-2"><Settings className="size-4" />Settings</span> },
          ]}
          value="messages"
          variant="pills"
        />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Underline</p>
        <TabBarExample
          tabs={[
            { value: 'messages', label: <span className="flex items-center gap-2"><MessageSquare className="size-4" />Messages</span> },
            { value: 'users', label: <span className="flex items-center gap-2"><Users className="size-4" />Users</span> },
            { value: 'settings', label: <span className="flex items-center gap-2"><Settings className="size-4" />Settings</span> },
          ]}
          value="messages"
          variant="underline"
        />
      </div>
    </>
  ),
};

// Pills with full width
export const PillsFullWidth: Story = {
  args: {
    tabs: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ],
    value: 'week',
    variant: 'pills',
    fullWidth: true,
  },
  render: (args) => <TabBarExample {...args} />,
};
