import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
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
      description: 'Placeholder text when no value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable select',
    },
    align: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Dropdown alignment',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '300px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Default: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return (
      <Select
        {...args}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// With controlled value
export const WithValue: Story = {
  args: {
    options: sampleOptions,
  },
  render: function Render() {
    const [value, setValue] = useState('option2');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Select
          options={sampleOptions}
          value={value}
          onChange={setValue}
          placeholder="Select an option..."
        />
        <p style={{ fontSize: '14px', color: 'var(--fg-subtle)' }}>
          Selected: {value || 'none'}
        </p>
      </div>
    );
  },
};

// Countries example
export const Countries: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select a country...',
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return (
      <Select
        {...args}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// Sort dropdown example (common use case)
export const SortDropdown: Story = {
  args: {
    options: sortOptions,
  },
  render: function Render() {
    const [value, setValue] = useState('newest');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', color: 'var(--fg-subtle)' }}>Sort:</span>
        <Select
          options={sortOptions}
          value={value}
          onChange={setValue}
          align="end"
        />
      </div>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    options: sampleOptions,
  },
  render: function Render() {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px' }}>
        <Select
          options={sampleOptions}
          placeholder="Disabled (empty)"
          disabled
          value={value}
          onChange={setValue}
        />
        <Select
          options={sampleOptions}
          value="option1"
          onChange={() => {}}
          disabled
        />
      </div>
    );
  },
};

// With disabled options
export const DisabledOptions: Story = {
  args: {
    options: [
      { value: 'available1', label: 'Available Option 1' },
      { value: 'disabled1', label: 'Disabled Option', disabled: true },
      { value: 'available2', label: 'Available Option 2' },
      { value: 'disabled2', label: 'Another Disabled', disabled: true },
      { value: 'available3', label: 'Available Option 3' },
    ],
    placeholder: 'Select an option...',
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return (
      <Select
        {...args}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// Alignment options
export const Alignment: Story = {
  args: {
    options: sampleOptions,
  },
  render: function Render() {
    const [leftValue, setLeftValue] = useState<string>();
    const [rightValue, setRightValue] = useState<string>();
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>align="start"</span>
          <Select
            options={sampleOptions}
            placeholder="Left aligned"
            align="start"
            value={leftValue}
            onChange={setLeftValue}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>align="end"</span>
          <Select
            options={sampleOptions}
            placeholder="Right aligned"
            align="end"
            value={rightValue}
            onChange={setRightValue}
          />
        </div>
      </div>
    );
  },
};

// With labels (form pattern)
export const WithLabels: Story = {
  args: {
    options: sampleOptions,
  },
  render: function Render() {
    const [country, setCountry] = useState<string>();
    const [preference, setPreference] = useState<string>();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="country"
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
          >
            Country
          </label>
          <Select
            options={countryOptions}
            placeholder="Select your country"
            value={country}
            onChange={setCountry}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="preference"
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-default)' }}
          >
            Preference
          </label>
          <Select
            options={sampleOptions}
            placeholder="Select preference"
            value={preference}
            onChange={setPreference}
          />
          <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>
            Choose your preferred option.
          </span>
        </div>
      </div>
    );
  },
};

// Many options (scrollable)
export const ManyOptions: Story = {
  args: {
    options: Array.from({ length: 20 }, (_, i) => ({
      value: `item${i + 1}`,
      label: `Item ${i + 1}`,
    })),
    placeholder: 'Select an item...',
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return (
      <Select
        {...args}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// Custom width
export const CustomWidth: Story = {
  args: {
    options: sampleOptions,
  },
  render: function Render() {
    const [value1, setValue1] = useState<string>();
    const [value2, setValue2] = useState<string>();
    const [value3, setValue3] = useState<string>();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Select
          options={sampleOptions}
          placeholder="Small (150px)"
          className="w-[150px]"
          value={value1}
          onChange={setValue1}
        />
        <Select
          options={sampleOptions}
          placeholder="Medium (250px)"
          className="w-[250px]"
          value={value2}
          onChange={setValue2}
        />
        <Select
          options={sampleOptions}
          placeholder="Large (350px)"
          className="w-[350px]"
          value={value3}
          onChange={setValue3}
        />
      </div>
    );
  },
};
