import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search, Mail, Lock, User, Phone, CreditCard, Calendar } from 'lucide-react';
import { IconInput } from './IconInput';

const meta = {
  title: 'Form Inputs/IconInput',
  component: IconInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
      description: 'Icon to display inside the input',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position of the icon',
      table: {
        defaultValue: { summary: 'left' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url'],
      description: 'Input type',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Search input (most common use case)
export const Search_: Story = {
  name: 'Search',
  args: {
    icon: <Search />,
    placeholder: 'Search...',
    type: 'search',
  },
};

// Email input
export const Email: Story = {
  args: {
    icon: <Mail />,
    placeholder: 'Enter your email',
    type: 'email',
  },
};

// Password input with icon on right
export const Password: Story = {
  args: {
    icon: <Lock />,
    iconPosition: 'right',
    placeholder: 'Enter password',
    type: 'password',
  },
};

// User input
export const Username: Story = {
  args: {
    icon: <User />,
    placeholder: 'Username',
  },
};

// Phone input
export const PhoneNumber: Story = {
  args: {
    icon: <Phone />,
    placeholder: 'Phone number',
    type: 'tel',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    icon: <Search />,
    placeholder: 'Disabled input',
    disabled: true,
  },
};

// Without icon (falls back to regular Input)
export const WithoutIcon: Story = {
  args: {
    placeholder: 'Regular input without icon',
  },
};

// All variants showcase
export const AllVariants: Story = {
  args: {
    icon: <Search />,
    placeholder: 'Search...',
  },
  decorators: [
    () => (
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Search</label>
          <IconInput icon={<Search />} placeholder="Search..." />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Email</label>
          <IconInput icon={<Mail />} type="email" placeholder="email@example.com" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Password (icon right)</label>
          <IconInput icon={<Lock />} iconPosition="right" type="password" placeholder="Password" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Credit Card</label>
          <IconInput icon={<CreditCard />} placeholder="Card number" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Date</label>
          <IconInput icon={<Calendar />} placeholder="Select date" />
        </div>
      </div>
    ),
  ],
};
