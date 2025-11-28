import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'Input type',
      table: {
        defaultValue: { summary: 'text' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
};

// All input types
export const Types: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
    </div>
  ),
};

// With values
export const WithValue: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Input defaultValue="Hello World" />
      <Input type="email" defaultValue="user@example.com" />
      <Input type="password" defaultValue="password123" />
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Input disabled placeholder="Disabled empty" />
      <Input disabled defaultValue="Disabled with value" />
    </div>
  ),
};

// Invalid state (aria-invalid)
export const Invalid: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Input aria-invalid="true" placeholder="Invalid input" />
      <Input aria-invalid="true" defaultValue="Invalid with value" />
    </div>
  ),
};

// File input
export const FileInput: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Input type="file" />
      <Input type="file" accept="image/*" />
    </div>
  ),
};

// With labels (form pattern)
export const WithLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="name"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Name
        </label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="email"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Email
        </label>
        <Input id="email" type="email" placeholder="Enter your email" />
        <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>
          We'll never share your email.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="error-field"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Required Field
        </label>
        <Input id="error-field" aria-invalid="true" placeholder="This field has an error" />
        <span style={{ fontSize: '12px', color: 'var(--color-status-error)' }}>
          This field is required.
        </span>
      </div>
    </div>
  ),
};

// Size variations (custom widths)
export const Widths: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input placeholder="Small width" style={{ width: '150px' }} />
      <Input placeholder="Medium width (default)" style={{ width: '300px' }} />
      <Input placeholder="Large width" style={{ width: '450px' }} />
      <Input placeholder="Full width" style={{ width: '100%' }} />
    </div>
  ),
};
