import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
];

const meta = {
  title: 'Form Inputs/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown as first disabled option',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable select',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Default: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
  },
};

// With default value
export const WithDefaultValue: Story = {
  args: {
    options: sampleOptions,
    defaultValue: 'option2',
  },
};

// Countries example
export const Countries: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select a country...',
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Select
        options={sampleOptions}
        placeholder="Disabled empty"
        disabled
      />
      <Select
        options={sampleOptions}
        defaultValue="option1"
        disabled
      />
    </div>
  ),
};

// With disabled options
export const DisabledOptions: Story = {
  args: {
    options: [
      { value: 'available1', label: 'Available Option 1' },
      { value: 'disabled1', label: 'Disabled Option', disabled: true },
      { value: 'available2', label: 'Available Option 2' },
      { value: 'disabled2', label: 'Another Disabled', disabled: true },
    ],
    placeholder: 'Select an option...',
  },
};

// Invalid state (aria-invalid)
export const Invalid: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
      <Select
        options={sampleOptions}
        placeholder="Invalid select"
        aria-invalid="true"
      />
      <Select
        options={sampleOptions}
        defaultValue="option1"
        aria-invalid="true"
      />
    </div>
  ),
};

// With labels (form pattern)
export const WithLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="country"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Country
        </label>
        <Select id="country" options={countryOptions} placeholder="Select your country" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="preference"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Preference
        </label>
        <Select id="preference" options={sampleOptions} placeholder="Select preference" />
        <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>
          Choose your preferred option.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="required-field"
          style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
        >
          Required Field
        </label>
        <Select
          id="required-field"
          options={sampleOptions}
          placeholder="Select an option"
          aria-invalid="true"
        />
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
      <Select options={sampleOptions} placeholder="Small width" style={{ width: '150px' }} />
      <Select options={sampleOptions} placeholder="Medium width (default)" style={{ width: '300px' }} />
      <Select options={sampleOptions} placeholder="Large width" style={{ width: '450px' }} />
      <Select options={sampleOptions} placeholder="Full width" style={{ width: '100%' }} />
    </div>
  ),
};
