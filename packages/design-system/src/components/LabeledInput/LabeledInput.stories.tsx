import type { Meta, StoryObj } from '@storybook/react-vite';
import { LabeledInput } from './LabeledInput';

const meta = {
  title: 'Form Inputs/LabeledInput',
  component: LabeledInput,
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
      description: 'Helper text shown below input',
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
      description: 'Disable input',
    },
  },
} satisfies Meta<typeof LabeledInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

// With hint
export const WithHint: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    hint: 'Username must be 3-20 characters long.',
  },
};

// With error
export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters.',
  },
};

// Required field
export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
  },
};

// Label on left
export const LabelLeft: Story = {
  render: () => (
    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <LabeledInput
        label="First Name"
        labelPosition="left"
        placeholder="Enter first name"
      />
      <LabeledInput
        label="Last Name"
        labelPosition="left"
        placeholder="Enter last name"
      />
      <LabeledInput
        label="Email"
        labelPosition="left"
        type="email"
        placeholder="Enter email"
        hint="We'll never share your email."
      />
    </div>
  ),
};

// Inner (floating label on border)
export const LabelInner: Story = {
  render: () => (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <LabeledInput
        label="Email"
        labelPosition="inner"
        type="email"
        placeholder="Enter your email"
      />
      <LabeledInput
        label="Password"
        labelPosition="inner"
        type="password"
        placeholder="Enter password"
      />
      <LabeledInput
        label="Username"
        labelPosition="inner"
        placeholder="Enter username"
        required
      />
      <LabeledInput
        label="Phone"
        labelPosition="inner"
        type="tel"
        placeholder="+1 (555) 000-0000"
        hint="Optional field"
      />
      <LabeledInput
        label="Invalid Field"
        labelPosition="inner"
        placeholder="This has an error"
        error="This field is required."
      />
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <LabeledInput
        label="Full Name"
        placeholder="John Doe"
        required
      />
      <LabeledInput
        label="Email"
        type="email"
        placeholder="john@example.com"
        required
        hint="We'll send confirmation to this email."
      />
      <LabeledInput
        label="Password"
        type="password"
        placeholder="Enter password"
        required
        error="Password must contain at least 8 characters."
      />
      <LabeledInput
        label="Phone"
        type="tel"
        placeholder="+1 (555) 000-0000"
        hint="Optional"
      />
    </div>
  ),
};

// All states
export const AllStates: Story = {
  render: () => (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <LabeledInput
        label="Default"
        placeholder="Default input"
      />
      <LabeledInput
        label="With Hint"
        placeholder="Input with hint"
        hint="This is a helpful hint."
      />
      <LabeledInput
        label="With Error"
        placeholder="Input with error"
        error="This field has an error."
      />
      <LabeledInput
        label="Required"
        placeholder="Required input"
        required
      />
      <LabeledInput
        label="Disabled"
        placeholder="Disabled input"
        disabled
      />
      <LabeledInput
        label="With Value"
        defaultValue="Pre-filled value"
      />
    </div>
  ),
};
