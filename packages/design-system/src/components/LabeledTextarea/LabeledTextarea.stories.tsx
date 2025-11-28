import type { Meta, StoryObj } from '@storybook/react-vite';
import { LabeledTextarea } from './LabeledTextarea';

const meta = {
  title: 'Components/LabeledTextarea',
  component: LabeledTextarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text',
    },
    hint: {
      control: 'text',
      description: 'Helper text shown below textarea',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'left', 'inner'],
      description: 'Label position: top (above), left (inline), inner (floating on border)',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
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
} satisfies Meta<typeof LabeledTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    label: 'Message',
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

// With hint
export const WithHint: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    hint: 'Max 500 characters.',
    rows: 4,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// With error
export const WithError: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    error: 'Description must be at least 50 characters.',
    defaultValue: 'Too short',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Required
export const Required: Story = {
  args: {
    label: 'Feedback',
    placeholder: 'Share your thoughts...',
    required: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Label on left
export const LabelLeft: Story = {
  render: () => (
    <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <LabeledTextarea
        label="Comments"
        labelPosition="left"
        placeholder="Enter comments..."
        rows={4}
      />
      <LabeledTextarea
        label="Notes"
        labelPosition="left"
        placeholder="Enter notes..."
        hint="Optional field"
        rows={4}
      />
    </div>
  ),
};

// Inner (floating label)
export const LabelInner: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <LabeledTextarea
        label="Message"
        labelPosition="inner"
        placeholder="Enter your message..."
        rows={4}
      />
      <LabeledTextarea
        label="Description"
        labelPosition="inner"
        placeholder="Enter description..."
        required
        rows={4}
      />
      <LabeledTextarea
        label="Notes"
        labelPosition="inner"
        placeholder="Add notes..."
        hint="Optional"
        rows={4}
      />
      <LabeledTextarea
        label="Invalid Field"
        labelPosition="inner"
        placeholder="This has an error"
        error="This field is required."
        rows={4}
      />
    </div>
  ),
};

// Disabled
export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
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

// Form example
export const FormExample: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <LabeledTextarea
        label="Bio"
        placeholder="Tell us about yourself..."
        hint="Max 500 characters."
        required
        rows={4}
      />
      <LabeledTextarea
        label="Goals"
        placeholder="What are your goals?"
        rows={3}
      />
      <LabeledTextarea
        label="Experience"
        placeholder="Describe your experience..."
        error="Please provide more detail (minimum 100 characters)."
        defaultValue="I have some experience."
        rows={4}
      />
    </div>
  ),
};
