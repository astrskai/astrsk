import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';
import { Input } from '../Input';

const meta = {
  title: 'Form Inputs/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
      description: 'Show required indicator (*)',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    children: 'Email',
    htmlFor: 'email',
  },
};

// Required
export const Required: Story = {
  args: {
    children: 'Username',
    htmlFor: 'username',
    required: true,
  },
};

// Error state
export const Error: Story = {
  args: {
    children: 'Password',
    htmlFor: 'password',
    error: true,
  },
};

// With Input
export const WithInput: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '300px' }}>
      <Label htmlFor="email-input">Email Address</Label>
      <Input id="email-input" type="email" placeholder="Enter your email" />
    </div>
  ),
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="name" required>Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="password" error>Password</Label>
        <Input id="password" type="password" aria-invalid="true" />
        <span style={{ fontSize: '12px', color: 'var(--color-status-error)' }}>
          Password is required.
        </span>
      </div>
    </div>
  ),
};
