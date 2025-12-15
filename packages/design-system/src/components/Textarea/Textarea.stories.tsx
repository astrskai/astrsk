import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';
import { Label } from '../Label';

const meta = {
  title: 'Form Inputs/Textarea',
  component: Textarea,
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
      description: 'Disable textarea',
    },
    rows: {
      control: 'number',
      description: 'Number of visible rows',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// With value
export const WithValue: Story = {
  args: {
    defaultValue: 'This is a pre-filled textarea with some content that spans multiple lines.\n\nYou can edit this text.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Disabled
export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit',
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Invalid state
export const Invalid: Story = {
  args: {
    'aria-invalid': 'true',
    defaultValue: 'Invalid content',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// With rows
export const CustomRows: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Textarea placeholder="3 rows" rows={3} />
      <Textarea placeholder="6 rows" rows={6} />
      <Textarea placeholder="10 rows" rows={10} />
    </div>
  ),
};

// With Label
export const WithLabel: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Enter your message..." />
    </div>
  ),
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="bio" required>Bio</Label>
        <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
        <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>
          Max 500 characters.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea id="feedback" placeholder="Share your thoughts..." rows={4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label htmlFor="error-field" error>Description</Label>
        <Textarea id="error-field" aria-invalid="true" defaultValue="Too short" />
        <span style={{ fontSize: '12px', color: 'var(--color-status-error)' }}>
          Description must be at least 50 characters.
        </span>
      </div>
    </div>
  ),
};
