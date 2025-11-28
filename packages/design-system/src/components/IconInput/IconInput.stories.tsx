import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconInput } from './IconInput';

// Example icons (inline SVG)
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
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

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const meta = {
  title: 'Components/IconInput',
  component: IconInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
  },
} satisfies Meta<typeof IconInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Search input
export const Search: Story = {
  args: {
    icon: <SearchIcon />,
    placeholder: 'Search...',
    type: 'search',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

// Email input
export const Email: Story = {
  args: {
    icon: <MailIcon />,
    placeholder: 'Enter your email',
    type: 'email',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

// Various icons
export const IconVariants: Story = {
  args: {
    icon: <SearchIcon />,
  },
  render: () => (
    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <IconInput icon={<SearchIcon />} placeholder="Search..." />
      <IconInput icon={<MailIcon />} type="email" placeholder="Email" />
      <IconInput icon={<UserIcon />} placeholder="Username" />
      <IconInput icon={<LockIcon />} type="password" placeholder="Password" />
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  args: {
    icon: <SearchIcon />,
    placeholder: 'Disabled search',
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

// Invalid state
export const Invalid: Story = {
  args: {
    icon: <MailIcon />,
    placeholder: 'Invalid email',
    'aria-invalid': 'true',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
