import type { Meta, StoryObj } from '@storybook/react-vite';
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

// Form example
export const FormExample: Story = {
  args: {
    placeholder: 'Enter password',
  },
  decorators: [
    () => (
      <div className='flex flex-col gap-4'>
        <div>
          <label className='mb-2 block text-sm text-zinc-400'>Password</label>
          <PasswordInput placeholder='Enter password' />
        </div>
        <div>
          <label className='mb-2 block text-sm text-zinc-400'>
            Confirm Password
          </label>
          <PasswordInput placeholder='Confirm password' />
        </div>
      </div>
    ),
  ],
};
