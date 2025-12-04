import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Accordion } from './Accordion';

const meta = {
  title: 'Navigation/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'separated'],
      description: 'Visual style variant',
    },
    multiple: {
      control: 'boolean',
      description: 'Whether multiple items can be expanded at once',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether all items can be collapsed',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample FAQ items
const faqItems = [
  {
    value: 'item-1',
    trigger: 'What is astrsk?',
    content:
      'astrsk is an AI-powered platform for creating and managing interactive character experiences. You can build custom AI characters with unique personalities and engage in dynamic conversations.',
  },
  {
    value: 'item-2',
    trigger: 'How do I create a character?',
    content:
      'To create a character, navigate to the Characters page and click the "Create" button. You can customize your character\'s name, personality, background, and other attributes to make them unique.',
  },
  {
    value: 'item-3',
    trigger: 'Can I share my characters?',
    content:
      'Yes! You can share your characters with other users by making them public. Go to your character\'s settings and toggle the visibility option to allow others to interact with your creation.',
  },
  {
    value: 'item-4',
    trigger: 'What payment methods are accepted?',
    content:
      'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods depending on your region.',
  },
];

// Default variant
export const Default: Story = {
  args: {
    items: faqItems,
    defaultValue: ['item-1'],
  },
};

// Bordered variant
export const Bordered: Story = {
  args: {
    items: faqItems,
    variant: 'bordered',
    defaultValue: ['item-1'],
  },
};

// Separated variant
export const Separated: Story = {
  args: {
    items: faqItems,
    variant: 'separated',
    defaultValue: ['item-1'],
  },
};

// Multiple items can be expanded
export const Multiple: Story = {
  args: {
    items: faqItems,
    multiple: true,
    defaultValue: ['item-1', 'item-2'],
  },
};

// Not collapsible (at least one must be open)
export const NotCollapsible: Story = {
  args: {
    items: faqItems,
    collapsible: false,
    defaultValue: ['item-1'],
  },
};

// With disabled item
export const WithDisabled: Story = {
  args: {
    items: [
      ...faqItems.slice(0, 2),
      {
        value: 'disabled-item',
        trigger: 'This item is disabled',
        content: 'You cannot see this content.',
        disabled: true,
      },
      ...faqItems.slice(2),
    ],
    defaultValue: ['item-1'],
  },
};

// Controlled mode
function ControlledExample() {
  const [expanded, setExpanded] = useState<string[]>(['item-1']);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setExpanded(['item-1', 'item-2'])}
          className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600"
        >
          Open First Two
        </button>
        <button
          type="button"
          onClick={() => setExpanded([])}
          className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600"
        >
          Close All
        </button>
      </div>
      <Accordion
        items={faqItems}
        value={expanded}
        onChange={setExpanded}
        multiple
      />
      <p className="text-xs text-zinc-500">
        Expanded: {expanded.length > 0 ? expanded.join(', ') : 'none'}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  args: {
    items: faqItems,
  },
  render: () => <ControlledExample />,
};

// With custom trigger content
export const CustomTrigger: Story = {
  args: {
    items: [
      {
        value: 'getting-started',
        trigger: (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              1
            </span>
            <span>Getting Started</span>
          </span>
        ),
        content:
          'Welcome to astrsk! Start by exploring the dashboard and creating your first character.',
      },
      {
        value: 'customize',
        trigger: (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">
              2
            </span>
            <span>Customize Your Experience</span>
          </span>
        ),
        content:
          'Personalize your settings, choose your preferred theme, and configure notifications.',
      },
      {
        value: 'advanced',
        trigger: (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold">
              3
            </span>
            <span>Advanced Features</span>
          </span>
        ),
        content:
          'Explore advanced features like custom prompts, character sharing, and API integrations.',
      },
    ],
    variant: 'separated',
  },
};

// All variants comparison
export const AllVariants: Story = {
  args: {
    items: faqItems.slice(0, 3),
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
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="default" />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Bordered</p>
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="bordered" />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Separated</p>
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="separated" />
      </div>
    </>
  ),
};

// Long content example
export const LongContent: Story = {
  args: {
    items: [
      {
        value: 'long-1',
        trigger: 'Terms of Service',
        content: (
          <div className="space-y-4">
            <p>
              By using our service, you agree to be bound by these terms and conditions. Please read
              them carefully before using the platform.
            </p>
            <h4 className="font-medium text-zinc-200">1. Account Registration</h4>
            <p>
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account credentials.
            </p>
            <h4 className="font-medium text-zinc-200">2. Acceptable Use</h4>
            <p>
              You agree not to use the service for any unlawful purpose or in any way that could
              damage, disable, or impair the service.
            </p>
            <h4 className="font-medium text-zinc-200">3. Content Guidelines</h4>
            <p>
              All content you create or share must comply with our community guidelines. We reserve
              the right to remove any content that violates these guidelines.
            </p>
          </div>
        ),
      },
      {
        value: 'long-2',
        trigger: 'Privacy Policy',
        content: (
          <div className="space-y-4">
            <p>
              Your privacy is important to us. This policy explains how we collect, use, and protect
              your personal information.
            </p>
            <h4 className="font-medium text-zinc-200">Data Collection</h4>
            <p>
              We collect information you provide directly, such as account details and content you
              create. We also collect usage data to improve our services.
            </p>
            <h4 className="font-medium text-zinc-200">Data Usage</h4>
            <p>
              We use your data to provide and improve our services, communicate with you, and ensure
              the security of our platform.
            </p>
          </div>
        ),
      },
    ],
    variant: 'bordered',
  },
};
