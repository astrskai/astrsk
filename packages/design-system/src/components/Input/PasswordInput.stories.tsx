import type { Meta, StoryObj } from '@storybook/react-vite';
import { Lock } from 'lucide-react';
import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Form Inputs/PasswordInput',
  component: PasswordInput,
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
      description: 'Whether the input is disabled',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'left', 'inner'],
      description: 'Label position',
    },
    hint: {
      control: 'text',
      description: 'Hint text below the input',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default password input
export const Default: Story = {
  args: {
    placeholder: 'Enter password',
  },
};

// With value
export const WithValue: Story = {
  args: {
    placeholder: 'Enter password',
    defaultValue: 'mysecretpassword',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled password',
    disabled: true,
  },
};

// Invalid state
export const Invalid: Story = {
  args: {
    placeholder: 'Enter password',
    'aria-invalid': true,
    defaultValue: '123',
  },
};

// With Label (top position - default)
export const WithLabel: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
  },
};

// With Label and Required
export const WithLabelRequired: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    required: true,
  },
};

// With Label and Hint
export const WithLabelAndHint: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    hint: 'Must be at least 8 characters',
  },
};

// With Label and Error
export const WithLabelAndError: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    error: 'Password is required',
    required: true,
  },
};

// Label Position: Left
export const LabelPositionLeft: Story = {
  args: {
    label: 'Password',
    labelPosition: 'left',
    placeholder: 'Enter password',
  },
};

// Label Position: Inner (floating)
export const LabelPositionInner: Story = {
  args: {
    label: 'Password',
    labelPosition: 'inner',
    placeholder: 'Enter password',
  },
};

// With Left Icon
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Lock />,
    placeholder: 'Enter password',
  },
};

// With Left Icon and Label
export const WithLeftIconAndLabel: Story = {
  args: {
    leftIcon: <Lock />,
    label: 'Password',
    placeholder: 'Enter password',
    required: true,
  },
};

// Form example using new props
export const FormExample: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <PasswordInput
        label='Password'
        placeholder='Enter password'
        leftIcon={<Lock />}
        required
        hint='Must be at least 8 characters'
      />
      <PasswordInput
        label='Confirm Password'
        placeholder='Confirm password'
        leftIcon={<Lock />}
        required
      />
    </div>
  ),
};
